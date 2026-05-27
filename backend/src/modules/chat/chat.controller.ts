import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CoupleGuard } from '../../common/couple.guard';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard, CoupleGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('search')
  search(@CurrentUser() user: any, @Query() query: { q: string; page?: number; pageSize?: number }) {
    return this.chatService.search(user.coupleId, query.q, Number(query.page) || 1, Number(query.pageSize) || 20);
  }

  @Get()
  getHistory(@CurrentUser() user: any, @Query() query: { before?: string; limit?: string }) {
    return this.chatService.getHistory(user.coupleId, query.before ? Number(query.before) : undefined, Number(query.limit) || 30);
  }
}
