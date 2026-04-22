import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { companies, farms } from './tenancy';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['super_admin', 'admin', 'manager', 'worker'] })
    .notNull()
    .default('worker'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('users_company_idx').on(t.companyId),
  index('users_email_idx').on(t.email),
]);

export const userFarmRoles = pgTable('user_farm_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  farmId: uuid('farm_id').notNull().references(() => farms.id),
  role: text('role', { enum: ['manager', 'worker'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('user_farm_roles_user_farm_idx').on(t.userId, t.farmId),
]);
