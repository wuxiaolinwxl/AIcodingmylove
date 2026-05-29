import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fsp } from 'fs';
import * as path from 'path';

const ALLOWED_SCOPES = new Set(['memory', 'chat', 'avatar']);
const ALLOWED_TYPES = new Set(['photo', 'video', 'song', 'file', 'image']);

function decodeOriginalName(raw: string): string {
  if (!raw) return raw;
  const bytes = Buffer.from(raw, 'binary');
  const utf8 = bytes.toString('utf8');
  const roundtrip = Buffer.from(utf8, 'utf8').toString('binary');
  return roundtrip === raw ? utf8 : raw;
}

@Injectable()
export class OssService {
  private uploadRoot: string;
  private rootReady: Promise<void>;

  constructor(private config: ConfigService) {
    this.uploadRoot = this.config.get('UPLOAD_DIR', '/root/AIcoding/uploads');
    this.rootReady = fsp.mkdir(this.uploadRoot, { recursive: true }).then(() => undefined);
  }

  async saveFile(
    file: Express.Multer.File,
    coupleId: number,
    scope: string,
    type: string,
  ) {
    if (!file) {
      throw new BadRequestException('未提供文件');
    }
    if (!ALLOWED_SCOPES.has(scope)) {
      throw new BadRequestException('无效的 scope');
    }
    if (!ALLOWED_TYPES.has(type)) {
      throw new BadRequestException('无效的 type');
    }
    if (!Number.isInteger(coupleId) || coupleId <= 0) {
      throw new BadRequestException('无效的 coupleId');
    }

    await this.rootReady;

    const originalName = decodeOriginalName(file.originalname);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const dir = path.join(this.uploadRoot, scope, String(coupleId), type, dateStr);

    const rootResolved = path.resolve(this.uploadRoot);
    const dirResolved = path.resolve(dir);
    if (!dirResolved.startsWith(rootResolved + path.sep) && dirResolved !== rootResolved) {
      throw new BadRequestException('非法的存储路径');
    }

    await fsp.mkdir(dir, { recursive: true });

    const ext = path.extname(originalName).slice(0, 16);
    const rand = Math.random().toString(36).slice(2, 10);
    const filename = `${Date.now()}_${rand}${ext}`;
    const filePath = path.join(dir, filename);

    if (!path.resolve(filePath).startsWith(rootResolved + path.sep)) {
      throw new BadRequestException('非法的文件路径');
    }

    await fsp.writeFile(filePath, file.buffer);

    const key = `${scope}/${coupleId}/${type}/${dateStr}/${filename}`;
    const url = `/uploads/${key}`;

    return { key, url, size: file.size, name: originalName };
  }

  async deleteByKey(key: string | null | undefined): Promise<boolean> {
    if (!key || typeof key !== 'string') return false;
    if (key.includes('..') || key.startsWith('/')) return false;

    await this.rootReady;
    const rootResolved = path.resolve(this.uploadRoot);
    const target = path.resolve(this.uploadRoot, key);
    if (!target.startsWith(rootResolved + path.sep)) return false;

    try {
      await fsp.unlink(target);
      return true;
    } catch (e: any) {
      if (e?.code === 'ENOENT') return false;
      throw e;
    }
  }
}
