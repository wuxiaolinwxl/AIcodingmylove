import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThan } from 'typeorm';
import { Couple } from '../../entities/couple.entity';
import { Invitation } from '../../entities/invitation.entity';
import { User } from '../../entities/user.entity';

const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

@Injectable()
export class CoupleService {
  constructor(
    @InjectRepository(Couple)
    private coupleRepo: Repository<Couple>,
    @InjectRepository(Invitation)
    private invitationRepo: Repository<Invitation>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createInvite(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    if (user.coupleId) {
      throw new ConflictException('你已经绑定了伴侣');
    }

    const existing = await this.invitationRepo.findOne({
      where: {
        inviterId: userId,
        status: 'pending',
        expiresAt: MoreThan(new Date()),
      },
    });
    if (existing) {
      return { code: existing.code, expiresAt: existing.expiresAt };
    }

    const code = nanoid();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const invitation = this.invitationRepo.create({
      inviterId: userId,
      code,
      expiresAt,
      status: 'pending',
    });
    await this.invitationRepo.save(invitation);
    return { code, expiresAt };
  }

  async acceptInvite(userId: number, code: string) {
    const coupleId = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const inviteRepo = manager.getRepository(Invitation);
      const coupleRepo = manager.getRepository(Couple);

      const user = await userRepo.findOne({ where: { id: userId }, lock: { mode: 'pessimistic_write' } });
      if (!user) throw new NotFoundException('用户不存在');
      if (user.coupleId) throw new ConflictException('你已经绑定了伴侣');

      const invitation = await inviteRepo.findOne({
        where: { code, status: 'pending' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!invitation) throw new BadRequestException('邀请码无效');
      if (invitation.expiresAt < new Date()) {
        await inviteRepo.update(invitation.id, { status: 'expired' });
        throw new BadRequestException('邀请码已过期');
      }
      if (invitation.inviterId === userId) {
        throw new BadRequestException('不能接受自己的邀请码');
      }

      const inviter = await userRepo.findOne({
        where: { id: invitation.inviterId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!inviter) throw new NotFoundException('邀请人不存在');
      if (inviter.coupleId) throw new ConflictException('对方已经绑定了伴侣');

      const spaceName = `${inviter.nickname || inviter.username} & ${user.nickname || user.username}`.slice(0, 60);
      const couple = coupleRepo.create({
        userAId: invitation.inviterId,
        userBId: userId,
        spaceName,
      });
      const saved = (await coupleRepo.save(couple)) as Couple;

      await userRepo.update(invitation.inviterId, { coupleId: saved.id });
      await userRepo.update(userId, { coupleId: saved.id });
      await inviteRepo.update(invitation.id, { status: 'used', usedBy: userId });

      return saved.id;
    });

    return this.getInfo(coupleId);
  }

  async getInfo(coupleId: number) {
    const couple = await this.coupleRepo.findOne({ where: { id: coupleId } });
    if (!couple) {
      throw new NotFoundException('未找到空间信息');
    }

    const members = await this.userRepo.find({
      where: [{ id: couple.userAId }, { id: couple.userBId }],
      select: ['id', 'username', 'nickname', 'avatarUrl'],
    });

    return {
      id: couple.id,
      spaceName: couple.spaceName,
      anniversaryDate: couple.anniversaryDate,
      createdAt: couple.createdAt,
      members,
    };
  }

  async updateInfo(coupleId: number, dto: { spaceName?: string; anniversaryDate?: string }) {
    await this.coupleRepo.update(coupleId, dto);
    return this.getInfo(coupleId);
  }
}
