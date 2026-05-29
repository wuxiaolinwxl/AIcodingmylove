import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BucketItem } from '../../entities/bucket-item.entity';
import { BucketCompletion } from '../../entities/bucket-completion.entity';
import { Couple } from '../../entities/couple.entity';
import { BucketController } from './bucket.controller';
import { BucketService } from './bucket.service';

@Module({
  imports: [TypeOrmModule.forFeature([BucketItem, BucketCompletion, Couple])],
  controllers: [BucketController],
  providers: [BucketService],
})
export class BucketModule {}
