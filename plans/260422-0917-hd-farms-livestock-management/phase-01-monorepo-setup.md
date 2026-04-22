# Phase 01 — Monorepo Setup + Local Dev Infrastructure

## Context Links
- Research: `../reports/researcher-turborepo-monorepo-260422.md`
- Research: `../reports/researcher-drizzle-orm-260422.md`
- Standards: `../../docs/code-standards.md`

## Overview
- **Priority**: P1 (blocker)
- **Status**: Pending
- **Effort**: 3 days
- **Description**: Bootstrap Turborepo + pnpm workspaces. Provision local PostgreSQL via Docker Compose. Set up packages/shared + packages/db with Drizzle schema and initial migration.

## Key Insights
- Use `postgres.js` (NOT `pg`) — lighter, native connection pooling, better Drizzle DX
- Turborepo remote cache optional for now; local cache is enough
- Drizzle migrations via `drizzle-kit` with `--dialect postgresql`
- Keep shared types in `packages/shared/src/types/` to avoid circular deps

## Requirements

### Functional
- Single `pnpm install` bootstraps all workspaces
- `docker-compose up -d` launches PostgreSQL (port 5432) + pgAdmin (port 5050)
- `pnpm db:migrate` applies all migrations
- `pnpm db:studio` opens Drizzle Studio
- `pnpm dev` runs all apps in parallel (api, web, mobile)

### Non-Functional
- Node >= 20, pnpm >= 9, Turbo >= 2
- All packages use TypeScript strict mode
- Shared ESLint + Prettier configs

## Architecture
```
hd-farms/
├── apps/
│   ├── api/          (Fastify, port 3001)
│   ├── web/          (Next.js, port 3000)
│   └── mobile/       (Expo, port 8081)
├── packages/
│   ├── shared/       (types, Yup validators, constants)
│   ├── db/           (Drizzle schema, migrations, client)
│   ├── eslint-config/
│   └── tsconfig/
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Related Code Files

### Create
- `package.json` (root)
- `pnpm-workspace.yaml`
- `turbo.json`
- `docker-compose.yml`
- `.env.example`, `.env.local`
- `packages/tsconfig/base.json`
- `packages/eslint-config/index.js`
- `packages/shared/package.json`, `src/index.ts`, `src/types/*.ts`, `src/validators/*.ts`
- `packages/db/package.json`, `drizzle.config.ts`, `src/schema/*.ts`, `src/client.ts`, `src/index.ts`

## Implementation Steps

1. **Root init**: `pnpm init`; add `pnpm-workspace.yaml` with `apps/*` + `packages/*`
2. **Install Turbo**: `pnpm add -Dw turbo`; create `turbo.json` with `build`, `dev`, `lint`, `test` pipelines
3. **Shared TS config**: create `packages/tsconfig/base.json` with strict mode, paths
4. **Shared ESLint config**: create `packages/eslint-config/index.js`
5. **Docker Compose**: PostgreSQL 16 + pgAdmin 4, named volumes, healthcheck
6. **packages/db**: `pnpm add drizzle-orm postgres`, `pnpm add -D drizzle-kit`
7. **Drizzle schema** (split by domain):
   - `schema/tenancy.ts` — companies, farms, zones, pens
   - `schema/auth.ts` — users, user_farm_roles
   - `schema/animals.ts` — animals, batches
   - `schema/config.ts` — animal_types, vaccine_types, feed_types, disease_types
   - `schema/health.ts` — health_records, disease_records, treatment_records, vaccination_records
   - `schema/ops.ts` — feeding_records, reproduction_events
   - `schema/index.ts` — barrel export
8. **drizzle.config.ts**: dialect postgresql, schema glob, migrations out
9. **Client**: `packages/db/src/client.ts` — postgres() pool + drizzle() wrapper
10. **packages/shared**: types (UserRole, AnimalStatus, EventType enums), Yup validators, constants (PAGE_SIZE=50)
11. **Generate migration**: `pnpm --filter @hd/db drizzle-kit generate`
12. **Apply**: `pnpm --filter @hd/db drizzle-kit migrate`
13. **Seed stub**: `packages/db/src/seed.ts` (empty for now, hook in phase 03)

## Todo List
- [ ] Initialize pnpm workspace + Turborepo
- [ ] Create docker-compose.yml (Postgres + pgAdmin)
- [ ] Bootstrap packages/tsconfig + eslint-config
- [ ] Bootstrap packages/shared (types, validators)
- [ ] Bootstrap packages/db with Drizzle
- [ ] Write full schema (8 files by domain)
- [ ] Generate + apply initial migration
- [ ] Verify `pnpm dev` runs all placeholder apps
- [ ] Compile check: `pnpm -r tsc --noEmit`

## Success Criteria
- `docker compose up -d && pnpm db:migrate` provisions DB with all tables
- `pnpm db:studio` shows all tables
- All packages compile (`pnpm -r tsc --noEmit` exits 0)
- Git-ignored `.env.local` documented in `.env.example`

## Risk Assessment
- **Drizzle schema drift**: mitigate with CI check `drizzle-kit check`
- **pnpm hoisting bugs**: use `.npmrc` with `node-linker=hoisted` if issues
- **Windows path issues**: use forward slashes in scripts; test on Windows first

## Security Considerations
- `.env.local` + `.env.production` in `.gitignore`
- Default Postgres password only for local dev; rotate for deployment
- pgAdmin behind localhost-only binding

## Next Steps
- Phase 02 depends on schema + client from this phase
- Install Fastify in apps/api, Next.js in apps/web, Expo in apps/mobile (placeholder only)
