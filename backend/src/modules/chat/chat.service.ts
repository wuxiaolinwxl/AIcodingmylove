import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../entities/message.entity';
import { OssService } from '../oss/oss.service';
import { LoveScoreService, LOVE_SCORE } from '../couple/love-score.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private msgRepo: Repository<Message>,
    private loveScore: LoveScoreService,
  ) {}

  async createMessage(data: {
    coupleId: number;
    senderId: number;
    msgType: 'text' | 'image' | 'file';
    content?: string;
    ossKey?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: number;
  }) {
    let replyToId: number | null = null;
    let replyToSenderId: number | null = null;
    let replyToSnippet: string | null = null;

    if (data.replyToId) {
      const target = await this.msgRepo.findOne({ where: { id: data.replyToId } });
      if (target && target.coupleId === data.coupleId) {
        replyToId = target.id;
        replyToSenderId = target.senderId;
        if (target.msgType === 'text') {
          const text = (target.content || '').replace(/\s+/g, ' ').trim();
          replyToSnippet = text.length > 120 ? text.slice(0, 120) + '…' : text;
        } else if (target.msgType === 'image') {
          replyToSnippet = '[图片]';
        } else if (target.msgType === 'file') {
          const name = target.fileName || '文件';
          replyToSnippet = `[文件:${name}]`;
        }
      }
    }

    const normalizedKey = OssService.normalizeKey(data.ossKey) ?? undefined;

    const msg = this.msgRepo.create({
      coupleId: data.coupleId,
      senderId: data.senderId,
      msgType: data.msgType,
      content: data.content,
      ossKey: normalizedKey,
      fileName: data.fileName,
      fileSize: data.fileSize,
      replyToId: replyToId ?? undefined,
      replyToSenderId: replyToSenderId ?? undefined,
      replyToSnippet: replyToSnippet ?? undefined,
    });
    const saved = await this.msgRepo.save(msg);
    const score = await this.loveScore.increment(data.coupleId, LOVE_SCORE.CHAT_REPLY);
    return { dto: this.toDto(saved), score };
  }

  toDto(m: Message) {
    if (m.deletedAt) {
      return {
        id: m.id,
        coupleId: m.coupleId,
        senderId: m.senderId,
        msgType: m.msgType,
        content: null,
        ossKey: null,
        ossUrl: null,
        fileName: null,
        fileSize: 0,
        replyToId: null,
        replyToSenderId: null,
        replyToSnippet: null,
        readAt: m.readAt,
        deletedAt: m.deletedAt,
        createdAt: m.createdAt,
      };
    }
    return {
      ...m,
      ossUrl: m.ossKey ? `/uploads/${OssService.normalizeKey(m.ossKey) ?? m.ossKey}` : null,
    };
  }

  async recallMessage(coupleId: number, userId: number, msgId: number) {
    const msg = await this.msgRepo.findOne({ where: { id: msgId } });
    if (!msg || msg.coupleId !== coupleId) {
      throw new NotFoundException('消息不存在');
    }
    if (msg.senderId !== userId) {
      throw new ForbiddenException('只能撤回自己的消息');
    }
    if (msg.deletedAt) {
      return this.toDto(msg);
    }
    const ageMs = Date.now() - new Date(msg.createdAt).getTime();
    if (ageMs > ChatService.RECALL_WINDOW_MS) {
      throw new ForbiddenException('超过2分钟无法撤回');
    }
    msg.deletedAt = new Date();
    const saved = await this.msgRepo.save(msg);
    return this.toDto(saved);
  }

  static readonly RECALL_WINDOW_MS = 2 * 60 * 1000;

  async getHistory(coupleId: number, before?: number, limit = 30) {
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));
    const qb = this.msgRepo.createQueryBuilder('m')
      .where('m.coupleId = :coupleId', { coupleId });

    if (before) {
      qb.andWhere('m.id < :before', { before });
    }

    const items = await qb
      .orderBy('m.id', 'DESC')
      .take(safeLimit)
      .getMany();

    return items.reverse().map((m) => this.toDto(m));
  }

  async search(coupleId: number, q: string, page = 1, pageSize = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const escaped = q.replace(/[%_\\]/g, '\\$&');

    const [items, total] = await this.msgRepo.createQueryBuilder('m')
      .where('m.coupleId = :coupleId', { coupleId })
      .andWhere('m.deletedAt IS NULL')
      .andWhere('(m.content LIKE :kw OR m.fileName LIKE :kw)', { kw: `%${escaped}%` })
      .orderBy('m.id', 'DESC')
      .skip((safePage - 1) * safePageSize)
      .take(safePageSize)
      .getManyAndCount();

    return { items: items.map((m) => this.toDto(m)), total, page: safePage, pageSize: safePageSize };
  }

  async markRead(coupleId: number, readerId: number) {
    await this.msgRepo
      .createQueryBuilder()
      .update(Message)
      .set({ readAt: new Date() })
      .where('coupleId = :coupleId', { coupleId })
      .andWhere('senderId != :readerId', { readerId })
      .andWhere('readAt IS NULL')
      .execute();
  }

  async unreadCount(coupleId: number, userId: number) {
    const count = await this.msgRepo
      .createQueryBuilder('m')
      .where('m.coupleId = :coupleId', { coupleId })
      .andWhere('m.senderId != :userId', { userId })
      .andWhere('m.readAt IS NULL')
      .getCount();
    return { count };
  }
}
