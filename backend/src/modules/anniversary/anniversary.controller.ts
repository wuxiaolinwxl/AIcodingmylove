import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CoupleGuard } from '../../common/couple.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AnniversaryService } from './anniversary.service';

@Controller('anniversary')
@UseGuards(JwtAuthGuard, CoupleGuard)
export class AnniversaryController {
  constructor(private svc: AnniversaryService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.svc.list(user.coupleId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.svc.create(user.coupleId, user.userId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.svc.update(user.coupleId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(user.coupleId, id);
  }

  @Get(':id/notes')
  notes(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.getNotes(user.coupleId, id);
  }

  @Put(':id/notes/me')
  upsertMyNote(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { content: string },
  ) {
    return this.svc.upsertMyNote(user.coupleId, user.userId, id, body.content);
  }

  @Delete(':id/notes/me')
  deleteMyNote(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteMyNote(user.coupleId, user.userId, id);
  }
}
