# Drizzle ORM v2 + PostgreSQL Research Report

**Date:** 2026-04-22 | **Research Focus:** Schema design, migrations, integration patterns

---

## Executive Summary

Drizzle ORM v2 (2025+) provides code-first TypeScript schema definitions, native JSONB support, cursor-based pagination for 5000+ records, and seamless Fastify integration via connection pooling. Perfect for HD-Farms' multi-tenant hierarchy.

---

## 1. Schema Definition (`pgTable` Syntax)

**Core Pattern:**
```typescript
import { pgTable, integer, varchar, pgEnum, timestamp } from "drizzle-orm/pg-core";

// Define enums
export const animalStatusEnum = pgEnum("animal_status", ["healthy", "sick", "quarantined"]);
export const speciesEnum = pgEnum("species", ["chicken", "cow", "pig", "sheep"]);

// Multi-tenant hierarchy
export const companies = pgTable("companies", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const farms = pgTable("farms", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer().notNull().references(() => companies.id),
  name: varchar().notNull(),
});

export const zones = pgTable("zones", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  farmId: integer().notNull().references(() => farms.id),
  name: varchar().notNull(),
});

export const animals = pgTable("animals", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  zoneId: integer().notNull().references(() => zones.id),
  species: speciesEnum().notNull(),
  status: animalStatusEnum().default("healthy").notNull(),
  metadata: jsonb().$type<{ weight: number; age: number; tags: string[] }>(),
  createdAt: timestamp().defaultNow().notNull(),
});
```

**Key Features:**
- `generatedAlwaysAsIdentity()`: Auto-incrementing primary keys
- `notNull() + unique()`: Column constraints
- `pgEnum()`: Type-safe PostgreSQL enums
- Explicit `references()`: Foreign keys with cascading

---

## 2. JSONB Columns (Flexible Species Data)

**Type-Safe JSONB Pattern:**
```typescript
export const animals = pgTable("animals", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  speciesData: jsonb().$type<{
    weight?: number;
    age?: number;
    breed?: string;
    healthRecords?: Array<{ date: string; condition: string }>;
  }>().default({}),
});

// Usage - compile-time type safety
const newAnimal = await db.insert(animals).values({
  speciesData: {
    weight: 150,
    breed: "Angus",
    healthRecords: [{ date: "2025-01-15", condition: "healthy" }],
  },
});
```

**Advantages:** Binary format (2-3x faster than JSON), built-in indexing, `-> / ->>` operators for querying.

---

## 3. Relations (Query Hydration)

**Relational Queries v2:**
```typescript
import { relations } from "drizzle-orm/pg-core";

export const companiesRelations = relations(companies, ({ many }) => ({
  farms: many(farms),
}));

export const farmsRelations = relations(farms, ({ one, many }) => ({
  company: one(companies, { fields: [farms.companyId], references: [companies.id] }),
  zones: many(zones),
}));

// Query with hydration
const farmWithZonesAndAnimals = await db.query.farms.findFirst({
  where: eq(farms.id, 1),
  with: {
    zones: {
      with: { animals: true },
    },
    company: true,
  },
});
```

**Note:** Relations don't affect schema; optional alongside foreign keys.

---

## 4. Migrations: `drizzle-kit generate` + `push` Workflow

**Setup (`drizzle.config.ts`):**
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  casing: "snake_case", // Auto-convert camelCase → snake_case
});
```

**Development Workflow:**
```bash
# 1. Modify schema → auto-detects changes
npx drizzle-kit generate --name add_animals_table

# 2. Review generated SQL in ./migrations/{timestamp}_*.sql
# 3a. Push directly (rapid prototyping)
npx drizzle-kit push

# 3b. Or migrate with transaction safety
npm run migrate
```

**CI/CD:** Use `drizzle-kit push` in pipelines; generates `.sql` + `.snapshot.json` for version control.

---

## 5. Fastify + postgres.js Integration

**Connection Pooling Pattern:**
```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Initialize pool
const client = postgres(process.env.DATABASE_URL, {
  max: 20, // Pool size
  idle_timeout: 30,
  connect_timeout: 5,
});

export const db = drizzle(client, { schema });

// Fastify setup
import Fastify from "fastify";
const app = Fastify({ logger: true });

app.addHook("onClose", async () => {
  await client.end(); // Graceful shutdown
});

app.post("/animals", async (req, res) => {
  const result = await db
    .insert(animals)
    .values(req.body)
    .returning();
  return result;
});

await app.listen({ port: 3000 });
```

**Pool Config:**
- `max: 20`: Connection limit (adjust per DB)
- `idle_timeout: 30s`: Close idle connections
- `connect_timeout: 5s`: Fail fast on unavailable DB

---

## 6. Cursor-Based Pagination (5000+ Records)

**Single-Column Cursor (unique ID):**
```typescript
export const listAnimals = async (cursor?: number, limit = 50) => {
  return db
    .select()
    .from(animals)
    .where(cursor ? gt(animals.id, cursor) : undefined)
    .orderBy(asc(animals.id))
    .limit(limit);
};

// Client: pass last row's ID as next cursor
// Response: { data: [...], nextCursor: animals[49].id }
```

**Multi-Column Cursor (non-unique species):**
```typescript
export const listAnimalsByStatus = async (
  cursor?: { status: string; id: number },
  limit = 50
) => {
  return db
    .select()
    .from(animals)
    .where(
      cursor
        ? or(
            gt(animals.status, cursor.status),
            and(eq(animals.status, cursor.status), gt(animals.id, cursor.id))
          )
        : undefined
    )
    .orderBy(asc(animals.status), asc(animals.id))
    .limit(limit);
};
```

**Performance:** Create indices: `CREATE INDEX idx_animals_status_id ON animals(status, id)`

---

## 7. Multi-Tenant Design Patterns

**Recommended for HD-Farms: Row-Based (Single DB + tenantId)**

```typescript
export const animals = pgTable("animals", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer().notNull(), // Tenant filter
  zoneId: integer().notNull(),
  // ... other columns
});

// Ensure EVERY query filters by companyId
const getUserAnimals = async (companyId: number) => {
  return db
    .select()
    .from(animals)
    .where(eq(animals.companyId, companyId));
};

// Add RLS (Row-Level Security) policy:
// CREATE POLICY animals_tenant_filter ON animals
// USING (company_id = current_user_id);
```

**Alternative (Schema-Per-Tenant):** Requires dynamic schema switching; Drizzle doesn't auto-support. Use env-based connection switching instead.

---

## Key Takeaways

| Feature | Status | Notes |
|---------|--------|-------|
| pgTable + Relations | ✅ Mature | Type-safe, zero-config joins |
| JSONB + .$type<> | ✅ Full Support | Compile-time schema safety |
| drizzle-kit generate | ✅ Production-Ready | Smart diff detection |
| postgres.js Pooling | ✅ Battle-Tested | Max 20 conns recommended |
| Cursor Pagination | ✅ Optimized | Index cursor columns |
| Multi-Tenant | ✅ Row-Based Best | Add RLS for enforcement |

---

## Sources

- [Drizzle ORM Schema Declaration](https://orm.drizzle.team/docs/sql-schema-declaration)
- [PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg)
- [Drizzle Relations v2](https://orm.drizzle.team/docs/relations-v2)
- [drizzle-kit generate](https://orm.drizzle.team/docs/drizzle-kit-generate)
- [drizzle-kit push](https://orm.drizzle.team/docs/drizzle-kit-push)
- [Cursor-Based Pagination Guide](https://orm.drizzle.team/docs/guides/cursor-based-pagination)
- [Fastify + Drizzle Integration](https://dev.to/vladimirvovk/fastify-api-with-postgres-and-drizzle-orm-a7j)
- [PostgreSQL Best Practices Guide (2025)](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717)
