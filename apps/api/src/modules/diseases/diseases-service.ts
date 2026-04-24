import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import {
  animals,
  diseaseRecords,
  diseaseTypes,
  healthRecords,
  treatmentRecords,
} from '@hd-farm/db';
import type { Database } from '@hd-farm/db';
import { paginate } from '../../utils/pagination.js';
import { AppError } from '../../utils/errors.js';
import { PAGE_SIZE, MAX_PAGE_SIZE, severityRequiresSick } from '@hd-farm/shared';
import type { DiseaseSeverity, HealthStatus } from '@hd-farm/shared';

interface CreateDiseaseInput {
  animalId: string;
  diseaseTypeId?: string | null;
  severity: DiseaseSeverity;
  symptoms?: string;
  notes?: string;
  diagnosedAt: string;
}

interface UpdateDiseaseInput {
  severity?: DiseaseSeverity;
  symptoms?: string;
  notes?: string;
  diagnosedAt?: string;
  resolvedAt?: string | null;
}

export async function createDisease(
  db: Database,
  companyId: string,
  userId: string,
  input: CreateDiseaseInput,
) {
  const [animal] = await db
    .select({ id: animals.id, farmId: animals.farmId, status: animals.status })
    .from(animals)
    .where(and(eq(animals.id, input.animalId), eq(animals.companyId, companyId), isNull(animals.deletedAt)))
    .limit(1);
  if (!animal) throw new AppError('Animal not found', 404, 'NOT_FOUND');

  if (input.diseaseTypeId) {
    const [dt] = await db
      .select({ id: diseaseTypes.id })
      .from(diseaseTypes)
      .where(eq(diseaseTypes.id, input.diseaseTypeId))
      .limit(1);
    if (!dt) throw new AppError('Disease type not found', 404, 'NOT_FOUND');
  }

  const diagnosedAt = new Date(input.diagnosedAt);
  const needsSickStatus =
    severityRequiresSick(input.severity) &&
    animal.status !== 'sick' &&
    animal.status !== 'quarantine' &&
    animal.status !== 'dead' &&
    animal.status !== 'sold';

  let created!: typeof diseaseRecords.$inferSelect;
  await db.transaction(async (tx) => {
    const [record] = await tx
      .insert(diseaseRecords)
      .values({
        companyId,
        farmId: animal.farmId,
        animalId: input.animalId,
        diseaseTypeId: input.diseaseTypeId ?? null,
        severity: input.severity,
        symptoms: input.symptoms ?? null,
        notes: input.notes ?? null,
        recordedById: userId,
        diagnosedAt,
      })
      .returning();
    created = record!;

    if (needsSickStatus) {
      await tx
        .update(animals)
        .set({ status: 'sick' as HealthStatus, updatedAt: new Date() })
        .where(eq(animals.id, input.animalId));

      await tx.insert(healthRecords).values({
        companyId,
        farmId: animal.farmId,
        animalId: input.animalId,
        checkerId: userId,
        status: 'sick',
        notes: `Auto: disease recorded (${input.severity})`,
      });
    }
  });

  return created;
}

export async function listAnimalDiseases(
  db: Database,
  companyId: string,
  animalId: string,
  cursor?: string,
  limit?: number,
) {
  const pageSize = Math.min(limit ?? PAGE_SIZE, MAX_PAGE_SIZE);

  const [animal] = await db
    .select({ id: animals.id })
    .from(animals)
    .where(and(eq(animals.id, animalId), eq(animals.companyId, companyId), isNull(animals.deletedAt)))
    .limit(1);
  if (!animal) throw new AppError('Animal not found', 404, 'NOT_FOUND');

  let whereClause = and(
    eq(diseaseRecords.animalId, animalId),
    eq(diseaseRecords.companyId, companyId),
  );

  if (cursor) {
    const [ts, afterId] = cursor.split('|');
    if (ts && afterId) {
      whereClause = and(
        whereClause,
        sql`(${diseaseRecords.diagnosedAt}, ${diseaseRecords.id}) < (${new Date(ts)}, ${afterId})`,
      ) as typeof whereClause;
    }
  }

  const rows = await db
    .select({
      id: diseaseRecords.id,
      animalId: diseaseRecords.animalId,
      diseaseTypeId: diseaseRecords.diseaseTypeId,
      diseaseName: diseaseTypes.name,
      severity: diseaseRecords.severity,
      symptoms: diseaseRecords.symptoms,
      notes: diseaseRecords.notes,
      recordedById: diseaseRecords.recordedById,
      diagnosedAt: diseaseRecords.diagnosedAt,
      resolvedAt: diseaseRecords.resolvedAt,
      createdAt: diseaseRecords.createdAt,
    })
    .from(diseaseRecords)
    .leftJoin(diseaseTypes, eq(diseaseTypes.id, diseaseRecords.diseaseTypeId))
    .where(whereClause)
    .orderBy(desc(diseaseRecords.diagnosedAt), desc(diseaseRecords.id))
    .limit(pageSize + 1);

  return paginate(rows, pageSize, (r) => `${r.diagnosedAt.toISOString()}|${r.id}`);
}

export async function updateDisease(
  db: Database,
  companyId: string,
  userId: string,
  diseaseId: string,
  input: UpdateDiseaseInput,
) {
  const [existing] = await db
    .select({
      id: diseaseRecords.id,
      animalId: diseaseRecords.animalId,
      farmId: diseaseRecords.farmId,
      resolvedAt: diseaseRecords.resolvedAt,
    })
    .from(diseaseRecords)
    .where(and(eq(diseaseRecords.id, diseaseId), eq(diseaseRecords.companyId, companyId)))
    .limit(1);
  if (!existing) throw new AppError('Disease record not found', 404, 'NOT_FOUND');

  const isResolving = input.resolvedAt !== undefined && input.resolvedAt !== null && !existing.resolvedAt;

  const updateData: Partial<typeof diseaseRecords.$inferInsert> = {};
  if (input.severity) updateData.severity = input.severity;
  if (input.symptoms !== undefined) updateData.symptoms = input.symptoms;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.diagnosedAt) updateData.diagnosedAt = new Date(input.diagnosedAt);
  if (input.resolvedAt !== undefined) {
    updateData.resolvedAt = input.resolvedAt ? new Date(input.resolvedAt) : null;
  }

  let updated!: typeof diseaseRecords.$inferSelect;
  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(diseaseRecords)
      .set(updateData)
      .where(eq(diseaseRecords.id, diseaseId))
      .returning();
    updated = row!;

    if (isResolving) {
      await maybeMarkRecovered(tx, existing.animalId, existing.farmId, companyId, userId);
    }
  });

  return updated;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxLike = any;

/**
 * If animal has NO unresolved diseases left, and status is 'sick',
 * transition to 'recovered' and log a health_record.
 */
async function maybeMarkRecovered(
  tx: TxLike,
  animalId: string,
  farmId: string,
  companyId: string,
  userId: string,
) {
  const [animal] = await tx
    .select({ status: animals.status })
    .from(animals)
    .where(eq(animals.id, animalId))
    .limit(1);
  if (!animal || animal.status !== 'sick') return;

  const [{ count }] = await tx
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(diseaseRecords)
    .where(and(eq(diseaseRecords.animalId, animalId), isNull(diseaseRecords.resolvedAt)));
  if (count > 0) return;

  await tx
    .update(animals)
    .set({ status: 'recovered' as HealthStatus, updatedAt: new Date() })
    .where(eq(animals.id, animalId));

  await tx.insert(healthRecords).values({
    companyId,
    farmId,
    animalId,
    checkerId: userId,
    status: 'recovered',
    notes: 'Auto: all diseases resolved',
  });
}

export async function getActiveWithdrawals(
  db: Database,
  companyId: string,
  animalId: string,
): Promise<Array<{ medicine: string; withdrawalEndAt: string }>> {
  const rows = await db
    .select({
      medicine: treatmentRecords.medicine,
      treatedAt: treatmentRecords.treatedAt,
      endedAt: treatmentRecords.endedAt,
      withdrawalDays: treatmentRecords.withdrawalDays,
    })
    .from(treatmentRecords)
    .where(
      and(
        eq(treatmentRecords.animalId, animalId),
        eq(treatmentRecords.companyId, companyId),
        sql`${treatmentRecords.withdrawalDays} IS NOT NULL AND ${treatmentRecords.withdrawalDays} > 0`,
      ),
    );

  const now = Date.now();
  const active: Array<{ medicine: string; withdrawalEndAt: string }> = [];
  for (const r of rows) {
    if (!r.withdrawalDays) continue;
    const base = r.endedAt ?? r.treatedAt;
    const end = new Date(base);
    end.setDate(end.getDate() + r.withdrawalDays);
    if (end.getTime() > now) {
      active.push({ medicine: r.medicine, withdrawalEndAt: end.toISOString() });
    }
  }
  return active;
}
