import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Load .env without an extra dependency (Node >= 21). An explicit
// DATABASE_URL (CI, tests, hosting) always wins over the file.
if (!process.env.DATABASE_URL && existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
