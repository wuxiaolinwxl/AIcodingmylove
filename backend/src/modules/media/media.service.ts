import { Injectable, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Memory } from '../../entities/memory.entity';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { ListMemoriesDto } from './dto/list-memories.dto';
import { OssService } from '../oss/oss.service';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Memory)
    private memoryRepo: Repository<Memory>,
    private ossService: OssService,
  ) {}

  async create(coupleId: number, uploaderId: number, dto: CreateMemoryDto) {
    const normKey = OssService.normalizeKey(dto.ossKey) ?? OssService.normalizeKey(dto.ossUrl);
    const normCover = OssService.normalizeKey(dto.coverUrl);
    const memory = this.memoryRepo.create({
      coupleId,
      uploaderId,
      type: dto.type,
      title: dto.title,
      content: dto.content,
      fileName: dto.fileName,
      ossKey: normKey || undefined,
      ossUrl: normKey ? `/uploads/${normKey}` : undefined,
      coverUrl: normCover ? `/uploads/${normCover}` : undefined,
      fileSize: dto.fileSize || 0,
      memoryDate: new Date(dto.memoryDate),
    });
    return this.memoryRepo.save(memory);
  }

  async list(coupleId: number, query: ListMemoriesDto) {
    const { type, start, end, keyword } = query;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.pageSize) || 20));

    const qb = this.memoryRepo.createQueryBuilder('m')
      .where('m.coupleId = :coupleId', { coupleId });

    if (type) {
      qb.andWhere('m.type = :type', { type });
    }
    if (start) {
      qb.andWhere('m.memoryDate >= :start', { start });
    }
    if (end) {
      qb.andWhere('m.memoryDate <= :end', { end });
    }
    if (keyword) {
      qb.andWhere('(m.title LIKE :kw OR m.content LIKE :kw)', { kw: `%${keyword}%` });
    }

    const [items, total] = await qb
      .orderBy('m.memoryDate', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async getMonths(coupleId: number) {
    const results = await this.memoryRepo
      .createQueryBuilder('m')
      .select("DATE_FORMAT(m.memoryDate, '%Y-%m')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('m.coupleId = :coupleId', { coupleId })
      .groupBy('month')
      .orderBy('month', 'DESC')
      .getRawMany();

    return results.map((r) => ({ month: r.month, count: Number(r.count) }));
  }

  async stats(coupleId: number) {
    const rows = await this.memoryRepo
      .createQueryBuilder('m')
      .select('m.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('m.coupleId = :coupleId', { coupleId })
      .groupBy('m.type')
      .getRawMany();

    const result: Record<string, number> = { photo: 0, video: 0, song: 0, text: 0, file: 0 };
    for (const r of rows) {
      result[r.type] = Number(r.count);
    }
    return result;
  }

  async remove(id: number, userId: number, coupleId: number) {
    const memory = await this.memoryRepo.findOne({ where: { id, coupleId } });
    if (!memory) {
      throw new NotFoundException('记忆不存在');
    }
    if (memory.uploaderId !== userId) {
      throw new ForbiddenException('只能删除自己上传的记忆');
    }
    const ossKey = memory.ossKey;
    await this.memoryRepo.remove(memory);
    if (ossKey) {
      try {
        await this.ossService.deleteByKey(ossKey);
      } catch (e) {
        this.logger.warn(`Failed to delete upload file for memory ${id}: ${(e as Error).message}`);
      }
    }
    return { success: true };
  }
}
