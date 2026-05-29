import { Controller, Post, Get, Delete, Body, Query, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CoupleGuard } from '../../common/couple.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { ListMemoriesDto } from './dto/list-memories.dto';

@Controller('memories')
@UseGuards(JwtAuthGuard, CoupleGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateMemoryDto) {
    return this.mediaService.create(user.coupleId, user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: any, @Query() query: ListMemoriesDto) {
    return this.mediaService.list(user.coupleId, query);
  }

  @Get('months')
  getMonths(@CurrentUser() user: any) {
    return this.mediaService.getMonths(user.coupleId);
  }

  @Get('stats')
  stats(@CurrentUser() user: any) {
    return this.mediaService.stats(user.coupleId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.mediaService.remove(id, user.userId, user.coupleId);
  }
}
