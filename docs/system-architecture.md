# HD-FARM: System Architecture & Design

This document describes the complete system architecture, data flow, and integration patterns for HD-FARM livestock management platform.

---

## 1. High-Level Architecture Overview

```
┌────────────────────────── Turborepo Monorepo (pnpm workspaces) ──────────────────────────┐
│                                                                                            │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────────────────────┐  │
│  │    apps/api      │   │    apps/web      │   │      apps/mobile (Expo RN)           │  │
│  │                  │   │                  │   │                                      │  │
│  │ Fastify Server   │   │  Next.js 14      │   │  Expo Router v3                      │  │
│  │ TypeScript       │   │  App Router      │   │  React Native                        │  │
│  │ :3001            │   │  shadcn/ui       │   │  :8081                               │  │
│  │                  │   │  :3000           │   │  Bottom tab bar + QR scanner         │  │
│  └─────────┬────────┘   └────────┬─────────┘   └────────────────┬─────────────────────┘  │
│            │                     │                               │                        │
│            │                     │                               │                        │
│  ┌─────────┴─────────────────────┴───────────────────────────────┴────────────────────┐  │
│  │                     packages/shared (Types & Validators)                          │  │
│  │                                                                                    │  │
│  │  • TypeScript type definitions (Animal, Zone, Pen, HealthStatus, etc.)          │  │
│  │  • Yup validators (createAnimalSchema, updateZoneSchema, etc.)                  │  │
│  │  • Constants (ANIMAL_SPECIES, HEALTH_STATUSES, etc.)                            │  │
│  │  • No business logic — pure types and validators                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │              packages/db (Drizzle ORM + PostgreSQL Schema)                       │  │
│  │                                                                                  │  │
│  │  • schema/tenancy.ts → companies, farms, zones, pens                           │  │
│  │  • schema/auth.ts → users, user_farm_roles                                     │  │
│  │  • schema/animals.ts → animals, batches                                        │  │
│  │  • schema/config.ts → animal_types, vaccine_types, feed_types, disease_types  │  │
│  │  • schema/health.ts → health_records, disease_records, treatment_records       │  │
│  │  • schema/ops.ts → feeding_records, reproduction_events                        │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  packages/eslint-config, packages/tsconfig (Shared tooling)                     │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐           ┌─────────▼──────────┐
            │  PostgreSQL    │           │   Docker Compose   │
            │  16.x          │           │   (Local Dev)      │
            │                │           │                    │
            │  • Row-based   │           │  • postgres        │
            │    multi-      │           │  • pgAdmin         │
            │    tenancy     │           │  • Redis (Phase 2) │
            │  • Soft delete │           │                    │
            │  • JSONB       │           └────────────────────┘
            │    metadata    │
            │  • RLS ready   │
            │    (Phase 2)   │
            └────────────────┘
```

---

## 2. Multi-Tenancy Model & Data Scoping

### Tenant Hierarchy

```
Company (SaaS customer)
  ├── Farm 1
  │   ├── Zone A (dairy barn)
  │   │   ├── Pen 1 (10 animals)
  │   │   └── Pen 2 (8 animals)
  │   └── Zone B (breeding)
  │       └── Pen 3 (15 animals)
  └── Farm 2
      └── Zone C
```

### JWT Token Structure

Every authenticated request carries:

```typescript
{
  userId: string; // UUID
  companyId: string; // UUID — REQUIRED for all queries
  farmId: string; // UUID — REQUIRED for all queries
  role: 'admin' | 'manager' | 'worker' | 'vet';
  iat: number; // Issued at
  exp: number; // Expires in 24 hours
}
```

### Query Scoping (MANDATORY)

**Every database query MUST filter by `companyId` AND `farmId`:**

This is enforced at the service layer. The JWT token guarantees both values are available on `req.user`:

```typescript
// ✗ BAD — exposes cross-tenant data (security breach)
const animals = await db
  .select()
  .from(animals_table)
  .where(eq(animals_table.farmId, req.user.farmId));

// ✓ GOOD — full tenant isolation
const animals = await db
  .select()
  .from(animals_table)
  .where(
    and(
      eq(animals_table.companyId, req.user.companyId),
      eq(animals_table.farmId, req.user.farmId),
      isNull(animals_table.deletedAt) // Soft delete filter
    )
  );
```

**Design Guarantee:** JWT always includes `companyId` and `farmId`. Never trust request body for tenant scoping—always use values from `req.user`.

### Row-Level Security (RLS) — Phase 2

Phase 2 will add PostgreSQL RLS policies to enforce tenant isolation at the database layer:

```sql
-- Enable RLS on all tables
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see animals in their farm
CREATE POLICY animals_tenant_policy ON animals
  USING (company_id = current_setting('app.company_id')::uuid);
```

---

## 3. API Layer Architecture (Fastify 5)

### Fastify Plugin Stack

The API is built with Fastify 5 and the following plugin layers:

```
┌─────────────────────────────────────────────────┐
│ Fastify 5 Server (server.ts)                    │
├─────────────────────────────────────────────────┤
│ 1. @fastify/cors (WEB_ORIGIN, MOBILE_ORIGIN)    │
│ 2. @fastify/helmet (security headers)            │
│ 3. db plugin (Drizzle + postgres.js)             │
│ 4. jwt plugin (@fastify/jwt + HS256)             │
│ 5. error-handler (AppError → JSON response)      │
├─────────────────────────────────────────────────┤
│ Modules (Phase 1-3):                            │
│ ├─ /auth (login, JWT generation, logout)        │
│ ├─ /users (user management, RBAC)               │
│ ├─ /farms (farm CRUD, tenant scoped)            │
│ ├─ /zones (zone CRUD, delete guards)            │
│ ├─ /pens (pen CRUD, capacity tracking)          │
│ ├─ /animals (full CRUD, QR lookup, pagination)  │
│ └─ /config (animal/vaccine/feed/disease types)  │
└─────────────────────────────────────────────────┘
```

### Plugin Details

**Plugin: jwt.ts**
- Registers `@fastify/jwt` with `JWT_SECRET` environment variable
- Signature: HS256 (symmetric, requires shared secret)
- Token expiry: 24 hours (`expiresIn: '24h'`)
- Payload: `{ userId, companyId, farmId, role }`

**Plugin: auth.ts**
- Exports `verifyToken()` hook: wraps `request.jwtVerify()`
- Exports `requireRole(...roles)` factory: RBAC middleware
- Throws `AppError` with 401 (invalid token) or 403 (insufficient role)

**Plugin: db.ts**
- Initializes Drizzle client from `DATABASE_URL`
- Uses postgres.js for connection pooling
- Decorates `app.db` for type-safe queries

**Plugin: error-handler.ts**
- Catches all route errors globally
- Formats `AppError` instances to JSON
- Logs with context: userId, farmId, route, error message
- Never exposes stack traces in production

### Request Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. HTTP Request (with Authorization header)                     │
│    POST /api/v1/animals                                         │
│    Authorization: Bearer {JWT_TOKEN}                            │
│    Content-Type: application/json                               │
│    Body: { name: "Pig01", species: "heo", penId: "p1" }        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 2. Fastify Request Handler                                      │
│    • Route matching: POST /api/v1/animals                       │
│    • Pre-handler hooks: [verifyToken, requireRole('manager')]   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 3. JWT Verification (Plugin: jwt.ts)                           │
│    • Decode JWT with HS256 → extract { userId, companyId, ... }│
│    • Attach to req.user via @fastify/jwt                        │
│    • If invalid/expired: throw AppError(401)                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 4. Role-Based Authorization (Plugin: auth.ts)                  │
│    • Check req.user.role in allowed roles                       │
│    • If not allowed: throw AppError(403)                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 5. Input Validation (Schema: {domain}.schema.ts + Yup)         │
│    • Validate req.body against Yup schema                       │
│    • Type-safe validated data                                   │
│    • If invalid: throw AppError(400)                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 6. Service Layer ({domain}.service.ts)                          │
│    • animalService.create(validatedInput, req.user)             │
│    • CRITICAL: Scope all queries by companyId + farmId          │
│    • Business logic, state transitions, error handling          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 7. Database Layer (Drizzle + postgres.js)                      │
│    • db.animals.insert({ ...data, companyId, farmId })         │
│    • Connection pooling, parameterized queries                  │
│    • Return created entity or throw AppError                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 8. Response Formatting                                          │
│    • Single: { data: {...} }                                   │
│    • List: { data: [...], meta: { count, nextCursor, ... } }  │
│    • Error: { statusCode: 400, message: "..." }               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 9. Global Error Handler (error-handler.ts)                      │
│    • Catch AppError and log with context                        │
│    • Format response, return to client                          │
│    • Never expose implementation details                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 10. HTTP Response (201 Created / 200 OK / 4xx / 5xx)           │
│    Content-Type: application/json                              │
│    Body: { data: {...} }                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Route Naming Convention

```
GET    /api/v1/{resource}              → List (with pagination)
GET    /api/v1/{resource}/{id}         → Get single
POST   /api/v1/{resource}              → Create
PATCH  /api/v1/{resource}/{id}         → Update
DELETE /api/v1/{resource}/{id}         → Delete (soft)
POST   /api/v1/{resource}/{id}/action  → Custom action (e.g., status change)
```

### Pagination (Cursor-Based)

```typescript
// Request
GET /api/v1/animals?limit=20&cursor=uuid-of-last-item

// Response
{
  data: [
    { id: 'uuid1', name: '...', ... },
    { id: 'uuid2', name: '...', ... },
    ...
  ],
  meta: {
    count: 100,           // Total items in result set
    nextCursor: 'uuid20', // For fetching next page
    hasMore: true         // Whether more pages exist
  }
}
```

### Fastify Plugins (Cross-Cutting Concerns)

**Plugin: jwt.ts**

- Registers `@fastify/jwt` with secret from `JWT_SECRET`
- Provides `req.jwtVerify()` method
- Handles token expiry (24h)

**Plugin: auth.ts**

- Decorates `authenticate` hook (wraps jwtVerify)
- Decorates `requireRole(roles[])` hook (RBAC check)
- Attaches `req.user` object

**Plugin: db.ts**

- Initializes Drizzle client
- Decorates `app.db` for use in routes
- Connection pooling (postgres.js)

**Plugin: error-handler.ts**

- Catches all route errors
- Formats AppError instances
- Logs errors with context (userId, farmId)
- Never exposes stack traces in production

### API Modules (Phase 1-3)

**Module: /auth** (Fastify routes + AuthService)
- `POST /api/v1/auth/login`: JWT generation with user profile
- `GET /api/v1/auth/me`: Current authenticated user from token
- Service: `AuthService` handles login logic, password verification, token generation

**Module: /users** (Fastify routes + UsersService)
- `GET /api/v1/users`: List users (admin-only, company-scoped)
- `POST /api/v1/users`: Create user (admin-only)
- `PATCH /api/v1/users/:id`: Update user (admin-only)
- `DELETE /api/v1/users/:id`: Soft delete user (admin-only)
- Service: `UsersService` manages CRUD with tenant isolation (companyId filter)

**Module: /farms** (Phase 3, Fastify routes + FarmsService)
- `POST /api/v1/farms`: Create farm (company-scoped)
- `GET /api/v1/farms`: List farms (company-scoped, paginated)
- `GET /api/v1/farms/:id`: Get farm detail
- `PATCH /api/v1/farms/:id`: Update farm
- `DELETE /api/v1/farms/:id`: Soft delete farm (guard: fails if zones exist)
- Service: `FarmsService` implements CRUD + child-count checks

**Module: /zones** (Phase 3, Fastify routes + ZonesService)
- `POST /api/v1/zones`: Create zone (zone_type: dairy, breeding, quarantine, etc.)
- `GET /api/v1/zones`: List zones (farm + company-scoped)
- `GET /api/v1/zones/:id`: Get zone detail (includes pen count)
- `PATCH /api/v1/zones/:id`: Update zone
- `DELETE /api/v1/zones/:id`: Soft delete zone (guard: fails if pens exist)
- Service: `ZonesService` manages zone hierarchy + delete guards

**Module: /pens** (Phase 3, Fastify routes + PensService)
- `POST /api/v1/pens`: Create pen (capacity, zone_id)
- `GET /api/v1/pens`: List pens (zone + farm + company-scoped, includes current_animal_count)
- `GET /api/v1/pens/:id`: Get pen detail + animal roster
- `PATCH /api/v1/pens/:id`: Update pen (capacity, metadata)
- `DELETE /api/v1/pens/:id`: Soft delete pen (guard: fails if animals exist)
- Service: `PensService` tracks current animal count + enforces capacity

**Module: /animals** (Phase 3, Fastify routes + AnimalsService)
- `POST /api/v1/animals`: Create animal (UUID → QR code auto-generation)
- `GET /api/v1/animals`: List animals (cursor-based pagination, filters: species, status, zone_id, pen_id)
- `GET /api/v1/animals/:id`: Get animal detail (includes metadata, health_status, qr_code)
- `GET /api/v1/animals/qr/:qr_code`: Lookup by QR code (mobile deep link target)
- `PATCH /api/v1/animals/:id`: Update animal (name, pen_id, metadata)
- `PATCH /api/v1/animals/:id/status`: Change health_status (with audit trail)
- `DELETE /api/v1/animals/:id`: Soft delete animal
- Service: `AnimalsService` implements full CRUD, QR code handling, cursor pagination, status audit

**Module: /config** (Phase 3, Fastify routes + ConfigService — read-only)
- `GET /api/v1/config/animal-types`: List animal type catalog (species, label, metadata)
- `GET /api/v1/config/vaccine-types`: List vaccine types (species-specific)
- `GET /api/v1/config/feed-types`: List feed types (species-specific, cost/calories)
- `GET /api/v1/config/disease-types`: List disease types (contagious flag, mortality rate)
- Service: `ConfigService` generic factory pattern for all config lookups (company-scoped)

---

## 4. Database Schema & Design

### Schema Organization (Drizzle)

**schema/tenancy.ts** (Phase 3 updates)

- `companies` (id, name, subscription_tier, created_at)
- `farms` (id, company_id, name, location, animal_capacity, created_at)
  - Indices: (company_id, id), farm_id
- `zones` (id, farm_id, name, zone_type, description, deleted_at)
  - Indices: (farm_id, company_id), deleted_at
  - DELETE guard: fails if child pens exist
- `pens` (id, zone_id, name, capacity, current_animal_count, deleted_at)
  - Indices: (zone_id, farm_id), deleted_at
  - Tracks current_animal_count for capacity validation
  - DELETE guard: fails if child animals exist

**schema/auth.ts**

- `users` (id, email, password_hash, name, phone)
- `user_farm_roles` (user_id, farm_id, role, assigned_at)

**schema/animals.ts** (Phase 3 full CRUD + QR)

- `animals` (id, company_id, farm_id, pen_id, name, species, health_status, qr_code UNIQUE, type_metadata JSONB, created_at, updated_at, deleted_at)
  - Indices: (pen_id, farm_id), (company_id, farm_id), health_status, deleted_at, UNIQUE(qr_code)
  - health_status: healthy, monitoring, sick, quarantine, recovered, dead, sold
  - qr_code: UUID stored for deep linking (hdfarm://animal/{uuid})
  - type_metadata: Species-specific fields (e.g., heo: littleSize, pregnancyDays; bò: milkYield)
- `batches` (id, farm_id, species, start_date, expected_end_date, initial_count, status)
  - Schema ready for Phase 4, not yet linked to animals
- `animal_batches` (animal_id, batch_id, joined_at, left_at)
  - Schema ready for Phase 4

**schema/config.ts** (Phase 3, read-only reference data — company-scoped)

- `animal_types` (id, company_id, species, label, default_weight_kg, lifespan_days, metadata_schema JSONB)
  - Lookup: Species catalog (heo, bò, gà, etc.) with species-specific defaults
- `vaccine_types` (id, company_id, species, name, recommended_age_days, interval_days, description)
  - Lookup: Vaccination schedules per species (e.g., heo: initial vaccine at 5 days)
- `feed_types` (id, company_id, species, name, calories_per_kg, cost_per_kg, description)
  - Lookup: Feed nutritional info and cost tracking (species-specific)
- `disease_types` (id, company_id, species, name, contagious_flag, mortality_rate_percent, description)
  - Lookup: Disease registry with severity (contagious=true for outbreak tracking)
- All tables have Index: (company_id) — tenant-scoped reference data

**schema/health.ts**

- `health_records` (id, animal_id, company_id, farm_id, status, notes, recorded_by, created_at)
- `disease_records` (id, animal_id, disease_type_id, onset_date, status, created_by)
- `treatment_records` (id, disease_record_id, treatment_type, start_date, end_date, outcome, cost)
- `vaccination_records` (id, animal_id, vaccine_type_id, admin_date, next_due_date, admin_by)

**schema/ops.ts**

- `feeding_records` (id, pen_id, company_id, farm_id, feed_type_id, quantity_kg, cost, recorded_date, recorded_by)
- `reproduction_events` (id, animal_id, event_type, date, details_jsonb, created_by, created_at)

### Soft Delete Pattern

All tables with user/business data have `deleted_at` column (timestamp, nullable):

```sql
SELECT * FROM animals
WHERE company_id = $1 AND farm_id = $2 AND deleted_at IS NULL;

-- Soft delete
UPDATE animals SET deleted_at = NOW() WHERE id = $1;

-- Hard delete (only for testing/admin)
DELETE FROM animals WHERE id = $1;
```

### Indexes Strategy

**Every table has indexes on:**

1. Primary key (UUID)
2. Foreign keys (company_id, farm_id)
3. Common filter columns (status, deleted_at)
4. Unique columns (qr_code, email)

```typescript
pgTable('animals', { ... }, (table) => ({
  pkIdx: primaryKey({ columns: [table.id] }),
  companyFarmIdx: index('animals_company_farm_idx')
    .on(table.companyId, table.farmId),
  statusIdx: index('animals_status_idx').on(table.status),
  qrCodeIdx: uniqueIndex('animals_qr_code_idx').on(table.qrCode),
  deletedAtIdx: index('animals_deleted_at_idx').on(table.deletedAt),
}));
```

### JSONB for Species-Specific Metadata

Instead of separate columns per species, use JSONB `type_metadata`:

```typescript
type_metadata: {
  heo: {
    littleSize: number;
    weanAge: number;
    pregnancyDays: number;
  }
  gà: {
    eggProductionRate: number;
    molePeriodDays: number;
  }
  bò: {
    milkYieldLitersPerDay: number;
    calvingInterval: number;
  }
}
```

### UUID Primary Keys (Not Sequences)

All tables use UUID v4 as primary key:

```sql
CREATE TABLE animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

**Rationale:** No sequence coordination needed in multi-instance deployments; client-side generation possible.

---

## 5. QR Code System

### QR Code Generation Flow

```
1. Create Animal
   ├─ Generate UUID for animal (e.g., "a1b2c3d4-...")
   ├─ Store in animals.qr_code column
   ├─ Generate QR code image: encoding("hdfarm://animal/a1b2c3d4-...")
   └─ Display on animal detail page (web admin)

2. Mobile QR Scan
   ├─ User taps FAB → Camera opens
   ├─ expo-camera scans QR code
   ├─ Extract deep link: "hdfarm://animal/a1b2c3d4-..."
   ├─ Expo Router navigates to: app/animal-detail/{uuid}
   └─ API call: GET /api/v1/animals/a1b2c3d4-...
```

### Deep Linking (Expo)

```typescript
// app/_layout.tsx
import * as Linking from 'expo-linking';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['hdfarm://', 'https://hdfarm.app'],
  config: {
    screens: {
      'animal-detail': 'animal/:uuid',
      'zone-detail': 'zone/:uuid',
      'pen-detail': 'pen/:uuid',
    },
  },
};

export default function RootLayout() {
  return (
    <NavigationContainer linking={linking}>
      {/* ... */}
    </NavigationContainer>
  );
}
```

### QR Code Library

- **Web (Next.js):** `qrcode.react` library
- **Mobile (Expo):** `expo-camera` + `react-native-qrcode-svg` for display

---

## 6. Authentication Flow

### JWT Token Structure

All authenticated requests carry a JWT token with payload:

```typescript
{
  userId: string;      // UUID from users table
  companyId: string;   // UUID from farms.company_id (tenant)
  farmId: string;      // UUID from user_farm_roles.farm_id (scoping)
  role: 'admin' | 'manager' | 'worker' | 'vet';
  iat: number;         // Issued at (Unix timestamp)
  exp: number;         // Expires in 24 hours (Unix timestamp)
}
```

**Signature:** HS256 with `JWT_SECRET` environment variable  
**Expiry:** 24 hours (configured in jwt plugin)  
**Storage:** localStorage (web) or secure storage (mobile)

### Login Sequence

```
1. User submits credentials
   POST /api/v1/auth/login
   { email: "manager@farm.com", password: "..." }

2. Auth Service (auth-service.ts):
   ├─ Query: users WHERE email = $1 AND deleted_at IS NULL
   ├─ Verify: argon2id.verify(password_hash, plaintext)
   ├─ If mismatch: throw AppError(401, 'Invalid credentials')
   ├─ Query: user_farm_roles WHERE user_id = $1
   ├─ Get: companyId from farm → company_id FK
   ├─ Sign JWT with payload above via fastify.jwt.sign()
   └─ Return: { data: { token, user: { id, email, name, role } } }

3. Client stores token:
   ├─ localStorage.setItem('token', response.data.token) [web]
   ├─ SecureStore.setItemAsync('token', ...) [mobile]
   └─ Attach to all requests: Authorization: Bearer {token}

4. Token Verification on Protected Route:
   ├─ Middleware: verifyToken() calls request.jwtVerify()
   ├─ If expired/invalid: throw AppError(401)
   └─ request.user now contains decoded payload

5. Role Check on Protected Route:
   ├─ Middleware: requireRole('manager', 'admin')
   ├─ If req.user.role not in allowed: throw AppError(403)
   └─ Proceed to handler

6. Logout:
   ├─ Client: localStorage.removeItem('token') [web]
   ├─ Client: SecureStore.deleteItemAsync('token') [mobile]
   └─ Redirect to login page
```

### Password Hashing

- Algorithm: **argon2id** (not bcrypt)
- Library: `argon2` npm package
- Configuration: library defaults (memoryCost: 19456, timeCost: 2, parallelism: 1)
- Verification: `argon2.verify(hash, plaintext)` on login

### Role-Based Access Control (RBAC)

Each endpoint uses pre-handlers to enforce auth + roles:

```typescript
// auth-routes.ts example
app.get<{ Params: { userId: string } }>(
  '/api/v1/auth/users/:userId',
  { onRequest: [verifyToken, requireRole('admin', 'manager')] },
  async (req, res) => {
    // Only admin/manager can view user details
    return { data: userService.getById(req.params.userId, req.user) };
  }
);
```

Roles:
- **admin:** Full system access, user management
- **manager:** Farm-level management, CRUD operations
- **worker:** Read + limited write (health checks, feeding)
- **vet:** Health/disease/treatment records only

---

## 7. Frontend Architecture

### Next.js App Router Structure

```
app/
├── layout.tsx              (Root layout, providers)
├── page.tsx                (Dashboard)
├── animals/
│   ├── page.tsx            (Animal list)
│   ├── [id]/
│   │   ├── page.tsx        (Animal detail)
│   │   ├── edit/page.tsx   (Edit form)
│   │   └── actions.ts      (Server actions)
│   └── create/page.tsx     (Create form)
├── health/
│   ├── page.tsx            (Health records)
│   └── [id]/page.tsx       (Health record detail)
├── vaccines/
├── zones/
├── api/
│   └── auth/
│       └── [...nextauth]/route.ts (Auth endpoint — NOT USED, using JWT)
└── _components/
    ├── sidebar.tsx
    ├── animal-table.tsx
    ├── health-badge.tsx
    └── quick-action-buttons.tsx
```

### Server Components by Default

- Fetch data in server components
- Use `<Suspense>` boundaries for slow data
- Minimal client components (buttons, forms)

### Mutations via Server Actions

```typescript
// app/animals/actions.ts
'use server';

import { createAnimal } from '@/lib/animals';
import { revalidatePath } from 'next/cache';

export async function createAnimalAction(formData: FormData) {
  const input = Object.fromEntries(formData);
  const result = await createAnimal(input);
  revalidatePath('/animals');
  return result;
}
```

### Client-Side State (Minimal)

Only for UI state (modals, forms, filters):

```typescript
'use client';

import { useState } from 'react';

export function AnimalFilterForm() {
  const [status, setStatus] = useState<HealthStatus | null>(null);

  const handleFilter = async () => {
    const animals = await fetch(`/api/v1/animals?status=${status}`);
    // ...
  };

  return (
    <form>
      <select value={status || ''} onChange={(e) => setStatus(e.target.value)}>
        {/* ... */}
      </select>
    </form>
  );
}
```

---

## 8. Mobile Architecture

### Expo Router v3 Layout

```
app/
├── _layout.tsx                    (Root with navigation)
├── (auth)/
│   ├── login.tsx
│   ├── signup.tsx
│   └── _layout.tsx
├── (tabs)/
│   ├── _layout.tsx                (Bottom tab bar)
│   ├── home.tsx                   (Dashboard)
│   ├── animals.tsx                (Animal list)
│   ├── qr-scan.tsx                (FAB target)
│   ├── alerts.tsx                 (Notifications)
│   ├── profile.tsx                (User profile)
│   └── [id]/
│       ├── animal-detail.tsx
│       └── quick-actions.tsx
└── _components/
    ├── bottom-sheet.tsx
    ├── qr-scanner-overlay.tsx
    ├── quick-action-button.tsx
    └── animal-card.tsx
```

### Bottom Tab Bar Navigation

```
┌─────────────────────────────────────────┐
│  Home  │  Animals  │  [QR FAB]  │ ...   │
│        │           │           │       │
│        │           │ ⊙ (56px)  │       │
└─────────────────────────────────────────┘
         • 5 tabs total
         • FAB (Floating Action Button) for QR scan at center-top
         • 44px min touch height
```

### QR Scanner Flow

```
1. User taps FAB (QR icon, 56px circle)

2. Camera screen opens:
   ├─ Full-screen camera feed
   ├─ Viewfinder: 240x240px centered
   ├─ Corner brackets (white, 24px arms)
   ├─ Scan line animation (green, 2s loop)
   └─ Permission check: if denied, show alert

3. User points at QR code

4. expo-camera.scanFromURLAsync() scans
   └─ Returns: "hdfarm://animal/uuid"

5. Expo Router navigates → Animal detail screen
   ├─ Fetch: GET /api/v1/animals/{uuid}
   ├─ Display: Animal card + health status
   └─ Bottom sheet slides up with quick actions:
      • Health Check
      • Vaccination
      • Feeding Record
      • Treatment
      • Weight Update

6. User taps quick action
   ├─ Modal opens with form
   ├─ Submit → POST /api/v1/{action}
   └─ Dismiss → Back to animal detail
```

### Quick Action Buttons (Post-Scan)

```typescript
const quickActions = [
  { icon: 'heartbeat', label: 'Health Check', route: 'health-check' },
  { icon: 'syringe', label: 'Vaccination', route: 'vaccination' },
  { icon: 'utensils', label: 'Feeding', route: 'feeding' },
  { icon: 'pill', label: 'Treatment', route: 'treatment' },
  { icon: 'weight', label: 'Weight', route: 'weight-update' },
];
```

---

## 9. Local Development Setup

### Docker Compose (PostgreSQL + pgAdmin)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_DB: hd_farms
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - '5050:80'
    environment:
      PGADMIN_DEFAULT_EMAIL: dev@hd-farm.local
      PGADMIN_DEFAULT_PASSWORD: dev

volumes:
  postgres_data:
```

### Environment Setup

```bash
# 1. Clone and install dependencies
git clone <repo>
cd hd-farm
pnpm install

# 2. Copy env template
cp .env.example .env.local

# 3. Start PostgreSQL
docker-compose up -d

# 4. Create database and tables
pnpm db:migrate

# 5. Seed initial data (optional)
pnpm db:seed

# 6. Start all apps
pnpm dev
# Opens 3 terminals:
# • API: http://localhost:3001
# • Web: http://localhost:3000
# • Mobile: http://localhost:8081
```

### Environment Variables Template

```bash
# .env.example
DATABASE_URL=postgresql://dev:dev@localhost:5432/hd_farms
JWT_SECRET=<change-in-production>
NODE_ENV=development
```

---

## 10. Deployment Architecture (Future)

### Cloud Infrastructure (Phase 2+)

```
┌─────────────────────────────────────────┐
│         Vercel (Web Frontend)           │
│  • Next.js app deployed on Vercel Edge  │
│  • Automatic deployments from GitHub    │
│  • Environment: $NEXT_PUBLIC_API_URL    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       API Gateway / Load Balancer       │
│  • AWS ALB or Cloudflare                │
│  • TLS/SSL termination                  │
│  • Rate limiting, DDoS protection       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    App Service (Fastify API Servers)    │
│  • AWS EC2 / ECS, or Heroku            │
│  • Auto-scaling based on CPU/memory     │
│  • Health checks: /health endpoint      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     PostgreSQL Managed Database         │
│  • AWS RDS, Azure Database, or Render   │
│  • Automated backups                    │
│  • Read replicas for analytics          │
└──────────────────────────────────────────┘
```

---

## 11. Security Architecture (Phase 2)

### Transport Security

- **Production:** HTTPS only (TLS 1.2+)
- **Local Dev:** HTTP allowed via CORS origin whitelist
- **CORS:** Configured in server.ts (WEB_ORIGIN, MOBILE_ORIGIN)
- **Headers:** @fastify/helmet enables security headers (HSTS, CSP, etc.)

### Authentication Security

- **JWT Secret:** ≥256 bits, stored in `JWT_SECRET` env variable (never hardcoded)
- **Signature:** HS256 (symmetric, shared secret)
- **Expiry:** 24 hours (no refresh token in Phase 1 MVP)
- **Token Payload:** includes userId, companyId, farmId, role (verified on every request)
- **Verification:** @fastify/jwt plugin handles decode + expiry check
- **Error:** Invalid/expired tokens return 401 Unauthorized (never expose JWT secret)

### Password Security

- **Algorithm:** argon2id (memory-hard, resistant to GPU attacks)
- **Hashing:** On user creation/password reset via auth-service.ts
- **Verification:** argon2.verify() on login (timing-safe comparison)
- **Storage:** password_hash in users table (never plaintext)
- **Transport:** HTTPS only to prevent credential interception

### Data Security

- **Database Encryption:** TLS in transit (postgres.js), at-rest on cloud (RDS TDE)
- **Soft Delete:** deleted_at IS NULL on all queries (never hard delete)
- **JSONB Fields:** No sensitive data stored without encryption (future: Phase 3)
- **Connection Pooling:** postgres.js manages secure connections

### Access Control

- **Role-Based (RBAC):** admin, manager, worker, vet
  - Enforced via requireRole() middleware on every route
  - Role checked after JWT verification
  - No implicit grants—must be explicit in middleware
- **Tenant Isolation:** Every service query filters by companyId + farmId
  - Values sourced from req.user (JWT payload)
  - Never trust request body for tenant scoping
  - Code review mandatory: check all .where() clauses include both
- **RLS Policies (Phase 2+):** PostgreSQL row-level security policies as defense-in-depth
  - Set app.company_id + app.farm_id context before queries
  - Enforce at database layer (backup if app layer fails)

### Input Validation

- **Yup Schemas:** All user input validated before DB writes
  - Request body, params, query strings validated
  - Type coercion + sanitization via Yup
  - Custom validators for UUID, enum, etc.
- **SQL Injection Prevention:** Drizzle ORM uses parameterized queries
  - No string interpolation in WHERE clauses
  - Database never receives unsanitized user input
- **HTML/XSS Prevention:** Text fields sanitized via sanitize-html (future: Phase 2+)
  - User content in JSONB fields requires explicit sanitization
  - Never render user input as HTML without escaping

### Pre-Commit & Environment

- **.env files not committed:** Git ignores .env, .env.local, .env.*.local
- **Secrets stored in environment:** DATABASE_URL, JWT_SECRET via process.env
- **Production deployment:** Secrets injected via CI/CD (GitHub Actions, etc.)
- **Test database:** Separate test DB for CI (never use production credentials)

---

## 12. Monitoring & Observability (Phase 2+)

### Logging Strategy

- API errors logged with context: userId, farmId, route, error message
- Database queries: slow query log (>1s) monitoring
- Mobile crashes: captured via Sentry

### Metrics to Track

- API response time (p50, p95, p99)
- Error rates by endpoint
- Database connection pool utilization
- Server CPU/memory usage

### Tools (TBD)

- ELK Stack (Elasticsearch, Logstash, Kibana) or
- Datadog or
- New Relic

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-22  
**Next Review:** After API foundation complete (Phase 2)
