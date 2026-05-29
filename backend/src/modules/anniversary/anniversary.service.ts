import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anniversary } from '../../entities/anniversary.entity';
import { AnniversaryNote } from '../../entities/anniversary-note.entity';
import { Couple } from '../../entities/couple.entity';
import { User } from '../../entities/user.entity';
import { PushService } from '../push/push.service';

interface PresetFestival {
  title: string;
  // MM-DD
  date: string;
}

const PRESET_FESTIVALS: PresetFestival[] = [
  { title: '情人节', date: '02-14' },
  { title: '白色情人节', date: '03-14' },
  { title: '520 表白日', date: '05-20' },
  { title: '521 表白日', date: '05-21' },
  { title: '七夕（公历提示，请按需调整）', date: '08-15' },
  { title: '光棍节', date: '11-11' },
  { title: '圣诞节', date: '12-25' },
  { title: '元旦', date: '01-01' },
];

export interface UpcomingItem {
  id: number;
  title: string;
  kind: string;
  recurrence: string;
  solarDate: string | null;
  lunarDate: string | null;
  lunarIsLeap: boolean;
  remindEnabled: boolean;
  remindDaysBefore: number;
  isPreset: boolean;
  nextDate: string | null;
  daysUntil: number | null;
}

@Injectable()
export class AnniversaryService implements OnModuleInit {
  private readonly logger = new Logger(AnniversaryService.name);

  constructor(
    @InjectRepository(Anniversary)
    private annRepo: Repository<Anniversary>,
    @InjectRepository(AnniversaryNote)
    private noteRepo: Repository<AnniversaryNote>,
    @InjectRepository(Couple)
    private coupleRepo: Repository<Couple>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private pushService: PushService,
  ) {}

  async onModuleInit() {
    // background backfill, never block startup
    this.backfillAllCouples().catch((e) =>
      this.logger.warn(`backfill anniversaries failed: ${(e as Error).message}`),
    );
  }

  private async backfillAllCouples() {
    const couples = await this.coupleRepo.find();
    for (const c of couples) {
      await this.ensurePresets(c.id);
    }
  }

  async ensurePresets(coupleId: number) {
    const couple = await this.coupleRepo.findOne({ where: { id: coupleId } });
    if (!couple) return;

    const userA = await this.userRepo.findOne({ where: { id: couple.userAId } });
    const userB = await this.userRepo.findOne({ where: { id: couple.userBId } });

    const ensureBirthday = async (
      kind: 'birthday_a' | 'birthday_b',
      user: User | null,
    ) => {
      if (!user) return;
      const existing = await this.annRepo.findOne({ where: { coupleId, kind } });
      const title = `${user.nickname || user.username} 的生日`;
      const solar = user.solarBirthday;
      const lunar = user.lunarBirthday;
      const recurrence = solar ? 'yearly_solar' : lunar ? 'yearly_lunar' : 'yearly_solar';
      if (existing) {
        existing.title = title;
        existing.solarDate = solar || null;
        existing.lunarDate = lunar || null;
        existing.lunarIsLeap = !!user.lunarIsLeap;
        existing.recurrence = recurrence;
        existing.isPreset = 1;
        await this.annRepo.save(existing);
        return;
      }
      if (!solar && !lunar) return;
      await this.annRepo.save(
        this.annRepo.create({
          coupleId,
          kind,
          title,
          solarDate: solar || null,
          lunarDate: lunar || null,
          lunarIsLeap: !!user.lunarIsLeap,
          recurrence,
          remindEnabled: true,
          remindDaysBefore: 1,
          isPreset: 1,
        }),
      );
    };

    await ensureBirthday('birthday_a', userA);
    await ensureBirthday('birthday_b', userB);

    if (couple.anniversaryDate) {
      const exist = await this.annRepo.findOne({ where: { coupleId, kind: 'together' } });
      if (exist) {
        exist.title = '在一起纪念日';
        exist.solarDate = couple.anniversaryDate;
        exist.recurrence = 'yearly_solar';
        exist.isPreset = 1;
        await this.annRepo.save(exist);
      } else {
        await this.annRepo.save(
          this.annRepo.create({
            coupleId,
            kind: 'together',
            title: '在一起纪念日',
            solarDate: couple.anniversaryDate,
            lunarDate: null,
            lunarIsLeap: false,
            recurrence: 'yearly_solar',
            remindEnabled: true,
            remindDaysBefore: 1,
            isPreset: 1,
          }),
        );
      }
    }

    for (const f of PRESET_FESTIVALS) {
      const title = f.title;
      const exist = await this.annRepo.findOne({
        where: { coupleId, kind: 'festival', title },
      });
      if (exist) continue;
      const [mm, dd] = f.date.split('-');
      const year = new Date().getFullYear();
      const solarDate = `${year}-${mm}-${dd}`;
      await this.annRepo.save(
        this.annRepo.create({
          coupleId,
          kind: 'festival',
          title,
          solarDate,
          lunarDate: null,
          lunarIsLeap: false,
          recurrence: 'yearly_solar',
          remindEnabled: true,
          remindDaysBefore: 1,
          isPreset: 1,
        }),
      );
    }
  }

  private nextOccurrence(item: Anniversary, today: Date): Date | null {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (item.recurrence === 'yearly_solar' && item.solarDate) {
      const d = new Date(item.solarDate);
      if (Number.isNaN(d.getTime())) return null;
      const m = d.getMonth();
      const day = d.getDate();
      let next = new Date(t.getFullYear(), m, day);
      if (next < t) next = new Date(t.getFullYear() + 1, m, day);
      return next;
    }
    if (item.recurrence === 'none' && item.solarDate) {
      const d = new Date(item.solarDate);
      if (Number.isNaN(d.getTime())) return null;
      const next = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return next < t ? null : next;
    }
    if (item.recurrence === 'yearly_lunar') {
      // lunar conversion not implemented; treat as null (UI will display lunarDate verbatim)
      return null;
    }
    return null;
  }

  async list(coupleId: number) {
    await this.ensurePresets(coupleId);
    const items = await this.annRepo.find({
      where: { coupleId },
      order: { isPreset: 'DESC', id: 'ASC' },
    });
    const today = new Date();
    const out: UpcomingItem[] = items.map((it) => {
      const next = this.nextOccurrence(it, today);
      const days = next
        ? Math.round((next.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000)
        : null;
      return {
        id: it.id,
        title: it.title,
        kind: it.kind,
        recurrence: it.recurrence,
        solarDate: it.solarDate,
        lunarDate: it.lunarDate,
        lunarIsLeap: !!it.lunarIsLeap,
        remindEnabled: it.remindEnabled,
        remindDaysBefore: it.remindDaysBefore,
        isPreset: !!it.isPreset,
        nextDate: next ? this.fmtDate(next) : null,
        daysUntil: days,
      };
    });
    out.sort((a, b) => {
      const ad = a.daysUntil ?? 99999;
      const bd = b.daysUntil ?? 99999;
      return ad - bd;
    });
    return out;
  }

  async create(
    coupleId: number,
    userId: number,
    body: {
      title: string;
      solarDate?: string | null;
      lunarDate?: string | null;
      lunarIsLeap?: boolean;
      recurrence?: string;
      remindEnabled?: boolean;
      remindDaysBefore?: number;
    },
  ) {
    const title = (body.title || '').trim();
    if (!title) throw new BadRequestException('标题不能为空');
    if (!body.solarDate && !body.lunarDate) {
      throw new BadRequestException('请填写公历或农历日期');
    }
    const recurrence = (body.recurrence || (body.solarDate ? 'yearly_solar' : 'yearly_lunar')) as
      | 'none'
      | 'yearly_solar'
      | 'yearly_lunar'
      | 'monthly';
    const saved = await this.annRepo.save(
      this.annRepo.create({
        coupleId,
        kind: 'custom',
        title,
        solarDate: body.solarDate || null,
        lunarDate: body.lunarDate || null,
        lunarIsLeap: !!body.lunarIsLeap,
        recurrence,
        remindEnabled: body.remindEnabled ?? true,
        remindDaysBefore: body.remindDaysBefore ?? 1,
        isPreset: 0,
        createdBy: userId,
      }),
    );
    return saved;
  }

  async update(
    coupleId: number,
    id: number,
    body: {
      title?: string;
      solarDate?: string | null;
      lunarDate?: string | null;
      lunarIsLeap?: boolean;
      recurrence?: string;
      remindEnabled?: boolean;
      remindDaysBefore?: number;
    },
  ) {
    const item = await this.annRepo.findOne({ where: { id } });
    if (!item || item.coupleId !== coupleId) throw new NotFoundException('纪念日不存在');
    if (body.title !== undefined) item.title = body.title.trim();
    if (body.solarDate !== undefined) item.solarDate = body.solarDate || null;
    if (body.lunarDate !== undefined) item.lunarDate = body.lunarDate || null;
    if (body.lunarIsLeap !== undefined) item.lunarIsLeap = !!body.lunarIsLeap;
    if (body.recurrence !== undefined) item.recurrence = body.recurrence as any;
    if (body.remindEnabled !== undefined) item.remindEnabled = !!body.remindEnabled;
    if (body.remindDaysBefore !== undefined) item.remindDaysBefore = Math.max(0, Math.min(30, body.remindDaysBefore));
    await this.annRepo.save(item);
    return item;
  }

  async remove(coupleId: number, id: number) {
    const item = await this.annRepo.findOne({ where: { id } });
    if (!item || item.coupleId !== coupleId) throw new NotFoundException('纪念日不存在');
    if (item.isPreset) throw new ForbiddenException('预设纪念日不可删除，可关闭提醒');
    await this.noteRepo.delete({ anniversaryId: id });
    await this.annRepo.delete({ id });
    return { ok: true };
  }

  async getNotes(coupleId: number, anniversaryId: number) {
    const item = await this.annRepo.findOne({ where: { id: anniversaryId } });
    if (!item || item.coupleId !== coupleId) throw new NotFoundException('纪念日不存在');
    const notes = await this.noteRepo.find({
      where: { anniversaryId, coupleId },
      order: { updatedAt: 'DESC' },
    });
    return notes;
  }

  async upsertMyNote(coupleId: number, userId: number, anniversaryId: number, content: string) {
    const item = await this.annRepo.findOne({ where: { id: anniversaryId } });
    if (!item || item.coupleId !== coupleId) throw new NotFoundException('纪念日不存在');
    const text = (content || '').trim();
    let note = await this.noteRepo.findOne({ where: { anniversaryId, userId } });
    if (!note) {
      note = this.noteRepo.create({ anniversaryId, coupleId, userId, content: text });
    } else {
      note.content = text;
    }
    return this.noteRepo.save(note);
  }

  async deleteMyNote(coupleId: number, userId: number, anniversaryId: number) {
    await this.noteRepo.delete({ anniversaryId, coupleId, userId });
    return { ok: true };
  }

  private fmtDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Run every day at 09:00 local. Looks for anniversaries whose remindDaysBefore matches today's distance.
  @Cron('0 0 9 * * *')
  async sendReminders() {
    const today = new Date();
    const items = await this.annRepo.find({ where: { remindEnabled: true } });
    for (const it of items) {
      try {
        const next = this.nextOccurrence(it, today);
        if (!next) continue;
        const days = Math.round(
          (next.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000,
        );
        if (days !== it.remindDaysBefore && days !== 0) continue;
        const couple = await this.coupleRepo.findOne({ where: { id: it.coupleId } });
        if (!couple) continue;
        const body =
          days === 0 ? `今天是 ${it.title}！` : `还有 ${days} 天就是 ${it.title} 了`;
        await this.pushService.sendToUser(couple.userAId, {
          title: '纪念日提醒',
          body,
          url: '/anniversary',
          tag: `ann-${it.id}-${days}`,
          icon: '/heart.svg',
        });
        await this.pushService.sendToUser(couple.userBId, {
          title: '纪念日提醒',
          body,
          url: '/anniversary',
          tag: `ann-${it.id}-${days}`,
          icon: '/heart.svg',
        });
      } catch (e) {
        this.logger.warn(`reminder ${it.id} failed: ${(e as Error).message}`);
      }
    }
  }
}
