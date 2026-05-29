import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CoupleGuard } from '../../common/couple.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { GameService } from './game.service';

@Controller('game')
@UseGuards(JwtAuthGuard, CoupleGuard)
export class GameController {
  constructor(private svc: GameService) {}

  @Get()
  catalog() {
    return this.svc.catalog();
  }

  @Get('recent')
  recent(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.svc.recent(user.coupleId, limit ? Number(limit) : 20);
  }

  @Post(':game/play')
  play(
    @CurrentUser() user: any,
    @Param('game') game: string,
    @Body() payload: any,
  ) {
    return this.svc.play(user.coupleId, user.userId, game, payload);
  }
}
