import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BucketItem } from '../../entities/bucket-item.entity';
import { BucketCompletion } from '../../entities/bucket-completion.entity';
import { Couple } from '../../entities/couple.entity';
import { BUCKET_CATEGORIES, BUCKET_SEED } from './bucket.seed';

export interface ItemDto {
  id: number;
  category: string;
  title: string;
  isCustom: boolean;
  createdBy: number | null;
  completed: boolean;
  completedAt: string | null;
  checks: { userId: number; completedAt: string }[];
}

@Injectable()
export class BucketService implements OnModuleInit {
  constructor(
    @InjectRepository(BucketItem)
    private itemRepo: Repository<BucketItem>,
    @InjectRepository(BucketCompletion)
    private compRepo: Repository<BucketCompletion>,
    @InjectRepository(Couple)
    private coupleRepo: Repository<Couple>,
  ) {}

  async onModuleInit() {
    const count = await this.itemRepo.count({ where: { coupleId: IsNull() } });
    if (count >= BUCKET_SEED.length) return;
    if (count > 0) return;
    let i = 0;
    for (const s of BUCKET_SEED) {
      await this.itemRepo.save(
        this.itemRepo.create({
          coupleId: null,
          category: s.category,
          title: s.title,
          isCustom: 0,
          sortOrder: i++,
        }),
      );
    }
  }

  async list(coupleId: number) {
    const couple = await this.coupleRepo.findOne({ where: { id: coupleId } });
    const memberIds = couple ? [couple.userAId, couple.userBId].filter(Boolean) : [];
    const requiredCount = memberIds.length >= 2 ? 2 : 1;

    const items = await this.itemRepo
      .createQueryBuilder('i')
      .where('i.coupleId IS NULL OR i.coupleId = :coupleId', { coupleId })
      .orderBy('i.isCustom', 'ASC')
      .addOrderBy('i.sortOrder', 'ASC')
      .addOrderBy('i.id', 'ASC')
      .getMany();
    const completions = await this.compRepo.find({ where: { coupleId } });
    const compMap = new Map<number, BucketCompletion[]>();
    for (const c of completions) {
      const arr = compMap.get(c.itemId) || [];
      arr.push(c);
      compMap.set(c.itemId, arr);
    }
    let doneCount = 0;
    const dto: ItemDto[] = items.map((it) => {
      const list = compMap.get(it.id) || [];
      const distinctMembers = new Set<number>();
      for (const c of list) {
        if (memberIds.length === 0 || memberIds.includes(c.completedBy)) {
          distinctMembers.add(c.completedBy);
        }
      }
      const completed = distinctMembers.size >= requiredCount;
      if (completed) doneCount++;
      const sorted = list.slice().sort(
        (a, b) => a.completedAt.getTime() - b.completedAt.getTime(),
      );
      const completedAt = completed
        ? sorted[sorted.length - 1].completedAt.toISOString()
        : null;
      return {
        id: it.id,
        category: it.category,
        title: it.title,
        isCustom: !!it.isCustom,
        createdBy: it.createdBy,
        completed,
        completedAt,
        checks: sorted.map((c) => ({
          userId: c.completedBy,
          completedAt: c.completedAt.toISOString(),
        })),
      };
    });
    return {
      categories: BUCKET_CATEGORIES,
      items: dto,
      total: items.length,
      done: doneCount,
    };
  }

  async toggleComplete(coupleId: number, userId: number, itemId: number) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('条目不存在');
    if (item.coupleId !== null && item.coupleId !== coupleId) {
      throw new ForbiddenException('无权操作');
    }
    const mine = await this.compRepo.findOne({
      where: { coupleId, itemId, completedBy: userId },
    });
    if (mine) {
      await this.compRepo.delete({ id: mine.id });
    } else {
      await this.compRepo.save(
        this.compRepo.create({ coupleId, itemId, completedBy: userId }),
      );
    }
    const couple = await this.coupleRepo.findOne({ where: { id: coupleId } });
    const memberIds = couple ? [couple.userAId, couple.userBId].filter(Boolean) : [];
    const requiredCount = memberIds.length >= 2 ? 2 : 1;
    const all = await this.compRepo.find({ where: { coupleId, itemId } });
    const sorted = all.slice().sort(
      (a, b) => a.completedAt.getTime() - b.completedAt.getTime(),
    );
    const distinct = new Set<number>();
    for (const c of all) {
      if (memberIds.length === 0 || memberIds.includes(c.completedBy)) {
        distinct.add(c.completedBy);
      }
    }
    const completed = distinct.size >= requiredCount;
    const completedAt = completed
      ? sorted[sorted.length - 1].completedAt.toISOString()
      : null;
    return {
      itemId,
      completed,
      completedAt,
      checks: sorted.map((c) => ({
        userId: c.completedBy,
        completedAt: c.completedAt.toISOString(),
      })),
    };
  }

  async addCustom(coupleId: number, userId: number, title: string, category?: string) {
    const t = (title || '').trim();
    if (!t) throw new BadRequestException('标题不能为空');
    if (t.length > 200) throw new BadRequestException('标题过长');
    const cat = category && BUCKET_CATEGORIES.includes(category) ? category : '自定义';
    const saved = await this.itemRepo.save(
      this.itemRepo.create({
        coupleId,
        category: cat,
        title: t,
        isCustom: 1,
        sortOrder: 9999,
        createdBy: userId,
      }),
    );
    return saved;
  }

  async removeCustom(coupleId: number, itemId: number) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('条目不存在');
    if (item.coupleId !== coupleId || !item.isCustom) {
      throw new ForbiddenException('只能删除本空间自定义条目');
    }
    await this.compRepo.delete({ coupleId, itemId });
    await this.itemRepo.delete({ id: itemId });
    return { ok: true };
  }
}
