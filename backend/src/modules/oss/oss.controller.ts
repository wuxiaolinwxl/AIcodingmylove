import {
  Controller,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { OssService } from './oss.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CoupleGuard } from '../../common/couple.guard';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('oss')
@UseGuards(JwtAuthGuard, CoupleGuard)
export class OssController {
  constructor(private ossService: OssService) {}

  @Post('upload')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Query('scope') scope: string,
    @Query('type') type: string,
  ) {
    return this.ossService.saveFile(
      file,
      user.coupleId,
      scope || 'memory',
      type || 'photo',
    );
  }
}
