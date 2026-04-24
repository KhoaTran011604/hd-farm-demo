import { eq, and, desc, sql } from 'drizzle-orm';
import { vaccinationRecords, animals, vaccineTypes } from '@hd-farm/db';
import type { Database } from '@hd-farm/db';
import { paginate } from '../../utils/pagination.js';
import { AppError } from '../../utils/errors.js';
import { PAGE_SIZE, MAX_PAGE_SIZE } from '@hd-farm/shared';

interface CreateVaccinationInput {
  animalId: string;
  vaccineTypeId: string;
  batchNumber?: string;
  vaccinatedAt: string;
  nextDueAt?: string;
  notes?: string;
}

export async function createVaccination(
  db: Database,
  companyId: string,
  userId: string,
  input: CreateVaccinationInput
) {
  const [animal] = await db
    .select({ id: animals.id, farmId: animals.farmId })
    .from(animals)
    .where(and(eq(animals.id, input.animalId), eq(animals.companyId, companyId)))
    .limit(1);
  if (!animal) throw new AppError('Animal not found', 404, 'NOT_FOUND');

  const [vaccineType] = await db
    .select({ id: vaccineTypes.id, intervalDays: vaccineTypes.intervalDays })
    .from(vaccineTypes)
    .where(eq(vaccineTypes.id, input.vaccineTypeId))
    .limit(1);
  if (!vaccineType) throw new AppError('Vaccine type not found', 404, 'NOT_FOUND');

  const vaccinatedAt = new Date(input.vaccinatedAt);

  let nextDueAt: Date | null = null;
  if (input.nextDueAt) {
    nextDueAt = new Date(input.nextDueAt);
  } else if (vaccineType.intervalDays) {
    nextDueAt = new Date(vaccinatedAt);
    nextDueAt.setDate(nextDueAt.getDate() + vaccineType.intervalDays);
  }

  const [record] = await db
    .insert(vaccinationRecords)
    .values({
      companyId,
      farmId: animal.farmId,
      animalId: input.animalId,
      vaccineTypeId: input.vaccineTypeId,
      batchNumber: input.batchNumber ?? null,
      vaccinatedById: userId,
      vaccinatedAt,
      nextDueAt,
      notes: input.notes ?? null,
    })
    .returning();

  return record;
}

export async function listAnimalVaccinations(
  db: Database,
  companyId: string,
  animalId: string,
  cursor?: string,
  limit?: number
) {
  const pageSize = Math.min(limit ?? PAGE_SIZE, MAX_PAGE_SIZE);

  const [animal] = await db
    .select({ id: animals.id })
    .from(animals)
    .where(and(eq(animals.id, animalId), eq(animals.companyId, companyId)))
    .limit(1);
  if (!animal) throw new AppError('Animal not found', 404, 'NOT_FOUND');

  let whereClause = eq(vaccinationRecords.animalId, animalId);

  if (cursor) {
    const [ts, afterId] = cursor.split('|');
    if (ts && afterId) {
      whereClause = and(
        whereClause,
        sql`(${vaccinationRecords.vaccinatedAt}, ${vaccinationRecords.id}) < (${new Date(ts)}, ${afterId})`
      ) as typeof whereClause;
    }
  }

  const rows = await db
    .select({
      id: vaccinationRecords.id,
      animalId: vaccinationRecords.animalId,
      vaccineTypeId: vaccinationRecords.vaccineTypeId,
      vaccineName: vaccineTypes.name,
      batchNumber: vaccinationRecords.batchNumber,
      vaccinatedById: vaccinationRecords.vaccinatedById,
      vaccinatedAt: vaccinationRecords.vaccinatedAt,
      nextDueAt: vaccinationRecords.nextDueAt,
      notes: vaccinationRecords.notes,
      createdAt: vaccinationRecords.createdAt,
    })
    .from(vaccinationRecords)
    .leftJoin(vaccineTypes, eq(vaccineTypes.id, vaccinationRecords.vaccineTypeId))
    .where(whereClause)
    .orderBy(desc(vaccinationRecords.vaccinatedAt), desc(vaccinationRecords.id))
    .limit(pageSize + 1);

  return paginate(rows, pageSize, (r) => `${r.vaccinatedAt.toISOString()}|${r.id}`);
}

export async function updateVaccination(
  db: Database,
  companyId: string,
  vaccinationId: string,
  input: Partial<CreateVaccinationInput>
) {
  const [existing] = await db
    .select({ id: vaccinationRecords.id })
    .from(vaccinationRecords)
    .where(and(eq(vaccinationRecords.id, vaccinationId), eq(vaccinationRecords.companyId, companyId)))
    .limit(1);
  if (!existing) throw new AppError('Vaccination record not found', 404, 'NOT_FOUND');

  const updateData: Partial<typeof vaccinationRecords.$inferInsert> = {};
  if (input.batchNumber !== undefined) updateData.batchNumber = input.batchNumber;
  if (input.vaccinatedAt) updateData.vaccinatedAt = new Date(input.vaccinatedAt);
  if (input.nextDueAt !== undefined) updateData.nextDueAt = input.nextDueAt ? new Date(input.nextDueAt) : null;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const [updated] = await db
    .update(vaccinationRecords)
    .set(updateData)
    .where(eq(vaccinationRecords.id, vaccinationId))
    .returning();

  return updated;
}

export async function deleteVaccination(db: Database, companyId: string, vaccinationId: string) {
  const [existing] = await db
    .select({ id: vaccinationRecords.id })
    .from(vaccinationRecords)
    .where(and(eq(vaccinationRecords.id, vaccinationId), eq(vaccinationRecords.companyId, companyId)))
    .limit(1);
  if (!existing) throw new AppError('Vaccination record not found', 404, 'NOT_FOUND');

  await db.delete(vaccinationRecords).where(eq(vaccinationRecords.id, vaccinationId));
}
