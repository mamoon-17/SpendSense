import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // Development-only: allow self-signed certs to avoid TLS errors with poolers/proxies
  // Do NOT enable this in production
  process.env.NODE_TLS_REJECT_UNAUTHORIZED =
    process.env.NODE_TLS_REJECT_UNAUTHORIZED ?? '0';
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : [
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:3000',
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.use(cookieParser()); // <-- Add cookie-parser middleware

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on port ${port}`);
}

void bootstrap();
