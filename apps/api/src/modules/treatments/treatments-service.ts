import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import {
  animals,
  diseaseRecords,
  treatmentRecords,
} from '@hd-farm/db';
import type { Database } from '@hd-farm/db';
import { paginate } from '../../utils/pagination.js';
import { AppError } from '../../utils/errors.js';
import { PAGE_SIZE, MAX_PAGE_SIZE } from '@hd-farm/shared';

interface CreateTreatmentInput {
  animalId: string;
  diseaseRecordId?: string | null;
  medicine: string;
  dosage?: string;
  withdrawalDays?: number;
  treatedAt: string;
  endedAt?: string | null;
  notes?: string;
}

interface UpdateTreatmentInput {
  medicine?: string;
  dosage?: string;
  withdrawalDays?: number | null;
  treatedAt?: string;
  endedAt?: string | null;
  notes?: string;
}

export async function createTreatment(
  db: Database,
  companyId: string,
  userId: string,
  input: CreateTreatmentInput,
) {
  const [animal] = await db
    .select({ id: animals.id, farmId: animals.farmId })
    .from(animals)
    .where(and(eq(animals.id, input.animalId), eq(animals.companyId, companyId), isNull(animals.deletedAt)))
    .limit(1);
  if (!animal) throw new AppError('Animal not found', 404, 'NOT_FOUND');

  if (input.diseaseRecordId) {
    const [disease] = await db
      .select({ id: diseaseRecords.id })
      .from(diseaseRecords)
      .where(
        and(
          eq(diseaseRecords.id, input.diseaseRecordId),
          eq(diseaseRecords.companyId, companyId),
          eq(diseaseRecords.animalId, input.animalId),
        ),
      )
      .limit(1);
    if (!disease) throw new AppError('Disease record not found for this animal', 404, 'NOT_FOUND');
  }

  const [record] = await db
    .insert(treatmentRecords)
    .values({
      companyId,
      farmId: animal.farmId,
      animalId: input.animalId,
      diseaseRecordId: input.diseaseRecordId ?? null,
      medicine: input.medicine,
      dosage: input.dosage ?? null,
      withdrawalDays: input.withdrawalDays ?? null,
      treatedById: userId,
      treatedAt: new Date(input.treatedAt),
      endedAt: input.endedAt ? new Date(input.endedAt) : null,
      notes: input.notes ?? null,
    })
    .returning();

  return record;
}

export async function listDiseaseTreatments(
  db: Database,
  companyId: string,
  diseaseId: string,
) {
  const [disease] = await db
    .select({ id: diseaseRecords.id })
    .from(diseaseRecords)
    .where(and(eq(diseaseRecords.id, diseaseId), eq(diseaseRecords.companyId, companyId)))
    .limit(1);
  if (!disease) throw new AppError('Disease record not found', 404, 'NOT_FOUND');

  const rows = await db
    .select()
    .from(treatmentRecords)
    .where(
      and(
        eq(treatmentRecords.diseaseRecordId, diseaseId),
        eq(treatmentRecords.companyId, companyId),
      ),
    )
    .orderBy(desc(treatmentRecords.treatedAt), desc(treatmentRecords.id));

  return { items: rows };
}

export async function listAnimalTreatments(
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
    eq(treatmentRecords.animalId, animalId),
    eq(treatmentRecords.companyId, companyId),
  );

  if (cursor) {
    const [ts, afterId] = cursor.split('|');
    if (ts && afterId) {
      whereClause = and(
        whereClause,
        sql`(${treatmentRecords.treatedAt}, ${treatmentRecords.id}) < (${new Date(ts)}, ${afterId})`,
      ) as typeof whereClause;
    }
  }

  const rows = await db
    .select()
    .from(treatmentRecords)
    .where(whereClause)
    .orderBy(desc(treatmentRecords.treatedAt), desc(treatmentRecords.id))
    .limit(pageSize + 1);

  return paginate(rows, pageSize, (r) => `${r.treatedAt.toISOString()}|${r.id}`);
}

export async function updateTreatment(
  db: Database,
  companyId: string,
  treatmentId: string,
  input: UpdateTreatmentInput,
) {
  const [existing] = await db
    .select({ id: treatmentRecords.id })
    .from(treatmentRecords)
    .where(and(eq(treatmentRecords.id, treatmentId), eq(treatmentRecords.companyId, companyId)))
    .limit(1);
  if (!existing) throw new AppError('Treatment record not found', 404, 'NOT_FOUND');

  const updateData: Partial<typeof treatmentRecords.$inferInsert> = {};
  if (input.medicine !== undefined) updateData.medicine = input.medicine;
  if (input.dosage !== undefined) updateData.dosage = input.dosage;
  if (input.withdrawalDays !== undefined) updateData.withdrawalDays = input.withdrawalDays;
  if (input.treatedAt) updateData.treatedAt = new Date(input.treatedAt);
  if (input.endedAt !== undefined) {
    updateData.endedAt = input.endedAt ? new Date(input.endedAt) : null;
  }
  if (input.notes !== undefined) updateData.notes = input.notes;

  const [updated] = await db
    .update(treatmentRecords)
    .set(updateData)
    .where(eq(treatmentRecords.id, treatmentId))
    .returning();

  return updated;
}

export async function deleteTreatment(db: Database, companyId: string, treatmentId: string) {
  const [existing] = await db
    .select({ id: treatmentRecords.id })
    .from(treatmentRecords)
    .where(and(eq(treatmentRecords.id, treatmentId), eq(treatmentRecords.companyId, companyId)))
    .limit(1);
  if (!existing) throw new AppError('Treatment record not found', 404, 'NOT_FOUND');

  await db.delete(treatmentRecords).where(eq(treatmentRecords.id, treatmentId));
}
