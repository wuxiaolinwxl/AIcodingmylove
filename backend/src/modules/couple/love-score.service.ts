import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Couple } from '../../entities/couple.entity';

export const LOVE_SCORE = {
  CHAT_REPLY: 0.02,
  MEMORY_CREATE: 0.5,
};

@Injectable()
export class LoveScoreService {
  constructor(
    @InjectRepository(Couple)
    private coupleRepo: Repository<Couple>,
  ) {}

  async increment(coupleId: number, delta: number): Promise<number> {
    if (!coupleId || !delta) return this.get(coupleId);
    const result = await this.coupleRepo.query(
      'UPDATE couples SET loveScore = loveScore + ? WHERE id = ?; SELECT loveScore FROM couples WHERE id = ?',
      [delta, coupleId, coupleId],
    );
    const rows = Array.isArray(result) ? result[result.length - 1] : result;
    if (Array.isArray(rows) && rows.length > 0) {
      return Number(rows[0].loveScore);
    }
    return this.get(coupleId);
  }

  async get(coupleId: number): Promise<number> {
    const couple = await this.coupleRepo.findOne({
      where: { id: coupleId },
      select: ['id', 'loveScore'],
    });
    return couple ? Number(couple.loveScore) : 0;
  }
}
