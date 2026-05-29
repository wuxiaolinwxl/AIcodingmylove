import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CoupleGuard } from '../../common/couple.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { BucketService } from './bucket.service';

@Controller('bucket')
@UseGuards(JwtAuthGuard, CoupleGuard)
export class BucketController {
  constructor(private bucket: BucketService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.bucket.list(user.coupleId);
  }

  @Post(':id/toggle')
  toggle(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.bucket.toggleComplete(user.coupleId, user.userId, id);
  }

  @Post('custom')
  addCustom(
    @CurrentUser() user: any,
    @Body() body: { title: string; category?: string },
  ) {
    return this.bucket.addCustom(user.coupleId, user.userId, body.title, body.category);
  }

  @Delete('custom/:id')
  removeCustom(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.bucket.removeCustom(user.coupleId, id);
  }
}
