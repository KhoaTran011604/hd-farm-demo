import { eq, and, isNull, sql } from 'drizzle-orm';
import { pens, zones, animals } from '@hd-farm/db';
import type { Database } from '@hd-farm/db';
import { AppError } from '../../utils/errors.js';

async function assertZoneOwnership(db: Database, companyId: string, zoneId: string) {
  const [zone] = await db.select({ id: zones.id, farmId: zones.farmId }).from(zones)
    .where(and(eq(zones.id, zoneId), eq(zones.companyId, companyId), isNull(zones.deletedAt)))
    .limit(1);
  if (!zone) throw new AppError('Zone not found', 404, 'NOT_FOUND');
  return zone;
}

export async function listPens(db: Database, companyId: string, zoneId: string) {
  await assertZoneOwnership(db, companyId, zoneId);
  return db.select({
    id: pens.id,
    companyId: pens.companyId,
    farmId: pens.farmId,
    zoneId: pens.zoneId,
    name: pens.name,
    capacity: pens.capacity,
    createdAt: pens.createdAt,
    updatedAt: pens.updatedAt,
    deletedAt: pens.deletedAt,
    currentCount: sql<number>`(
      SELECT COUNT(*)::int FROM animals
      WHERE pen_id = pens.id AND deleted_at IS NULL
    )`,
  }).from(pens)
    .where(and(eq(pens.zoneId, zoneId), eq(pens.companyId, companyId), isNull(pens.deletedAt)));
}

export async function createPen(
  db: Database,
  companyId: string,
  data: { zoneId: string; name: string; capacity?: number }
) {
  const zone = await assertZoneOwnership(db, companyId, data.zoneId);
  const [pen] = await db.insert(pens)
    .values({ companyId, farmId: zone.farmId, ...data })
    .returning();
  return pen;
}

export async function updatePen(
  db: Database,
  companyId: string,
  penId: string,
  data: { name?: string; capacity?: number }
) {
  const [existing] = await db.select({ id: pens.id }).from(pens)
    .where(and(eq(pens.id, penId), eq(pens.companyId, companyId), isNull(pens.deletedAt)))
    .limit(1);
  if (!existing) throw new AppError('Pen not found', 404, 'NOT_FOUND');
  const [updated] = await db.update(pens)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pens.id, penId))
    .returning();
  return updated;
}

export async function deletePen(db: Database, companyId: string, penId: string) {
  const [existing] = await db.select({ id: pens.id }).from(pens)
    .where(and(eq(pens.id, penId), eq(pens.companyId, companyId), isNull(pens.deletedAt)))
    .limit(1);
  if (!existing) throw new AppError('Pen not found', 404, 'NOT_FOUND');

  // reject delete if animals still occupy the pen
  const [{ count }] = await db.select({ count: sql<number>`COUNT(*)::int` })
    .from(animals)
    .where(and(eq(animals.penId, penId), isNull(animals.deletedAt)));
  if (count > 0) throw new AppError('Pen has active animals', 409, 'PEN_NOT_EMPTY');

  await db.update(pens).set({ deletedAt: new Date() }).where(eq(pens.id, penId));
}
