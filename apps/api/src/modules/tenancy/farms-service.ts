import { eq, and, isNull, sql } from 'drizzle-orm';
import { farms, zones } from '@hd-farm/db';
import type { Database } from '@hd-farm/db';
import { AppError } from '../../utils/errors.js';

export async function listFarms(db: Database, companyId: string) {
  return db.select().from(farms)
    .where(and(eq(farms.companyId, companyId), isNull(farms.deletedAt)));
}

export async function getFarm(db: Database, companyId: string, farmId: string) {
  const [farm] = await db.select().from(farms)
    .where(and(eq(farms.id, farmId), eq(farms.companyId, companyId), isNull(farms.deletedAt)))
    .limit(1);
  if (!farm) throw new AppError('Farm not found', 404, 'NOT_FOUND');
  return farm;
}

export async function createFarm(
  db: Database,
  companyId: string,
  data: { name: string; location?: string }
) {
  const [farm] = await db.insert(farms).values({ companyId, ...data }).returning();
  return farm;
}

export async function updateFarm(
  db: Database,
  companyId: string,
  farmId: string,
  data: { name?: string; location?: string }
) {
  const [existing] = await db.select({ id: farms.id }).from(farms)
    .where(and(eq(farms.id, farmId), eq(farms.companyId, companyId), isNull(farms.deletedAt)))
    .limit(1);
  if (!existing) throw new AppError('Farm not found', 404, 'NOT_FOUND');
  const [updated] = await db.update(farms)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(farms.id, farmId))
    .returning();
  return updated;
}

export async function deleteFarm(db: Database, companyId: string, farmId: string) {
  const [existing] = await db.select({ id: farms.id }).from(farms)
    .where(and(eq(farms.id, farmId), eq(farms.companyId, companyId), isNull(farms.deletedAt)))
    .limit(1);
  if (!existing) throw new AppError('Farm not found', 404, 'NOT_FOUND');

  const [{ count }] = await db.select({ count: sql<number>`COUNT(*)::int` })
    .from(zones)
    .where(and(eq(zones.farmId, farmId), isNull(zones.deletedAt)));
  if (count > 0) throw new AppError('Farm has active zones', 409, 'FARM_NOT_EMPTY');

  await db.update(farms).set({ deletedAt: new Date() }).where(eq(farms.id, farmId));
}
