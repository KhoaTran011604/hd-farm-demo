import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { animals } from './animals';
import { diseaseTypes, vaccineTypes } from './config';

export const healthRecords = pgTable('health_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull(),
  animalId: uuid('animal_id').notNull().references(() => animals.id),
  checkerId: uuid('checker_id').notNull(),
  status: text('status', {
    enum: ['healthy', 'monitoring', 'sick', 'quarantine'],
  }).notNull(),
  notes: text('notes'),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('health_records_company_farm_idx').on(t.companyId, t.farmId),
  index('health_records_animal_idx').on(t.animalId),
]);

export const diseaseRecords = pgTable('disease_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull(),
  animalId: uuid('animal_id').notNull().references(() => animals.id),
  diseaseTypeId: uuid('disease_type_id').references(() => diseaseTypes.id),
  severity: text('severity', { enum: ['mild', 'moderate', 'severe'] }).notNull(),
  symptoms: text('symptoms'),
  diagnosedAt: timestamp('diagnosed_at').notNull(),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('disease_records_company_farm_idx').on(t.companyId, t.farmId),
  index('disease_records_animal_idx').on(t.animalId),
]);

export const treatmentRecords = pgTable('treatment_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull(),
  animalId: uuid('animal_id').notNull().references(() => animals.id),
  diseaseRecordId: uuid('disease_record_id').references(() => diseaseRecords.id),
  medicine: text('medicine').notNull(),
  dosage: text('dosage'),
  treatedById: uuid('treated_by_id').notNull(),
  treatedAt: timestamp('treated_at').defaultNow().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('treatment_records_company_farm_idx').on(t.companyId, t.farmId),
  index('treatment_records_animal_idx').on(t.animalId),
]);

export const vaccinationRecords = pgTable('vaccination_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull(),
  animalId: uuid('animal_id').notNull().references(() => animals.id),
  vaccineTypeId: uuid('vaccine_type_id').references(() => vaccineTypes.id),
  batchNumber: text('batch_number'),
  vaccinatedById: uuid('vaccinated_by_id').notNull(),
  vaccinatedAt: timestamp('vaccinated_at').defaultNow().notNull(),
  nextDueAt: timestamp('next_due_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('vaccination_records_company_farm_idx').on(t.companyId, t.farmId),
  index('vaccination_records_animal_idx').on(t.animalId),
]);
