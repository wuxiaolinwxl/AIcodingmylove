import {
  Body,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CoupleGuard } from '../../common/couple.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ChunkUploadService } from './chunk-upload.service';

@Controller('oss/chunk')
@UseGuards(JwtAuthGuard, CoupleGuard)
export class ChunkUploadController {
  constructor(private chunkService: ChunkUploadService) {}

  @Post('init')
  init(
    @CurrentUser() user: any,
    @Body() body: { fileName: string; fileSize: number; totalChunks: number; scope?: string; type?: string },
  ) {
    return this.chunkService.initUpload(user.coupleId, user.userId, {
      fileName: body.fileName,
      fileSize: body.fileSize,
      totalChunks: body.totalChunks,
      scope: body.scope || 'memory',
      type: body.type || 'file',
    });
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadChunk(
    @Query('uploadId') uploadId: string,
    @Query('chunkIndex') chunkIndex: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chunkService.uploadChunk(uploadId, Number(chunkIndex), file.buffer);
  }

  @Post('merge')
  async merge(@Body() body: { uploadId: string }) {
    return this.chunkService.merge(body.uploadId);
  }
}
