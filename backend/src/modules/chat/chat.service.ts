import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Like } from 'typeorm';
import { Message } from '../../entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private msgRepo: Repository<Message>,
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

    const msg = this.msgRepo.create({
      coupleId: data.coupleId,
      senderId: data.senderId,
      msgType: data.msgType,
      content: data.content,
      ossKey: data.ossKey,
      fileName: data.fileName,
      fileSize: data.fileSize,
      replyToId: replyToId ?? undefined,
      replyToSenderId: replyToSenderId ?? undefined,
      replyToSnippet: replyToSnippet ?? undefined,
    });
    return this.msgRepo.save(msg);
  }

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

    return items.reverse();
  }

  async search(coupleId: number, q: string, page = 1, pageSize = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const escaped = q.replace(/[%_\\]/g, '\\$&');

    const [items, total] = await this.msgRepo.createQueryBuilder('m')
      .where('m.coupleId = :coupleId', { coupleId })
      .andWhere('(m.content LIKE :kw OR m.fileName LIKE :kw)', { kw: `%${escaped}%` })
      .orderBy('m.id', 'DESC')
      .skip((safePage - 1) * safePageSize)
      .take(safePageSize)
      .getManyAndCount();

    return { items, total, page: safePage, pageSize: safePageSize };
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
