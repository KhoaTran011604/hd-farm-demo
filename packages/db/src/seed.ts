// Run with: pnpm --filter @hd-farm/db tsx src/seed.ts
import { db } from './client.js';
import { companies, farms, zones, pens } from './schema/tenancy.js';
import { animalTypes, vaccineTypes, feedTypes, diseaseTypes } from './schema/config.js';
import { animals } from './schema/animals.js';
import { users } from './schema/auth.js';
import { randomUUID } from 'crypto';

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

  const [farm] = await db
    .insert(farms)
    .values({ companyId: company.id, name: 'Main Farm', location: 'Hà Nội' })
    .returning({ id: farms.id });

  const seedPassword = 'admin@hdfarm.com';
  const passwordHash = await hashPassword(seedPassword);
  await db.insert(users).values({
    companyId: company.id,
    email: 'admin@hdfarm.com',
    passwordHash,
    name: 'Administrator',
    role: 'admin',
  });

  // zones
  const [zoneA, zoneB] = await db
    .insert(zones)
    .values([
      { companyId: company.id, farmId: farm.id, name: 'Khu A', type: 'breeding' },
      { companyId: company.id, farmId: farm.id, name: 'Khu B', type: 'fattening' },
    ])
    .returning({ id: zones.id });

  // pens (2 per zone)
  const [pen1, pen2, pen3, pen4] = await db
    .insert(pens)
    .values([
      { companyId: company.id, farmId: farm.id, zoneId: zoneA!.id, name: 'Ô 1', capacity: 20 },
      { companyId: company.id, farmId: farm.id, zoneId: zoneA!.id, name: 'Ô 2', capacity: 20 },
      { companyId: company.id, farmId: farm.id, zoneId: zoneB!.id, name: 'Ô 3', capacity: 30 },
      { companyId: company.id, farmId: farm.id, zoneId: zoneB!.id, name: 'Ô 4', capacity: 30 },
    ])
    .returning({ id: pens.id });

  // config reference data
  await db.insert(animalTypes).values([
    { species: 'heo', name: 'Heo thịt', description: 'Heo nuôi lấy thịt' },
    { species: 'gà', name: 'Gà thịt', description: 'Gà nuôi lấy thịt' },
    { species: 'bò', name: 'Bò thịt', description: 'Bò nuôi lấy thịt' },
  ]);

  await db.insert(vaccineTypes).values([
    { name: 'FMD', species: 'heo', description: 'Lở mồm long móng', intervalDays: 180 },
    { name: 'PRRS', species: 'heo', description: 'Tai xanh heo', intervalDays: 120 },
    { name: 'Newcastle', species: 'gà', description: 'Newcastle bệnh', intervalDays: 90 },
    { name: 'Gumboro', species: 'gà', description: 'Gumboro', intervalDays: 60 },
    { name: 'LSD', species: 'bò', description: 'Viêm da nổi cục', intervalDays: 365 },
  ]);

  await db.insert(feedTypes).values([
    { name: 'Cám heo thịt', species: 'heo', description: 'Cám số 9' },
    { name: 'Cám heo nái', species: 'heo', description: 'Cám số 6' },
    { name: 'Cám gà thịt', species: 'gà', description: 'Cám gà đậm đặc' },
    { name: 'Cám gà đẻ', species: 'gà', description: 'Cám bổ sung canxi' },
    { name: 'Cỏ voi', species: 'bò', description: 'Cỏ tươi cắt nhỏ' },
  ]);

  await db.insert(diseaseTypes).values([
    { name: 'Tả lợn Châu Phi', species: 'heo', symptoms: 'Sốt cao, xuất huyết' },
    { name: 'Cúm gia cầm', species: 'gà', symptoms: 'Sốt, khó thở, tiêu chảy' },
    { name: 'Tụ huyết trùng', species: 'bò', symptoms: 'Sốt, sưng họng, khó thở' },
    { name: 'Viêm phổi', symptoms: 'Ho, khó thở' },
    { name: 'Tiêu chảy', symptoms: 'Phân lỏng, mất nước' },
  ]);

  // 10 sample animals across pens
  const penIds = [pen1!.id, pen2!.id, pen3!.id, pen4!.id];
  const speciesList = ['heo', 'heo', 'heo', 'gà', 'gà', 'bò', 'heo', 'heo', 'gà', 'bò'] as const;
  const penAssign = [0, 0, 1, 1, 2, 2, 3, 3, 0, 1];

  await db.insert(animals).values(
    speciesList.map((species, i) => ({
      companyId: company.id,
      farmId: farm.id,
      penId: penIds[penAssign[i]!]!,
      name: `${species.charAt(0).toUpperCase()}${species.slice(1)} #${String(i + 1).padStart(2, '0')}`,
      species,
      status: 'healthy' as const,
      qrCode: randomUUID(),
    }))
  );

  console.log(`Seed complete — admin@hdfarm.com / ${seedPassword}`);
  console.log('Created: 1 farm, 2 zones, 4 pens, 3 animal_types, 5 vaccine_types, 5 feed_types, 5 disease_types, 10 animals');
}

seed().catch(console.error);
