import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fsp } from 'fs';
import * as path from 'path';

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
    await this.rootReady;

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const dir = path.join(this.uploadRoot, scope, String(coupleId), type, dateStr);
    await fsp.mkdir(dir, { recursive: true });

    const ext = path.extname(file.originalname);
    const rand = Math.random().toString(36).slice(2, 10);
    const filename = `${Date.now()}_${rand}${ext}`;
    const filePath = path.join(dir, filename);

    await fsp.writeFile(filePath, file.buffer);

    const key = `${scope}/${coupleId}/${type}/${dateStr}/${filename}`;
    const url = `/uploads/${key}`;

    return { key, url, size: file.size, name: file.originalname };
  }
}
