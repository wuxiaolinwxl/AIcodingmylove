import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from '../../entities/push-subscription.entity';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private publicKey = '';
  private privateKey = '';
  private subject = 'mailto:admin@memory-space.local';
  private enabled = false;

  constructor(
    private config: ConfigService,
    @InjectRepository(PushSubscription)
    private subRepo: Repository<PushSubscription>,
  ) {}

  onModuleInit() {
    this.publicKey = this.config.get<string>('VAPID_PUBLIC_KEY') || '';
    this.privateKey = this.config.get<string>('VAPID_PRIVATE_KEY') || '';
    this.subject = this.config.get<string>('VAPID_SUBJECT') || this.subject;
    if (this.publicKey && this.privateKey) {
      try {
        webpush.setVapidDetails(this.subject, this.publicKey, this.privateKey);
        this.enabled = true;
        this.logger.log('Web Push enabled');
      } catch (e: any) {
        this.logger.warn('VAPID setup failed: ' + e?.message);
      }
    } else {
      this.logger.warn('VAPID keys missing — Web Push disabled');
    }
  }

  getPublicKey() {
    return { publicKey: this.publicKey };
  }

  async subscribe(userId: number, coupleId: number | null, body: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) {
    if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
      return { ok: false };
    }
    const cid = coupleId ?? undefined;
    let row: PushSubscription | null = await this.subRepo.findOne({ where: { endpoint: body.endpoint } });
    if (row) {
      row.userId = userId;
      row.coupleId = cid as any;
      row.p256dh = body.keys.p256dh;
      row.auth = body.keys.auth;
      row.userAgent = body.userAgent?.slice(0, 250) || row.userAgent;
    } else {
      row = this.subRepo.create({
        userId,
        coupleId: cid,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: body.userAgent?.slice(0, 250),
      } as any) as unknown as PushSubscription;
    }
    await this.subRepo.save(row);
    return { ok: true };
  }

  async unsubscribe(endpoint: string) {
    if (!endpoint) return { ok: false };
    await this.subRepo.delete({ endpoint });
    return { ok: true };
  }

  async sendToUser(userId: number, payload: { title: string; body: string; url?: string; tag?: string; icon?: string }) {
    if (!this.enabled) return;
    const subs = await this.subRepo.find({ where: { userId } });
    if (subs.length === 0) return;
    const data = JSON.stringify(payload);
    const dead: number[] = [];
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            data,
            { TTL: 60 * 60 * 12 },
          );
        } catch (e: any) {
          const status = e?.statusCode;
          if (status === 404 || status === 410) {
            dead.push(sub.id);
          } else {
            this.logger.warn(`push failed [${status}] ${e?.body || e?.message}`);
          }
        }
      }),
    );
    if (dead.length) {
      await this.subRepo.delete({ id: In(dead) });
    }
  }
}
