import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OssController } from './oss.controller';
import { FilesController } from './files.controller';
import { ChunkUploadController } from './chunk-upload.controller';
import { OssService } from './oss.service';
import { ChunkUploadService } from './chunk-upload.service';
import { UrlSigner } from './url-signer';
import { SignUrlInterceptor } from './sign-url.interceptor';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [OssController, FilesController, ChunkUploadController],
  providers: [OssService, ChunkUploadService, UrlSigner, SignUrlInterceptor],
  exports: [OssService, UrlSigner, SignUrlInterceptor],
})
export class OssModule {}
