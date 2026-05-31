import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { OssService } from './oss.service';

interface ChunkSession {
  coupleId: number;
  userId: number;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  scope: string;
  type: string;
  receivedChunks: Set<number>;
  tempDir: string;
  createdAt: number;
}

interface SessionMeta {
  coupleId: number;
  userId: number;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  scope: string;
  type: string;
  receivedChunks: number[];
  createdAt: number;
}

const CHUNK_TTL = 3600 * 1000;
const META_FILE = '_meta.json';

@Injectable()
export class ChunkUploadService implements OnModuleInit {
  private sessions = new Map<string, ChunkSession>();

  constructor(private ossService: OssService) {}

  async onModuleInit() {
    await this.restoreSessions();
  }

  private getChunksRoot(): string {
    return path.join(this.ossService.getUploadRoot(), '_chunks');
  }

  private async persistMeta(uploadId: string, session: ChunkSession) {
    const meta: SessionMeta = {
      coupleId: session.coupleId,
      userId: session.userId,
      fileName: session.fileName,
      fileSize: session.fileSize,
      totalChunks: session.totalChunks,
      scope: session.scope,
      type: session.type,
      receivedChunks: [...session.receivedChunks],
      createdAt: session.createdAt,
    };
    const metaPath = path.join(session.tempDir, META_FILE);
    await fsp.writeFile(metaPath, JSON.stringify(meta));
  }

  private async restoreSessions() {
    const chunksRoot = this.getChunksRoot();
    let entries: string[];
    try {
      entries = await fsp.readdir(chunksRoot);
    } catch {
      return;
    }

    for (const uploadId of entries) {
      const tempDir = path.join(chunksRoot, uploadId);
      const metaPath = path.join(tempDir, META_FILE);
      try {
        const stat = await fsp.stat(tempDir);
        if (!stat.isDirectory()) continue;
        const raw = await fsp.readFile(metaPath, 'utf-8');
        const meta: SessionMeta = JSON.parse(raw);
        if (Date.now() - meta.createdAt > CHUNK_TTL) {
          await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
          continue;
        }
        this.sessions.set(uploadId, {
          ...meta,
          receivedChunks: new Set(meta.receivedChunks),
          tempDir,
        });
      } catch {
        await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  }

  async initUpload(
    coupleId: number,
    userId: number,
    data: { fileName: string; fileSize: number; totalChunks: number; scope: string; type: string },
  ) {
    if (!data.fileName || !data.fileSize || !data.totalChunks) {
      throw new BadRequestException('缺少必填参数');
    }
    if (data.totalChunks > 500) {
      throw new BadRequestException('分片数过多');
    }
    const uploadId = `${coupleId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const uploadRoot = this.ossService.getUploadRoot();
    const tempDir = path.join(uploadRoot, '_chunks', uploadId);
    await fsp.mkdir(tempDir, { recursive: true });

    const session: ChunkSession = {
      coupleId,
      userId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      totalChunks: data.totalChunks,
      scope: data.scope || 'memory',
      type: data.type || 'file',
      receivedChunks: new Set(),
      tempDir,
      createdAt: Date.now(),
    };

    this.sessions.set(uploadId, session);
    await this.persistMeta(uploadId, session);

    return { uploadId, totalChunks: data.totalChunks };
  }

  async uploadChunk(uploadId: string, chunkIndex: number, buffer: Buffer) {
    const session = this.sessions.get(uploadId);
    if (!session) throw new NotFoundException('上传会话不存在或已过期');
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new BadRequestException('无效的分片序号');
    }

    const chunkPath = path.join(session.tempDir, `chunk_${chunkIndex}`);
    await fsp.writeFile(chunkPath, buffer);
    session.receivedChunks.add(chunkIndex);
    await this.persistMeta(uploadId, session);

    return {
      chunkIndex,
      received: session.receivedChunks.size,
      total: session.totalChunks,
    };
  }

  async merge(uploadId: string) {
    const session = this.sessions.get(uploadId);
    if (!session) throw new NotFoundException('上传会话不存在或已过期');
    if (session.receivedChunks.size < session.totalChunks) {
      throw new BadRequestException(
        `还有 ${session.totalChunks - session.receivedChunks.size} 个分片未上传`,
      );
    }

    const chunks: Buffer[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path.join(session.tempDir, `chunk_${i}`);
      chunks.push(await fsp.readFile(chunkPath));
    }
    const merged = Buffer.concat(chunks);

    const result = await this.ossService.saveFileFromBuffer(
      merged,
      session.fileName,
      session.coupleId,
      session.scope,
      session.type,
    );

    await fsp.rm(session.tempDir, { recursive: true, force: true }).catch(() => {});
    this.sessions.delete(uploadId);

    return result;
  }

  @Cron('0 */30 * * * *')
  async cleanupExpired() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt > CHUNK_TTL) {
        await fsp.rm(session.tempDir, { recursive: true, force: true }).catch(() => {});
        this.sessions.delete(id);
      }
    }
  }
}
