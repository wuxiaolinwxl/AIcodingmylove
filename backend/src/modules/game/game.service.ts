import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamePlay } from '../../entities/game-play.entity';
import { LoveScoreService } from '../couple/love-score.service';
import { TRUTH_PROMPTS, DARE_PROMPTS, QUIZ_QUESTIONS, DICE_FACES } from './game.bank';

const SUPPORTED = ['truth_dare', 'dice', 'quiz'] as const;
type GameKey = (typeof SUPPORTED)[number];

const PER_PLAY_SCORE = 0.5;

export interface RollResult {
  game: GameKey;
  result: any;
  score: number;
}

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GamePlay)
    private playRepo: Repository<GamePlay>,
    private loveScore: LoveScoreService,
  ) {}

  catalog() {
    return [
      {
        key: 'truth_dare',
        title: '真心话大冒险',
        emoji: '💋',
        desc: '随机抽一张真心话或大冒险，敢不敢？',
        score: PER_PLAY_SCORE,
      },
      {
        key: 'dice',
        title: '甜蜜骰子',
        emoji: '🎲',
        desc: '掷一颗骰子，按指令完成一件甜蜜小事。',
        score: PER_PLAY_SCORE,
      },
      {
        key: 'quiz',
        title: '默契问答',
        emoji: '💞',
        desc: '抽 5 道关于彼此的问题，看谁更懂对方。',
        score: PER_PLAY_SCORE,
      },
    ];
  }

  async play(coupleId: number, userId: number, game: string, payload?: any): Promise<RollResult> {
    if (!SUPPORTED.includes(game as GameKey)) {
      throw new BadRequestException('未知游戏');
    }
    const result = this.generateResult(game as GameKey, payload);
    await this.playRepo.save(
      this.playRepo.create({
        coupleId,
        userId,
        game,
        result: this.summarize(game as GameKey, result),
      }),
    );
    const score = await this.loveScore.increment(coupleId, PER_PLAY_SCORE);
    return { game: game as GameKey, result, score };
  }

  async recent(coupleId: number, limit = 20) {
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const items = await this.playRepo.find({
      where: { coupleId },
      order: { id: 'DESC' },
      take: safeLimit,
    });
    return items;
  }

  private generateResult(game: GameKey, payload?: any) {
    if (game === 'truth_dare') {
      const mode: 'truth' | 'dare' =
        payload?.mode === 'truth' || payload?.mode === 'dare'
          ? payload.mode
          : Math.random() < 0.5
            ? 'truth'
            : 'dare';
      const bank = mode === 'truth' ? TRUTH_PROMPTS : DARE_PROMPTS;
      const prompt = bank[Math.floor(Math.random() * bank.length)];
      return { mode, prompt };
    }
    if (game === 'dice') {
      const idx = Math.floor(Math.random() * DICE_FACES.length);
      return { face: idx + 1, ...DICE_FACES[idx] };
    }
    if (game === 'quiz') {
      const pool = [...QUIZ_QUESTIONS];
      const out: { q: string }[] = [];
      const k = Math.min(5, pool.length);
      for (let i = 0; i < k; i++) {
        const j = Math.floor(Math.random() * pool.length);
        out.push(pool.splice(j, 1)[0]);
      }
      return { questions: out };
    }
    return {};
  }

  private summarize(game: GameKey, result: any): string {
    try {
      if (game === 'truth_dare') {
        return `[${result.mode === 'truth' ? '真心话' : '大冒险'}] ${result.prompt}`.slice(0, 500);
      }
      if (game === 'dice') {
        return `🎲 ${result.face}：${result.label}`.slice(0, 500);
      }
      if (game === 'quiz') {
        return `默契问答 ${result.questions?.length || 0} 题`.slice(0, 500);
      }
    } catch {
      // ignore
    }
    return null as any;
  }
}
