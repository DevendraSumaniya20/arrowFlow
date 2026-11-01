import rateLimit from '@fastify/rate-limit';
import Fastify, { FastifyServerOptions } from 'fastify';
import { ZodError } from 'zod';
import type { Db } from './db';
import { HttpError } from './errors';
import { dailyRoutes } from './routes/daily';
import { levelRoutes } from './routes/levels';
import { playerRoutes } from './routes/players';

export interface AppOptions {
  db: Db;
  now?: () => Date; // injectable clock for tests
  rateLimit?: boolean;
  fastify?: FastifyServerOptions;
}

export async function buildApp({ db, now = () => new Date(), rateLimit: limit = true, fastify }: AppOptions) {
  const app = Fastify(fastify);

  if (limit) {
    // Per-IP: 120 req/min overall; stricter per-route limits live on the routes.
    await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  }

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({ error: 'invalid_request', issues: err.issues });
    }
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: err.code, message: err.message });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      return reply.code(status).send({ error: 'request_error', message: (err as Error).message });
    }
    req.log.error(err);
    return reply.code(500).send({ error: 'internal' });
  });

  app.get('/health', async () => {
    await db.$queryRaw`SELECT 1`;
    return { ok: true };
  });

  playerRoutes(app, db);
  dailyRoutes(app, db, now);
  levelRoutes(app, db);
  return app;
}
