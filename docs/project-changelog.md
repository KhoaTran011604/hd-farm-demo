# HD-FARM: Project Changelog

All notable changes to the HD-FARM livestock management platform are documented in this file.

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

### For Phase 3 (Core APIs)
- **Optional `farmId` in AuthTokenPayload**: Currently `companyId` is primary scope; Phase 3 may introduce optional `farmId` for multi-farm users
- **Refresh Token Implementation**: Deferred to Phase 2+ (MVP uses 24h access token only)

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
