import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import { healthRoutes } from './routes/health.js';

export const API_VERSION = '0.1.0';

export interface AppDeps {
  config: Config;
  prisma: PrismaClient;
}

export async function buildApp({ config, prisma }: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      // Never log credentials or tokens.
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.query.token',
          'body.password',
          'body.refresh_token',
        ],
        censor: '[redacted]',
      },
    },
    trustProxy: true,
    disableRequestLogging: config.NODE_ENV === 'test',
  });

  await app.register(healthRoutes, { prisma, version: API_VERSION });

  return app;
}
