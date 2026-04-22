import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const farms = pgTable('farms', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('farms_company_idx').on(t.companyId),
]);

export const zones = pgTable('zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull().references(() => farms.id),
  name: text('name').notNull(),
  type: text('type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('zones_farm_idx').on(t.farmId),
  index('zones_company_farm_idx').on(t.companyId, t.farmId),
]);

export const pens = pgTable('pens', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull(),
  zoneId: uuid('zone_id').notNull().references(() => zones.id),
  name: text('name').notNull(),
  capacity: integer('capacity'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('pens_zone_idx').on(t.zoneId),
  index('pens_company_farm_idx').on(t.companyId, t.farmId),
]);
