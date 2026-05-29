import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Invitation } from '../../entities/invitation.entity';

@Injectable()
export class InvitationCleanupTask {
  private readonly logger = new Logger(InvitationCleanupTask.name);

  constructor(
    @InjectRepository(Invitation)
    private invitationRepo: Repository<Invitation>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expirePendingInvitations() {
    const res = await this.invitationRepo
      .createQueryBuilder()
      .update(Invitation)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'pending' })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();
    if (res.affected && res.affected > 0) {
      this.logger.log(`Expired ${res.affected} stale pending invitations`);
    }
  }
}
