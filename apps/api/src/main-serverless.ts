import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import type { INestApplication } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedApp: INestApplication | null = null;

async function bootstrap(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn'],
  });

  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.enableCors({
    origin: corsOrigin,
    credentials: corsOrigin !== '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  await app.init();
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  const expressApp = cachedApp.getHttpAdapter().getInstance();
  expressApp(req, res);
}
