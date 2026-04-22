# HD-FARMS: System Architecture & Design

This document describes the complete system architecture, data flow, and integration patterns for HD-FARMS livestock management platform.

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
  userId: string;          // UUID
  companyId: string;       // UUID — REQUIRED for all queries
  farmId: string;          // UUID — REQUIRED for all queries
  role: 'admin' | 'manager' | 'worker' | 'vet';
  iat: number;             // Issued at
  exp: number;             // Expires in 24 hours
}
```

### Query Scoping (MANDATORY)
**Every database query MUST filter by `companyId` AND `farmId`:**

```typescript
// ✗ BAD — exposes cross-tenant data
const animals = await db.select()
  .from(animals_table)
  .where(eq(animals_table.farmId, req.user.farmId));

// ✓ GOOD — full tenant isolation
const animals = await db.select()
  .from(animals_table)
  .where(and(
    eq(animals_table.companyId, req.user.companyId),
    eq(animals_table.farmId, req.user.farmId),
    isNull(animals_table.deletedAt) // Soft delete filter
  ));
```

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

## 3. API Layer Architecture

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
│    • Pre-handler hooks: [authenticate, requireRole('manager')]  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 3. JWT Verification (Plugin: jwt.ts)                           │
│    • Decode JWT → extract { userId, companyId, farmId, role }  │
│    • Attach to req.user                                         │
│    • If invalid: 401 Unauthorized                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 4. Role-Based Authorization (Plugin: auth.ts)                  │
│    • Check req.user.role in allowed roles                       │
│    • If not allowed: 403 Forbidden                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 5. Input Validation (Schema: animal.schema.ts + Yup)           │
│    • Validate req.body against Yup schema                       │
│    • Type-safe validated data                                   │
│    • If invalid: 400 Bad Request with error details             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 6. Service Layer (animal.service.ts)                            │
│    • animalService.create(validatedInput, req.user)             │
│    • Scope all queries by req.user.companyId + req.user.farmId │
│    • Business logic (validation, state transitions, etc.)       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 7. Database Layer (Drizzle + postgres.js)                      │
│    • db.animals.insert({ ...data, companyId, farmId })         │
│    • Return created entity or throw AppError                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 8. Response Formatting                                          │
│    • Single: { data: {...} }                                   │
│    • List: { data: [...], meta: { count, page, limit } }      │
│    • Error: { statusCode: 400, message: "..." }               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 9. HTTP Response (201 Created / 200 OK / 4xx / 5xx)            │
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

---

## 4. Database Schema & Design

### Schema Organization (Drizzle)

**schema/tenancy.ts**
- `companies` (id, name, subscription_tier, created_at)
- `farms` (id, company_id, name, location, animal_capacity, created_at)
- `zones` (id, farm_id, name, zone_type, description)
- `pens` (id, zone_id, name, capacity, current_animal_count)

**schema/auth.ts**
- `users` (id, email, password_hash, name, phone)
- `user_farm_roles` (user_id, farm_id, role, assigned_at)

**schema/animals.ts**
- `animals` (id, company_id, farm_id, pen_id, name, species, status, qr_code, type_metadata, created_at, updated_at, deleted_at)
- `batches` (id, farm_id, species, start_date, expected_end_date, initial_count, status)
- `animal_batches` (animal_id, batch_id, joined_at, left_at)

**schema/config.ts** (read-only lookup tables)
- `animal_types` (species, label, default_weight, lifespan_days)
- `vaccine_types` (id, name, species, recommended_age_days, interval_days)
- `feed_types` (id, name, species, calories_per_kg, cost_per_kg)
- `disease_types` (id, name, species, contagious_flag, mortality_rate)

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
  };
  gà: {
    eggProductionRate: number;
    molePeriodDays: number;
  };
  bò: {
    milkYieldLitersPerDay: number;
    calvingInterval: number;
  };
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
   ├─ Generate QR code image: encoding("hdfarms://animal/a1b2c3d4-...")
   └─ Display on animal detail page (web admin)

2. Mobile QR Scan
   ├─ User taps FAB → Camera opens
   ├─ expo-camera scans QR code
   ├─ Extract deep link: "hdfarms://animal/a1b2c3d4-..."
   ├─ Expo Router navigates to: app/animal-detail/{uuid}
   └─ API call: GET /api/v1/animals/a1b2c3d4-...
```

### Deep Linking (Expo)
```typescript
// app/_layout.tsx
import * as Linking from 'expo-linking';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['hdfarms://', 'https://hdfarms.app'],
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

### Login Sequence
```
1. User submits credentials (email + password)
   POST /api/v1/auth/login
   { email: "manager@farm.com", password: "..." }

2. API:
   ├─ Query: users WHERE email = $1
   ├─ Verify: argon2.verify(hash, password)
   ├─ If invalid: return 401 Unauthorized
   ├─ Query: user_farm_roles WHERE user_id = $1
   ├─ Get: company_id from farm_id FK
   ├─ Sign JWT:
   │  {
   │    userId: user.id,
   │    companyId: farm.company_id,
   │    farmId: farm.id,
   │    role: user_farm_role.role,
   │    iat: now(),
   │    exp: now() + 24h
   │  }
   └─ Return: { data: { token, user: { id, name, role } } }

3. Client (Web/Mobile):
   ├─ Store token in localStorage (web) or secure storage (mobile)
   ├─ Attach to every request: Authorization: Bearer {token}
   └─ On token expiry (24h): Redirect to login

4. Logout:
   ├─ Clear token from storage
   └─ Redirect to login page
```

### Token Expiry (24 hours)
- No refresh tokens (Phase 1 MVP)
- Users must re-login after 24 hours
- Phase 2: Consider refresh token strategy

### Role-Based Access Control (RBAC)
Each endpoint decorated with `requireRole(roles)`:
```typescript
app.get(
  '/api/v1/animals',
  {
    onRequest: [app.authenticate, app.requireRole(['admin', 'manager', 'worker'])]
  },
  async (req, res) => { ... }
);
```

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
   └─ Returns: "hdfarms://animal/uuid"

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
      - "5432:5432"
    environment:
      POSTGRES_DB: hd_farms
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: dev@hd-farms.local
      PGADMIN_DEFAULT_PASSWORD: dev

volumes:
  postgres_data:
```

### Environment Setup
```bash
# 1. Clone and install dependencies
git clone <repo>
cd hd-farms
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

## 11. Security Architecture

### Transport Security
- HTTPS only in production (TLS 1.2+)
- Certificate pinning (mobile app — Phase 2)
- HSTS header (web)

### Authentication Security
- JWT secret ≥256 bits, stored in environment only
- JWT signed with HS256 (symmetric)
- Token expiry: 24 hours
- Refresh token strategy: Phase 2+ (consider HS256 rotation)

### Data Security
- Passwords: argon2id hashing (never stored plaintext)
- Database encryption: TLS in transit, at-rest encryption on cloud (RDS)
- Soft delete: never hard delete user/animal data

### Access Control
- Role-based: admin, manager, worker, vet
- Tenant isolation: every query scoped by companyId + farmId
- RLS policies (Phase 2): PostgreSQL policies enforce at database layer

### Input Validation
- All user input validated via Yup before DB writes
- HTML sanitization for text fields with user content
- SQL injection prevention: parameterized queries (Drizzle handles)

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
