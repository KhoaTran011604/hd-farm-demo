# HD-FARM

Multi-tenant livestock management platform for large-scale farms (5,000+ animals, multi-zone, multi-species). Vietnamese-first SaaS with integrated web + mobile experience.

## Overview

HD-FARM centralizes livestock operations — health tracking, vaccination, feeding, disease reporting, breeding — into one real-time system across web and mobile.

- **Scope:** Vietnam-focused, hogs / poultry / cattle, per-farm SaaS subscription
- **Users:** Farm managers, zone workers, veterinarians, farm owners
- **Stack:** Turborepo monorepo (pnpm workspaces)

### Monorepo structure

```
apps/
  api/       Fastify + JWT + argon2     (port 3000)
  web/       Next.js 15 + React 19      (port 3001)
  mobile/    Expo 54 / React Native     (port 8081)
packages/
  db/        Drizzle ORM + Postgres schemas / migrations / seed
  shared/    Shared types & utilities
  eslint-config/
  tsconfig/
docker-compose.yml   Postgres 16 + pgAdmin
```

## Prerequisites

- **Node.js** `>=20`
- **pnpm** `>=9` (repo pins `pnpm@10.30.2`)
- **Docker + Docker Compose** (for local Postgres)
- **Expo Go** app on a device/emulator (only for mobile development)

## Installation

### 1. Clone & install dependencies

```bash
git clone <repo-url> hd-farm
cd hd-farm
pnpm install
```

### 2. Configure environment variables

Copy the example env files and fill in values:

```bash
# Root — used by @hd-farm/db (Drizzle)
cp .env.example .env

# API
cp apps/api/.env.example apps/api/.env

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

Key variables:

- `DATABASE_URL` — Postgres connection string, e.g. `postgres://hdfarm:hdfarm@localhost:5432/hdfarm`
- `JWT_SECRET` — long random string used by the API

### 3. Start Postgres (Docker)

```bash
docker compose up -d
```

This starts:

- **Postgres 16** on `localhost:5432` (user/pass/db = `hdfarm`)
- **pgAdmin** on `http://127.0.0.1:5050` (`admin@hdfarm.com` / `admin`)

## Migrate the database

All DB commands are scripted from the repo root:

```bash
# Generate SQL from schema changes (only when schema edited)
pnpm db:generate

# Apply migrations to the database
pnpm db:migrate

# Validate schema/migration drift
pnpm db:check

# Open Drizzle Studio (GUI) at https://local.drizzle.studio
pnpm db:studio
```

Migration files live under `packages/db/migrations/`.

## Run the seed

The seed script creates an admin account, a demo company, 1 farm, 2 zones, 4 pens, sample config (animal / vaccine / feed / disease types) and 10 sample animals.

```bash
pnpm --filter @hd-farm/db exec tsx src/seed.ts
```

Seed credentials:

```
email:    admin@hdfarm.com
password: admin@hdfarm.com
```

> The seed is idempotent-guarded: if the `HDF` company already exists it skips and exits.

## Run the apps

Run everything in parallel with Turbo:

```bash
pnpm dev
```

Or run one app at a time:

```bash
pnpm --filter @hd-farm/api    dev   # http://localhost:3000
pnpm --filter @hd-farm/web    dev   # http://localhost:3001
pnpm --filter @hd-farm/mobile dev   # Expo dev server, port 8081
```

## Common scripts

```bash
pnpm build        # build all apps/packages
pnpm lint         # lint all packages
pnpm type-check   # TypeScript check across the monorepo
pnpm test         # run tests across the monorepo
```

## Quick-start (TL;DR)

```bash
pnpm install
cp .env.example .env && cp apps/api/.env.example apps/api/.env && cp apps/mobile/.env.example apps/mobile/.env
docker compose up -d
pnpm db:migrate
pnpm --filter @hd-farm/db exec tsx src/seed.ts
pnpm dev
```

Login at `http://localhost:3001` with `admin@hdfarm.com` / `admin@hdfarm.com`.
