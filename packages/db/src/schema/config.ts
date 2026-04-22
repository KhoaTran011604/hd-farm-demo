import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

const speciesEnum = { enum: ['heo', 'gà', 'bò'] } as const;

export const animalTypes = pgTable('animal_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  species: text('species', speciesEnum).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const vaccineTypes = pgTable('vaccine_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  species: text('species', speciesEnum),
  description: text('description'),
  intervalDays: integer('interval_days'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const feedTypes = pgTable('feed_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  species: text('species', speciesEnum),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const diseaseTypes = pgTable('disease_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  species: text('species', speciesEnum),
  symptoms: text('symptoms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
