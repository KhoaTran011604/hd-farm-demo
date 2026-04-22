import { eq, and, isNull, inArray, sql, asc } from 'drizzle-orm';
import { animals, pens, zones, healthRecords } from '@hd-farm/db';
import type { Database } from '@hd-farm/db';
import { paginate } from '../../utils/pagination.js';
import { AppError } from '../../utils/errors.js';
import { PAGE_SIZE, MAX_PAGE_SIZE } from '@hd-farm/shared';
import type { HealthStatus, AnimalSpecies } from '@hd-farm/shared';

export interface AnimalListFilters {
  farmId?: string;
  zoneId?: string;
  penId?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}

export async function listAnimals(db: Database, companyId: string, filters: AnimalListFilters) {
  const limit = Math.min(filters.limit ?? PAGE_SIZE, MAX_PAGE_SIZE);

  let whereClause = and(eq(animals.companyId, companyId), isNull(animals.deletedAt));

  if (filters.farmId) whereClause = and(whereClause, eq(animals.farmId, filters.farmId));
  if (filters.penId) whereClause = and(whereClause, eq(animals.penId, filters.penId));
  if (filters.status) whereClause = and(whereClause, eq(animals.status, filters.status as HealthStatus));
  // composite keyset cursor: encode as "isoDate|uuid" to avoid collisions on identical timestamps
  if (filters.cursor) {
    const [ts, afterId] = filters.cursor.split('|');
    if (ts && afterId) {
      whereClause = and(
        whereClause,
        sql`(${animals.createdAt}, ${animals.id}) > (${new Date(ts)}, ${afterId})`
      );
    }
  }

  if (filters.zoneId) {
    const zonePens = await db.select({ id: pens.id }).from(pens)
      .where(and(eq(pens.zoneId, filters.zoneId), eq(pens.companyId, companyId), isNull(pens.deletedAt)));
    if (zonePens.length === 0) return { items: [], nextCursor: null };
    whereClause = and(whereClause, inArray(animals.penId, zonePens.map((p) => p.id)));
  }

  const items = await db.select().from(animals)
    .where(whereClause)
    .orderBy(asc(animals.createdAt), asc(animals.id))
    .limit(limit + 1);

  return paginate(items, limit, (item) => `${item.createdAt.toISOString()}|${item.id}`);
}

export async function getAnimalById(db: Database, companyId: string, animalId: string) {
  const [animal] = await db.select().from(animals)
    .where(and(eq(animals.id, animalId), eq(animals.companyId, companyId), isNull(animals.deletedAt)))
    .limit(1);
  if (!animal) throw new AppError('Animal not found', 404, 'NOT_FOUND');

  return enrichWithPenZone(db, animal);
}

export async function getAnimalByQr(db: Database, companyId: string, qrCode: string) {
  const [animal] = await db.select().from(animals)
    .where(and(eq(animals.qrCode, qrCode), eq(animals.companyId, companyId), isNull(animals.deletedAt)))
    .limit(1);
  if (!animal) throw new AppError('Animal not found', 404, 'NOT_FOUND');

  return enrichWithPenZone(db, animal);
}

async function enrichWithPenZone(db: Database, animal: typeof animals.$inferSelect) {
  let pen = null;
  let zone = null;

  if (animal.penId) {
    const [penRow] = await db.select({
      id: pens.id,
      name: pens.name,
      capacity: pens.capacity,
      zoneId: pens.zoneId,
      currentCount: sql<number>`(
        SELECT COUNT(*)::int FROM animals
        WHERE pen_id = ${pens.id} AND deleted_at IS NULL
      )`,
    }).from(pens).where(eq(pens.id, animal.penId)).limit(1);

    if (penRow) {
      pen = penRow;
      const [zoneRow] = await db.select({ id: zones.id, name: zones.name, type: zones.type })
        .from(zones).where(eq(zones.id, penRow.zoneId)).limit(1);
      zone = zoneRow ?? null;
    }
  }

  return { animal, pen, zone };
}

export async function createAnimal(
  db: Database,
  companyId: string,
  data: { name: string; species: AnimalSpecies; penId: string; typeMetadata?: Record<string, unknown> }
) {
  // capacity guard + derive farmId from pen
  const [penRow] = await db.select({
    id: pens.id,
    companyId: pens.companyId,
    farmId: pens.farmId,
    capacity: pens.capacity,
  }).from(pens)
    .where(and(eq(pens.id, data.penId), eq(pens.companyId, companyId), isNull(pens.deletedAt)))
    .limit(1);
  if (!penRow) throw new AppError('Pen not found', 404, 'NOT_FOUND');

  if (penRow.capacity !== null) {
    const [{ count }] = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(animals)
      .where(and(eq(animals.penId, data.penId), isNull(animals.deletedAt)));
    if (count >= penRow.capacity) throw new AppError('Pen is at capacity', 409, 'PEN_FULL');
  }

  const { randomUUID } = await import('crypto');
  const qrCode = randomUUID();

  const [animal] = await db.insert(animals)
    .values({ companyId, farmId: penRow.farmId, qrCode, ...data })
    .returning();
  return animal;
}

export async function updateAnimal(
  db: Database,
  companyId: string,
  animalId: string,
  data: { name?: string; penId?: string; typeMetadata?: Record<string, unknown> }
) {
  const [existing] = await db.select({ id: animals.id, farmId: animals.farmId }).from(animals)
    .where(and(eq(animals.id, animalId), eq(animals.companyId, companyId), isNull(animals.deletedAt)))
    .limit(1);
  if (!existing) throw new AppError('Animal not found', 404, 'NOT_FOUND');

  if (data.penId) {
    const [penRow] = await db.select({ id: pens.id, capacity: pens.capacity }).from(pens)
      .where(and(eq(pens.id, data.penId), eq(pens.companyId, companyId), isNull(pens.deletedAt)))
      .limit(1);
    if (!penRow) throw new AppError('Pen not found', 404, 'NOT_FOUND');
    if (penRow.capacity !== null) {
      const [{ count }] = await db.select({ count: sql<number>`COUNT(*)::int` })
        .from(animals)
        .where(and(eq(animals.penId, data.penId), isNull(animals.deletedAt)));
      if (count >= penRow.capacity) throw new AppError('Pen is at capacity', 409, 'PEN_FULL');
    }
  }

  const [updated] = await db.update(animals)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(animals.id, animalId))
    .returning();
  return updated;
}

export async function updateAnimalStatus(
  db: Database,
  companyId: string,
  animalId: string,
  userId: string,
  data: { status: string; reason?: string }
) {
  const [existing] = await db.select({ id: animals.id, farmId: animals.farmId }).from(animals)
    .where(and(eq(animals.id, animalId), eq(animals.companyId, companyId), isNull(animals.deletedAt)))
    .limit(1);
  if (!existing) throw new AppError('Animal not found', 404, 'NOT_FOUND');

  const healthAuditStatuses: HealthStatus[] = ['healthy', 'monitoring', 'sick', 'quarantine'];

  await db.transaction(async (tx) => {
    await tx.update(animals)
      .set({ status: data.status as HealthStatus, updatedAt: new Date() })
      .where(eq(animals.id, animalId));

    if (healthAuditStatuses.includes(data.status as HealthStatus)) {
      await tx.insert(healthRecords).values({
        companyId,
        farmId: existing.farmId,
        animalId,
        checkerId: userId,
        status: data.status as 'healthy' | 'monitoring' | 'sick' | 'quarantine',
        notes: data.reason,
      });
    }
  });

  const [updated] = await db.select().from(animals).where(eq(animals.id, animalId)).limit(1);
  return updated;
}

export async function softDeleteAnimal(db: Database, companyId: string, animalId: string) {
  const [existing] = await db.select({ id: animals.id }).from(animals)
    .where(and(eq(animals.id, animalId), eq(animals.companyId, companyId), isNull(animals.deletedAt)))
    .limit(1);
  if (!existing) throw new AppError('Animal not found', 404, 'NOT_FOUND');
  await db.update(animals).set({ deletedAt: new Date() }).where(eq(animals.id, animalId));
}
