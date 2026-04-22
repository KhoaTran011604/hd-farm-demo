import { pgTable, uuid, text, timestamp, numeric, integer, index } from 'drizzle-orm/pg-core';
import { pens } from './tenancy';
import { feedTypes } from './config';
import { animals } from './animals';

export const feedingRecords = pgTable('feeding_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull(),
  penId: uuid('pen_id').references(() => pens.id),
  feedTypeId: uuid('feed_type_id').references(() => feedTypes.id),
  amount: numeric('amount', { precision: 10, scale: 3 }),
  unit: text('unit').default('kg'),
  fedById: uuid('fed_by_id').notNull(),
  fedAt: timestamp('fed_at').defaultNow().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('feeding_records_company_farm_idx').on(t.companyId, t.farmId),
  index('feeding_records_pen_idx').on(t.penId),
]);

export const reproductionEvents = pgTable('reproduction_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull(),
  animalId: uuid('animal_id').notNull().references(() => animals.id),
  eventType: text('event_type', {
    enum: ['mating', 'pregnancy_check', 'farrowing', 'weaning'],
  }).notNull(),
  eventDate: timestamp('event_date').notNull(),
  partnerId: uuid('partner_id').references(() => animals.id),
  offspringCount: integer('offspring_count'),
  notes: text('notes'),
  recordedById: uuid('recorded_by_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('reproduction_events_company_farm_idx').on(t.companyId, t.farmId),
  index('reproduction_events_animal_idx').on(t.animalId),
]);
