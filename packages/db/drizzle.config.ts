import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

// Load env from monorepo root when running from packages/db
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const url = process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL is not set. Check .env.local at repo root.');

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
});
