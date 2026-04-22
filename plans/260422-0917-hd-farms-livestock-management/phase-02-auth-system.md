# Phase 02 — Auth System (JWT + RBAC)

## Context Links
- Brainstorm: `../reports/brainstorm-260421-1711-livestock-management-system.md`
- Schema: `packages/db/src/schema/auth.ts`

## Overview
- **Priority**: P1
- **Status**: Complete
- **Effort**: 3 days
- **Description**: JWT auth + multi-tenant scoping + role-based access control. Users CRUD (admin-only).

## Key Insights
- JWT payload: `{ userId, companyId, farmId, role, iat, exp }`
- Single JWT secret via env; HS256 sufficient for MVP (RS256 later if exposing externally)
- Password hashing: `argon2` (NOT bcrypt) — better memory-hard algorithm
- Refresh tokens OUT OF SCOPE for MVP; access token expires 24h, force re-login
- `user_farm_roles` table enables multi-farm users (future); MVP query by single farm scope

## Requirements

### Functional
- `POST /auth/login` → `{ email, password }` → `{ token, user }`
- `POST /auth/logout` → invalidate client-side (no server blacklist in MVP)
- `GET /auth/me` → current user profile (from JWT)
- `GET /users` (admin) — list users in company
- `POST /users` (admin) — create user
- `PATCH /users/:id` (admin) — update user
- `DELETE /users/:id` (admin) — soft delete (set `deleted_at`)

### Non-Functional
- Password min 8 chars; enforce via Yup validator in shared
- JWT verify middleware + role-check middleware composable
- Request-scoped user context via Fastify decorator

## Architecture
```
apps/api/src/
├── server.ts                   (Fastify bootstrap)
├── plugins/
│   ├── jwt.ts                  (@fastify/jwt)
│   ├── auth.ts                 (verifyToken hook, requireRole)
│   └── db.ts                   (inject drizzle client)
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.schema.ts      (Yup schemas for req/res)
│   └── users/
│       ├── users.routes.ts
│       ├── users.service.ts
│       └── users.schema.ts
└── utils/
    ├── password.ts             (argon2 hash/verify)
    └── errors.ts               (AppError, handler)
```

## Related Code Files

### Create
- `apps/api/src/server.ts`
- `apps/api/src/plugins/{jwt,auth,db,errorHandler}.ts`
- `apps/api/src/modules/auth/*.ts`
- `apps/api/src/modules/users/*.ts`
- `apps/api/src/utils/{password,errors,pagination}.ts`
- `packages/shared/src/types/auth.ts` (UserRole, AuthPayload)
- `packages/shared/src/validators/auth.ts` (loginSchema, userCreateSchema)

## Implementation Steps

1. **Install deps**: `@fastify/jwt`, `@fastify/cors`, `@fastify/helmet`, `argon2`, `zod-to-json-schema` (optional), Yup for request validation
2. **server.ts**: register plugins, register modules, listen on PORT
3. **Password utility**: `hashPassword(plain)`, `verifyPassword(plain, hash)` using argon2id
4. **JWT plugin**: register `@fastify/jwt` with secret from env; helper `signToken(payload)`
5. **Auth plugin**: `preHandler` hook `verifyToken` decodes JWT → `req.user`; `requireRole(...roles)` factory
6. **Auth routes**:
   - POST /auth/login — lookup user by email, verify password, return token
   - GET /auth/me — return `req.user` + fresh DB snapshot
7. **Users service**: CRUD with tenant scoping (filter by `req.user.companyId`)
8. **Users routes**: all behind `requireRole('admin')`; create with `company_id` from JWT
9. **Error handler**: central AppError → JSON response with code + status
10. **Pagination utility**: cursor-based `{ limit, cursor }` → `{ items, nextCursor }`
11. **Seed script** (`packages/db/src/seed.ts`): create 1 company + 1 admin user `admin@hd.local / Admin@123`
12. **Manual test**: `curl` login, use token for `/auth/me` + `/users`
13. **Compile + lint check**

## Todo List
- [x] Install Fastify + plugins + argon2
- [x] Build password utility
- [x] Wire JWT plugin + auth hook
- [x] Implement auth routes (login, me)
- [x] Implement users CRUD (admin-scoped)
- [x] Write seed script with default admin
- [x] Write Yup validators in shared
- [x] Manual smoke test
- [x] Compile check

## Success Criteria
- Login returns valid JWT; `/auth/me` returns user
- Non-admin calling `/users` returns 403
- User created in company A invisible to company B
- argon2 hashes verified (never plaintext in DB)

## Risk Assessment
- **JWT secret leakage**: enforce env, rotate if leaked
- **Password brute-force**: rate-limit login route (add `@fastify/rate-limit` later if needed)
- **Tenant leak**: always inject `companyId` from JWT, never from request body/query

## Security Considerations
- argon2id with default parameters (memoryCost 65536, timeCost 3)
- JWT expires 24h; no refresh in MVP
- Disable `err.stack` in production error responses
- CORS restricted to web + mobile origins

## Next Steps
- Phase 03 consumes `req.user` for scoping
- Consider refresh tokens + rate-limit after Phase 07
