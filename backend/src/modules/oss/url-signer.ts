import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class UrlSigner {
  private secret: string;
  private ttl: number;

  constructor(config: ConfigService) {
    const secret = config.get<string>('SIGN_SECRET');
    if (!secret || secret.length < 16) {
      throw new Error('SIGN_SECRET is not set or too short. Refusing to start.');
    }
    this.secret = secret;
    this.ttl = parseInt(config.get<string>('SIGN_URL_TTL') || '3600', 10);
  }

  sign(key: string, userId: number, ttl = this.ttl): string {
    const exp = Math.floor(Date.now() / 1000) + ttl;
    const sig = this.compute(key, userId, exp);
    return `/uploads/${key}?u=${userId}&exp=${exp}&sig=${sig}`;
  }

  verify(key: string, userId: number, exp: number, sig: string): boolean {
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    if (!Number.isInteger(userId) || userId <= 0) return false;
    const expected = this.compute(key, userId, exp);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  private compute(key: string, userId: number, exp: number): string {
    return createHmac('sha256', this.secret)
      .update(`${key}|${userId}|${exp}`)
      .digest('hex');
  }
}
