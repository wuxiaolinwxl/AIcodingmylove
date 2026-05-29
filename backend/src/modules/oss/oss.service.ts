import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fsp } from 'fs';
import * as path from 'path';

const ALLOWED_SCOPES = new Set(['memory', 'chat', 'avatar']);
const ALLOWED_TYPES = new Set(['photo', 'video', 'song', 'file', 'image']);

interface TypeRule {
  exts: Set<string>;
  mimes: Set<string>;
}

const TYPE_RULES: Record<string, TypeRule> = {
  photo: {
    exts: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']),
    mimes: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']),
  },
  video: {
    exts: new Set(['.mp4', '.mov', '.webm', '.m4v']),
    mimes: new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']),
  },
  song: {
    exts: new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac']),
    mimes: new Set(['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/aac']),
  },
  file: {
    exts: new Set([
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.md', '.csv', '.zip', '.rar', '.7z',
    ]),
    mimes: new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/markdown', 'text/csv',
      'application/zip', 'application/x-zip-compressed',
      'application/x-rar-compressed', 'application/vnd.rar',
      'application/x-7z-compressed',
    ]),
  },
};
TYPE_RULES.image = TYPE_RULES.photo;

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

    const rule = TYPE_RULES[type];
    if (!rule) {
      throw new BadRequestException('不支持的 type');
    }
    const originalName = decodeOriginalName(file.originalname);
    const extLower = path.extname(originalName).toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    if (!rule.exts.has(extLower) || !rule.mimes.has(mime)) {
      throw new BadRequestException(`不支持的文件类型: ${extLower || '无扩展名'} / ${mime || '未知 MIME'}`);
    }

    await this.rootReady;

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

  static normalizeKey(input: string | null | undefined): string | null {
    if (!input || typeof input !== 'string') return null;
    let s = input.split('?')[0];
    if (s.startsWith('/uploads/')) s = s.slice('/uploads/'.length);
    if (!s || s.includes('..') || s.startsWith('/')) return null;
    return s;
  }
}
