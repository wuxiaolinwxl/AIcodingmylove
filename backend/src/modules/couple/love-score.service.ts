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
    await this.coupleRepo.query(
      'UPDATE couples SET loveScore = loveScore + ? WHERE id = ?',
      [delta, coupleId],
    );
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
