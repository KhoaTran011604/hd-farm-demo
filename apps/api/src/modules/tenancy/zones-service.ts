import { eq, and, isNull, sql } from 'drizzle-orm';
import { zones, farms, pens } from '@hd-farm/db';
import type { Database } from '@hd-farm/db';
import { AppError } from '../../utils/errors.js';

async function assertFarmOwnership(db: Database, companyId: string, farmId: string) {
  const [farm] = await db.select({ id: farms.id }).from(farms)
    .where(and(eq(farms.id, farmId), eq(farms.companyId, companyId), isNull(farms.deletedAt)))
    .limit(1);
  if (!farm) throw new AppError('Farm not found', 404, 'NOT_FOUND');
}

export async function listZones(db: Database, companyId: string, farmId: string) {
  await assertFarmOwnership(db, companyId, farmId);
  return db.select().from(zones)
    .where(and(eq(zones.farmId, farmId), eq(zones.companyId, companyId), isNull(zones.deletedAt)));
}

export async function createZone(
  db: Database,
  companyId: string,
  data: { farmId: string; name: string; type?: string }
) {
  await assertFarmOwnership(db, companyId, data.farmId);
  const [zone] = await db.insert(zones).values({ companyId, ...data }).returning();
  return zone;
}

export async function updateZone(
  db: Database,
  companyId: string,
  zoneId: string,
  data: { name?: string; type?: string }
) {
  const [existing] = await db.select({ id: zones.id }).from(zones)
    .where(and(eq(zones.id, zoneId), eq(zones.companyId, companyId), isNull(zones.deletedAt)))
    .limit(1);
  if (!existing) throw new AppError('Zone not found', 404, 'NOT_FOUND');
  const [updated] = await db.update(zones)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(zones.id, zoneId))
    .returning();
  return updated;
}

export async function deleteZone(db: Database, companyId: string, zoneId: string) {
  const [existing] = await db.select({ id: zones.id }).from(zones)
    .where(and(eq(zones.id, zoneId), eq(zones.companyId, companyId), isNull(zones.deletedAt)))
    .limit(1);
  if (!existing) throw new AppError('Zone not found', 404, 'NOT_FOUND');

  const [{ count }] = await db.select({ count: sql<number>`COUNT(*)::int` })
    .from(pens)
    .where(and(eq(pens.zoneId, zoneId), isNull(pens.deletedAt)));
  if (count > 0) throw new AppError('Zone has active pens', 409, 'ZONE_NOT_EMPTY');

  await db.update(zones).set({ deletedAt: new Date() }).where(eq(zones.id, zoneId));
}
