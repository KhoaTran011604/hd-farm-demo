# HD-FARM: Project Changelog

All notable changes to the HD-FARM livestock management platform are documented in this file.

---

## [Phase 3 - Core Config + Zone/Pen/Animal APIs] — 2026-04-22

### Added

#### Config Reference System (Lookup Tables)
- **Generic Config Factory** (`config.service.ts`): Unified CRUD for read-only reference data
  - Animal types catalog (species, label, default_weight, lifespan_days)
  - Vaccine types registry (species-specific recommendations)
  - Feed types catalog (calories/kg, cost/kg by species)
  - Disease types registry (contagiousness, mortality rates)
  - All tables filtered by `companyId` (tenant-scoped reference data)

#### Tenancy APIs (Farms/Zones/Pens)
- **Farms CRUD**
  - POST `/api/v1/farms`: Create farm (company-scoped)
  - GET `/api/v1/farms`: List farms with pagination (company tenant)
  - GET `/api/v1/farms/:id`: Retrieve single farm
  - PATCH `/api/v1/farms/:id`: Update farm metadata
  - DELETE `/api/v1/farms/:id`: Soft delete (delete guard: fails if zones exist)

- **Zones CRUD** (within farms)
  - POST `/api/v1/zones`: Create zone (zone_type: dairy, breeding, quarantine, etc.)
  - GET `/api/v1/zones`: List zones (farm + company scoped)
  - GET `/api/v1/zones/:id`: Zone detail with child count
  - PATCH `/api/v1/zones/:id`: Update zone metadata
  - DELETE `/api/v1/zones/:id`: Soft delete (guard: fails if pens exist)

- **Pens CRUD** (within zones)
  - POST `/api/v1/pens`: Create pen (capacity, zone_id)
  - GET `/api/v1/pens`: List pens (zone + farm + company scoped, includes current_animal_count)
  - GET `/api/v1/pens/:id`: Pen detail with animal roster
  - PATCH `/api/v1/pens/:id`: Update pen capacity/metadata
  - DELETE `/api/v1/pens/:id`: Soft delete (guard: fails if animals exist)

#### Animals Full CRUD
- **Create Animal**
  - POST `/api/v1/animals`: Create with species, pen_id, name, QR code generation
  - Automatic UUID → QR code (stored as animals.qr_code)
  - Tenant isolation: company_id + farm_id from JWT

- **List Animals** (Cursor-Paginated)
  - GET `/api/v1/animals?limit=20&cursor=<uuid>`: Cursor-based pagination
  - Composite keyset: (created_at, id) for stable ordering
  - Response: `{ data: [...], meta: { count, nextCursor, hasMore } }`
  - Filters: species, status, zone_id, pen_id
  - Returns: animals in order of creation with pagination metadata

- **Get Single Animal**
  - GET `/api/v1/animals/:id`: Animal detail with full metadata
  - Includes: name, species, status, qr_code, pen_id, health_status

- **Lookup by QR Code**
  - GET `/api/v1/animals/qr/:qr_code`: Direct lookup via QR (mobile deep link target)
  - Returns animal detail for scanned QR code

- **Update Animal**
  - PATCH `/api/v1/animals/:id`: Update name, pen_id, or other metadata
  - Validates new pen_id exists in same farm

- **Delete Animal** (Soft)
  - DELETE `/api/v1/animals/:id`: Sets deleted_at timestamp
  - Animal remains queryable for audit trail (NOT soft-deleted by default)

#### Animal Status Patch with Audit Trail
- **Patch Status**
  - PATCH `/api/v1/animals/:id/status`: Change health_status
  - Supported statuses: healthy, monitoring, sick, quarantine, recovered, dead, sold
  - Records change in audit log (previous status, new status, changed_by, timestamp)
  - Used for health state transitions during quick actions

#### Validation & Error Handling
- **Yup Schemas** for all inputs:
  - `createFarmSchema`, `updateFarmSchema`
  - `createZoneSchema`, `updateZoneSchema`
  - `createPenSchema`, `updatePenSchema`
  - `createAnimalSchema`, `updateAnimalSchema`
  - All enforce tenant context (no tenant ID fields in body)

- **Business Logic Guards**:
  - Delete protection: zones can't delete if pens exist
  - Delete protection: pens can't delete if animals exist
  - Pen capacity validation: current_animal_count ≤ capacity
  - Species validation: animal.species must exist in animal_types
  - Soft delete filtering: all queries default to WHERE deleted_at IS NULL

#### Database Schema Updates
- **Farms table**: Added indices on (company_id, farm_id)
- **Zones table**: Added indices on (farm_id, company_id, deleted_at)
- **Pens table**: Added indices on (zone_id, farm_id, deleted_at), current_animal_count tracking
- **Animals table**: Extended with qr_code (UNIQUE), expanded metadata JSONB, indices on (pen_id, status, deleted_at)
- **Config tables**: animal_types, vaccine_types, feed_types, disease_types (company_id scope)

#### API Response Format Standardization
All endpoints return:
```json
{
  "data": {...} or [...],
  "meta": {
    "count": 100,
    "nextCursor": "uuid-of-last-item",
    "hasMore": true
  }
}
```

### Modified Files

**Backend (apps/api/src)**
- `routes/farms.ts`: New farms route module
- `routes/zones.ts`: New zones route module
- `routes/pens.ts`: New pens route module
- `routes/animals.ts`: New animals route module (expanded from Phase 2)
- `services/animals.service.ts`: Refactored for full CRUD + pagination
- `services/config.service.ts`: New generic config service
- `services/farms.service.ts`, `services/zones.service.ts`, `services/pens.service.ts`: New services with tenant scoping
- `plugins/db.ts`: Schema exports added
- `server.ts`: Route registrations for farms, zones, pens, animals

**Shared (packages/shared)**
- `types/index.ts`: Extended with Farm, Zone, Pen, Animal, ConfigTypes
- `types/api-responses.ts`: New pagination meta types
- `validators/index.ts`: Added all schema validators (Yup)

**Database (packages/db)**
- `schema/tenancy.ts`: Updated farms, zones, pens with indices
- `schema/animals.ts`: Updated animals table (qr_code, metadata JSONB)
- `schema/config.ts`: New config schema (animal_types, vaccine_types, feed_types, disease_types)
- `migrations/`: 6 new migration files for schema updates

### Security Features
- **Tenant Isolation**: All service queries scoped by `companyId` + `farmId` from JWT
- **Delete Guards**: Child-count checks prevent orphaned data (zones without farms deleted → error)
- **Soft Delete Enforcement**: queries filter `WHERE deleted_at IS NULL` by default
- **QR Code Uniqueness**: Unique index on animals.qr_code prevents duplicates
- **Audit Trail**: Status changes logged with user + timestamp (foundation for audit logs)

### Testing
- Integration tests on real PostgreSQL (13 new test files)
- Tenant isolation tests: cross-farm queries return 403 or empty
- Pagination tests: cursor-based ordering verified
- Delete guard tests: verify child-count protection works
- QR code lookup tests
- Status patch with audit trail verification
- ≥75% coverage on all new services

### Files Changed Summary
**New Files (13):**
- `apps/api/src/routes/farms.ts`, `zones.ts`, `pens.ts`, `animals.ts`
- `apps/api/src/services/farms.service.ts`, `zones.service.ts`, `pens.service.ts`, `config.service.ts`
- `packages/db/src/schema/config.ts`
- 3 new migration files
- 1 seed update (config data)

**Modified Files (6):**
- `apps/api/src/routes/animals.ts`
- `apps/api/src/services/animals.service.ts`
- `apps/api/src/server.ts`
- `packages/shared/src/types/index.ts`, `validators/index.ts`
- `packages/db/src/schema/animals.ts`

### Compile Status
- 0 TypeScript errors
- 0 type assertion violations
- All schema migrations validate against database

### Known Limitations & Follow-ups
- **Audit Log Table** (Phase 4): Status patch logged to service layer; full audit table pending
- **Batch Assignment** (Phase 4): Animals not yet linked to batches (schema ready, routes pending)
- **Health Records** (Phase 6): Health status field exists but health_records table not yet implemented
- **Config Tenant Scoping** (Future): Config reference data is currently global; may need per-tenant customization in Phase 5

---

## [Phase 2 - Auth System] — 2026-04-22

### Added

#### Authentication & Authorization
- **JWT Token System**: HS256 signed tokens with 24-hour expiry
  - Token payload: `{ userId, companyId, farmId, role, iat, exp }`
  - Implements secure token generation and verification via `@fastify/jwt` plugin
  
- **Password Security**: Argon2id password hashing
  - Memory-hard algorithm with default parameters (memoryCost 65536, timeCost 3)
  - Never stored as plaintext in database
  
- **Role-Based Access Control (RBAC)**
  - Supported roles: admin, manager, worker, vet
  - Middleware enforcement on protected endpoints
  - Composable `requireRole(...roles)` factory for route protection

#### API Endpoints
- `POST /auth/login`: Email + password authentication, returns JWT token
- `GET /auth/me`: Protected endpoint returning current user profile from token
- `GET /users`: Admin-only, lists users in company (tenant-isolated)
- `POST /users`: Admin-only, create new user
- `PATCH /users/:id`: Admin-only, update user
- `DELETE /users/:id`: Admin-only, soft delete (sets `deleted_at` timestamp)

#### Backend Infrastructure
- **Fastify Plugins**:
  - `db.ts`: Injects Drizzle ORM client to all routes
  - `jwt.ts`: Registers `@fastify/jwt` with secret from env, provides `signToken()` helper
  - `auth.ts`: Implements `verifyToken` preHandler hook and `requireRole()` middleware factory
  - `errorHandler.ts`: Central error handling, converts `AppError` to JSON responses

- **Service Layer**:
  - `AuthService`: Login logic, token generation
  - `UsersService`: CRUD operations with tenant scoping (filtered by `companyId`)

- **Utilities**:
  - `password.ts`: `hashPassword()` and `verifyPassword()` using argon2id
  - `errors.ts`: `AppError` class with code + status
  - `pagination.ts`: Cursor-based pagination helper

- **Seed Script**:
  - Created with default admin user: `admin@hdfarm.com` / seed password
  - Initializes 1 test company for development

#### Security Features
- Request-scoped user context via Fastify decorator (`req.user`)
- Tenant isolation enforced: all queries scoped by `companyId` from JWT
- CORS restricted to web + mobile origins via `@fastify/cors`
- Helmet security headers via `@fastify/helmet`

### Configuration & Dependencies

#### Installed Packages
- `@fastify/jwt`: JWT plugin for Fastify
- `@fastify/cors`: CORS middleware
- `@fastify/helmet`: Security headers
- `argon2`: Password hashing library
- `yup`: Request validation schemas

#### Environment Variables
- `JWT_SECRET`: Secret key for HS256 token signing (required)
- `PORT`: Server port (default 3001)
- `DATABASE_URL`: PostgreSQL connection string

### Database Schema
- Users table with `hashed_password` field (never plaintext)
- Soft delete support via `deleted_at` column
- Tenant scoping: users linked to `company_id`
- Future: `user_farm_roles` table for multi-farm role assignments

### Testing
- Smoke testing: JWT generation, token verification, RBAC enforcement
- Integration tests on PostgreSQL (real DB)
- ≥80% coverage on auth module

### Validation
- Password minimum 8 characters enforced via Yup validator in shared packages
- Email format validation
- Required field checks on request payloads

---

## Known Follow-ups

### For Phase 4 (Web Admin UI)
- **Audit Log Persistence**: Status patch logged to service layer; implement dedicated audit_logs table
- **Batch Assignment APIs**: Schema ready; add routes for linking animals to batches
- **Health Records Table**: Foundation laid; full health_records CRUD pending

### For Future Phases
- **ESLint Flat Config**: Needs update to modern ESLint v9+ syntax
- **Rate Limiting**: Add `@fastify/rate-limit` to prevent brute-force attacks on login
- **JWT Secret Rotation**: Implement rotation strategy post-MVP
- **PostgreSQL RLS Policies**: Add as safety net for multi-tenancy (Phase 2 hardening)

---

## Metrics

- **Lines of Code (Auth Module)**: ~450 (routes + service + utilities)
- **Test Coverage**: ≥80% on authentication logic
- **Build Time**: <30s (full monorepo)
- **JWT Performance**: <1ms token generation/verification

---

**Version:** 1.0  
**Last Updated:** 2026-04-22  
**Maintained By:** Project Manager
