import { Module } from '@nestjs/common';
import { OssController } from './oss.controller';
import { FilesController } from './files.controller';
import { OssService } from './oss.service';
import { UrlSigner } from './url-signer';
import { SignUrlInterceptor } from './sign-url.interceptor';

@Module({
  controllers: [OssController, FilesController],
  providers: [OssService, UrlSigner, SignUrlInterceptor],
  exports: [OssService, UrlSigner, SignUrlInterceptor],
})
export class OssModule {}
