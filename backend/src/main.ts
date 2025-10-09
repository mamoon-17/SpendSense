import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'; // <-- Correct import

async function bootstrap() {
  // Development-only: allow self-signed certs to avoid TLS errors with poolers/proxies
  // Do NOT enable this in production
  process.env.NODE_TLS_REJECT_UNAUTHORIZED =
    process.env.NODE_TLS_REJECT_UNAUTHORIZED ?? '0';
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); // <-- Add cookie-parser middleware

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
