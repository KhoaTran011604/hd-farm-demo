import { eq, and, isNull, inArray, count, desc } from 'drizzle-orm';
import { animals, pens, zones } from '@hd-farm/db';
import type { Database } from '@hd-farm/db';
import type { HealthStatus } from '@hd-farm/shared';

const ALERT_STATUSES: HealthStatus[] = ['sick', 'quarantine'];
const TASK_STATUSES: HealthStatus[] = ['monitoring', 'sick', 'quarantine'];

async function enrichWithPenZone(db: Database, companyId: string, animalRows: typeof animals.$inferSelect[]) {
  const penIds = [...new Set(animalRows.map((a) => a.penId).filter(Boolean))] as string[];
  if (penIds.length === 0) return animalRows.map((a) => ({ ...a, penName: null, zoneName: null }));

  const penRows = await db
    .select({ id: pens.id, name: pens.name, zoneId: pens.zoneId })
    .from(pens)
    .where(and(inArray(pens.id, penIds), eq(pens.companyId, companyId), isNull(pens.deletedAt)));

  const zoneIds = [...new Set(penRows.map((p) => p.zoneId).filter(Boolean))] as string[];
  const zoneRows = zoneIds.length
    ? await db
        .select({ id: zones.id, name: zones.name })
        .from(zones)
        .where(and(inArray(zones.id, zoneIds), eq(zones.companyId, companyId), isNull(zones.deletedAt)))
    : [];

  const penMap = new Map(penRows.map((p) => [p.id, p]));
  const zoneMap = new Map(zoneRows.map((z) => [z.id, z]));

  return animalRows.map((a) => {
    const pen = a.penId ? penMap.get(a.penId) : null;
    const zone = pen?.zoneId ? zoneMap.get(pen.zoneId) : null;
    return { ...a, penName: pen?.name ?? null, zoneName: zone?.name ?? null };
  });
}

export async function getWorkerTasks(db: Database, companyId: string) {
  const taskAnimals = await db
    .select()
    .from(animals)
    .where(
      and(
        eq(animals.companyId, companyId),
        isNull(animals.deletedAt),
        inArray(animals.status, TASK_STATUSES)
      )
    )
    .orderBy(animals.updatedAt)
    .limit(20);

  const [totalRow] = await db
    .select({ count: count() })
    .from(animals)
    .where(and(eq(animals.companyId, companyId), isNull(animals.deletedAt)));

  const enriched = await enrichWithPenZone(db, companyId, taskAnimals);

  return {
    tasks: enriched.map((a) => ({
      animalId: a.id,
      animalName: a.name,
      species: a.species,
      status: a.status,
      qrCode: a.qrCode,
      penName: a.penName,
      zoneName: a.zoneName,
      action: ALERT_STATUSES.includes(a.status as HealthStatus) ? 'check_health' : 'monitor',
    })),
    totalAnimals: totalRow?.count ?? 0,
  };
}

export async function getManagerOverview(db: Database, companyId: string) {
  const where = and(eq(animals.companyId, companyId), isNull(animals.deletedAt));

  const [totalResults, healthyResults, sickResults, monitoringResults, recentResults] = await Promise.all([
    db.select({ count: count() }).from(animals).where(where),
    db.select({ count: count() }).from(animals).where(and(where, eq(animals.status, 'healthy'))),
    db.select().from(animals).where(and(where, inArray(animals.status, ALERT_STATUSES))).limit(50),
    db.select({ count: count() }).from(animals).where(and(where, eq(animals.status, 'monitoring'))),
    db.select().from(animals).where(where).orderBy(desc(animals.updatedAt)).limit(10),
  ]);

  const [totalRow] = totalResults;
  const [healthyRow] = healthyResults;
  const sickAnimals = sickResults;
  const [monitoringRow] = monitoringResults;
  const enrichedRecent = await enrichWithPenZone(db, companyId, recentResults);

  return {
    totalAnimals: totalRow?.count ?? 0,
    healthyAnimals: healthyRow?.count ?? 0,
    sickAnimals: sickAnimals.length,
    monitoringAnimals: monitoringRow?.count ?? 0,
    alertsCount: sickAnimals.length,
    recentEvents: enrichedRecent.map((a) => ({
      animalId: a.id,
      animalName: a.name,
      species: a.species,
      status: a.status,
      updatedAt: a.updatedAt,
      penName: a.penName,
      zoneName: a.zoneName,
    })),
  };
}
