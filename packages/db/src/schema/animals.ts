import { pgTable, uuid, text, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { farms, pens } from './tenancy';

const speciesEnum = { enum: ['heo', 'gà', 'bò'] } as const;

export const animals = pgTable('animals', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull().references(() => farms.id),
  penId: uuid('pen_id').references(() => pens.id),
  name: text('name').notNull(),
  species: text('species', speciesEnum).notNull(),
  status: text('status', {
    enum: ['healthy', 'monitoring', 'sick', 'quarantine', 'recovered', 'dead', 'sold'],
  })
    .notNull()
    .default('healthy'),
  qrCode: text('qr_code').unique().notNull(),
  typeMetadata: jsonb('type_metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('animals_company_farm_idx').on(t.companyId, t.farmId),
  index('animals_status_idx').on(t.status),
  index('animals_qr_code_idx').on(t.qrCode),
  index('animals_deleted_at_idx').on(t.deletedAt),
]);

export const batches = pgTable('batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull().references(() => farms.id),
  name: text('name').notNull(),
  species: text('species', speciesEnum).notNull(),
  count: integer('count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('batches_company_farm_idx').on(t.companyId, t.farmId),
]);
