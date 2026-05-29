import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Memory } from '../../entities/memory.entity';
import { OssModule } from '../oss/oss.module';

@Module({
  imports: [TypeOrmModule.forFeature([Memory]), OssModule],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
