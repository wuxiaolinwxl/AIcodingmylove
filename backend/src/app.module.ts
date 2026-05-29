import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CoupleModule } from './modules/couple/couple.module';
import { MediaModule } from './modules/media/media.module';
import { ChatModule } from './modules/chat/chat.module';
import { OssModule } from './modules/oss/oss.module';
import { PushModule } from './modules/push/push.module';
import { User } from './entities/user.entity';
import { Couple } from './entities/couple.entity';
import { Invitation } from './entities/invitation.entity';
import { Memory } from './entities/memory.entity';
import { Message } from './entities/message.entity';
import { PushSubscription } from './entities/push-subscription.entity';

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(`${key} is not set. Refusing to start.`);
  }
  return v;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
    ]),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: requireEnv('DB_USER'),
      password: requireEnv('DB_PASSWORD'),
      database: requireEnv('DB_NAME'),
      entities: [User, Couple, Invitation, Memory, Message, PushSubscription],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      charset: 'utf8mb4',
      timezone: '+08:00',
    }),
    AuthModule,
    UserModule,
    CoupleModule,
    MediaModule,
    ChatModule,
    OssModule,
    PushModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
