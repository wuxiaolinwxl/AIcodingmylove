import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SignUrlInterceptor } from './modules/oss/sign-url.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.setGlobalPrefix('api', { exclude: ['uploads/(.*)'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(app.get(SignUrlInterceptor));

  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length > 1 ? origins : origins[0],
    credentials: origins.length === 1,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
