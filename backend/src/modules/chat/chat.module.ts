import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Message } from '../../entities/message.entity';
import { User } from '../../entities/user.entity';
import { Couple } from '../../entities/couple.entity';
import { PushModule } from '../push/push.module';
import { OssModule } from '../oss/oss.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, Couple]),
    PushModule,
    OssModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not set. Refusing to start with an insecure default.');
        }
        return { secret };
      },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
