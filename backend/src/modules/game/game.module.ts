import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamePlay } from '../../entities/game-play.entity';
import { CoupleModule } from '../couple/couple.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';

@Module({
  imports: [TypeOrmModule.forFeature([GamePlay]), CoupleModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
