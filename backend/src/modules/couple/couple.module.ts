import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoupleController } from './couple.controller';
import { CoupleService } from './couple.service';
import { LoveScoreService } from './love-score.service';
import { InvitationCleanupTask } from './invitation-cleanup.task';
import { Couple } from '../../entities/couple.entity';
import { Invitation } from '../../entities/invitation.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Couple, Invitation, User])],
  controllers: [CoupleController],
  providers: [CoupleService, LoveScoreService, InvitationCleanupTask],
  exports: [CoupleService, LoveScoreService],
})
export class CoupleModule {}
