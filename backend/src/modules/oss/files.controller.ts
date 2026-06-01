import {
  Controller,
  Get,
  Req,
  Res,
  Query,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { UrlSigner } from './url-signer';
import { User } from '../../entities/user.entity';

@Controller('uploads')
export class FilesController {
  private uploadRoot: string;

  constructor(
    config: ConfigService,
    private signer: UrlSigner,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    const dir = config.get<string>('UPLOAD_DIR');
    if (!dir) {
      throw new Error('环境变量 UPLOAD_DIR 未配置，请在 .env 中设置上传目录');
    }
    this.uploadRoot = path.resolve(dir);
  }

  @Get('*')
  async serve(
    @Req() req: Request,
    @Res() res: Response,
    @Query('u') uRaw: string,
    @Query('exp') expRaw: string,
    @Query('sig') sig: string,
  ) {
    const rawKey = req.path.replace(/^\/uploads\//, '');
    const key = decodeURIComponent(rawKey);

    if (!key || key.includes('..')) {
      throw new ForbiddenException('非法路径');
    }
    if (!sig || !uRaw || !expRaw) {
      throw new ForbiddenException('缺少签名');
    }

    const userId = parseInt(uRaw, 10);
    const exp = parseInt(expRaw, 10);

    if (!this.signer.verify(key, userId, exp, sig)) {
      throw new ForbiddenException('签名无效或已过期');
    }

    const segments = key.split('/');
    const scope = segments[0];
    const ownerId = parseInt(segments[1] || '', 10);
    if (!Number.isInteger(ownerId)) {
      throw new ForbiddenException('非法路径');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException('用户不存在');

    if (scope === 'avatar') {
      if (user.coupleId !== ownerId) {
        throw new ForbiddenException('无权访问');
      }
    } else if (user.coupleId !== ownerId) {
      throw new ForbiddenException('无权访问');
    }

    const abs = path.resolve(this.uploadRoot, key);
    if (!abs.startsWith(this.uploadRoot + path.sep)) {
      throw new ForbiddenException('非法路径');
    }

    try {
      await fsp.access(abs);
    } catch {
      throw new NotFoundException('文件不存在');
    }

    res.setHeader('Cache-Control', 'private, max-age=300');
    res.sendFile(abs);
  }
}
