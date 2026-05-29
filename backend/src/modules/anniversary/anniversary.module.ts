import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anniversary } from '../../entities/anniversary.entity';
import { AnniversaryNote } from '../../entities/anniversary-note.entity';
import { Couple } from '../../entities/couple.entity';
import { User } from '../../entities/user.entity';
import { PushModule } from '../push/push.module';
import { AnniversaryController } from './anniversary.controller';
import { AnniversaryService } from './anniversary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Anniversary, AnniversaryNote, Couple, User]),
    PushModule,
  ],
  controllers: [AnniversaryController],
  providers: [AnniversaryService],
})
export class AnniversaryModule {}
