/**
 * Vercel Serverless entry point for the NestJS API.
 * The bootstrapped app is cached across warm invocations to avoid re-initialising
 * the DI container on every request.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import serverlessHttp from 'serverless-http';
import type { IncomingMessage, ServerResponse } from 'http';

type ServerlessHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

let cachedHandler: ServerlessHandler | null = null;

async function createHandler(): Promise<ServerlessHandler> {
  const app = await NestFactory.create(AppModule, {
    // Suppress logs in serverless — Vercel captures stdout anyway
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

  // Wrap the underlying Express instance with serverless-http
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serverlessHttp(app.getHttpAdapter().getInstance()) as unknown as ServerlessHandler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cachedHandler) {
    cachedHandler = await createHandler();
  }
  return cachedHandler(req, res);
}
