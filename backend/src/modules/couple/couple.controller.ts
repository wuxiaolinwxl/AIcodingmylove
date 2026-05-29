import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CoupleService } from './couple.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CoupleGuard } from '../../common/couple.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AcceptInviteDto, UpdateCoupleInfoDto } from './dto/couple.dto';

@Controller('couple')
@UseGuards(JwtAuthGuard)
export class CoupleController {
  constructor(private coupleService: CoupleService) {}

  @Post('invite')
  createInvite(@CurrentUser() user: any) {
    return this.coupleService.createInvite(user.userId);
  }

  @Post('accept')
  acceptInvite(@CurrentUser() user: any, @Body() body: AcceptInviteDto) {
    return this.coupleService.acceptInvite(user.userId, body.code);
  }

  @Get('info')
  @UseGuards(CoupleGuard)
  getInfo(@CurrentUser() user: any) {
    return this.coupleService.getInfo(user.coupleId);
  }

  @Patch('info')
  @UseGuards(CoupleGuard)
  updateInfo(@CurrentUser() user: any, @Body() body: UpdateCoupleInfoDto) {
    return this.coupleService.updateInfo(user.coupleId, body);
  }
}
