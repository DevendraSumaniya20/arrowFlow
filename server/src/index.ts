import { existsSync } from 'node:fs';
import { z } from 'zod';
import { buildApp } from './app';
import { createDb } from './db';

if (!process.env.DATABASE_URL && existsSync('.env')) {
  process.loadEnvFile('.env');
}

const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().int().default(3000),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z.string().default('info'),
    TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  })
  .parse(process.env);

async function main() {
  const db = createDb(env.DATABASE_URL);
  const app = await buildApp({
    db,
    fastify: { logger: { level: env.LOG_LEVEL }, trustProxy: env.TRUST_PROXY === 'true' },
  });
  const shutdown = async () => {
    await app.close();
    await db.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
