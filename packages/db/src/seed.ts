// Run with: pnpm --filter @hd-farm/db tsx src/seed.ts
import { db } from './client.js';
import { companies, farms } from './schema/tenancy.js';
import { users } from './schema/auth.js';

async function hashPassword(plain: string): Promise<string> {
  const argon2 = await import('argon2');
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function seed(): Promise<void> {
  console.log('Seeding database...');

  const [company] = await db
    .insert(companies)
    .values({ name: 'HD Farms', code: 'HDF' })
    .onConflictDoNothing()
    .returning({ id: companies.id });

  if (!company) {
    console.log('Company already exists — skipping seed');
    return;
  }

  await db
    .insert(farms)
    .values({ companyId: company.id, name: 'Main Farm' });

  const seedPassword = 'admin@hdfarm.com';
  const passwordHash = await hashPassword(seedPassword);
  await db.insert(users).values({
    companyId: company.id,
    email: 'admin@hdfarm.com',
    passwordHash,
    name: 'Administrator',
    role: 'admin',
  });

  console.log(`Seed complete — admin@hdfarm.com / ${seedPassword}`);
}

seed().catch(console.error);
