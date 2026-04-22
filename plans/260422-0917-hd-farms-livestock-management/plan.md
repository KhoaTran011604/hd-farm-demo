---
title: 'HD-FARM Livestock Management System'
description: 'Multi-tenant livestock management platform: web admin + mobile app + REST API'
status: pending
priority: P1
effort: 45d
branch: main
tags: [monorepo, nextjs, expo, fastify, drizzle, postgres, multi-tenant]
created: 2026-04-22
---

# HD-FARM Livestock Management System

Multi-tenant (multinational/multi-farm) livestock management platform. Supports animal lifecycle tracking: health, vaccination, disease/treatment, feeding (FCR), reproduction, and batch analytics.

## Stack

- **Monorepo**: Turborepo + pnpm
- **API**: Fastify + TypeScript + Drizzle ORM + postgres.js
- **Web**: Next.js 14 App Router + shadcn/ui + Tailwind + Recharts
- **Mobile**: Expo (React Native) + Expo Router v3 + expo-camera + Victory Native
- **DB**: PostgreSQL 16 (Docker Compose local)
- **Shared**: packages/shared (Yup validators, types), packages/db (Drizzle schema)

## Multi-Tenancy

Row-based: company → farm → zone → pen → animal. JWT scoped with `company_id`, `farm_id`, `role`.

## Roles

- **Admin** — super (cross-company)
- **Manager** — farm-level (all resources in farm)
- **Worker** — zone-level (daily ops: weigh, feed, scan)
- **Vet** — medical access (disease, treatment, vaccination)

## Phase Overview

### Phase 1 — Core (~20 days)

| #   | Phase                                                                     | Days | Status  |
| --- | ------------------------------------------------------------------------- | ---- | ------- |
| 01  | [Monorepo Setup + Local Dev Infrastructure](./phase-01-monorepo-setup.md) | 3    | Pending |
| 02  | [Auth System (JWT + RBAC)](./phase-02-auth-system.md)                     | 3    | Pending |
| 03  | [Core Config + Zone/Pen/Animal APIs](./phase-03-core-apis.md)             | 3    | Pending |
| 04  | [Web Admin - Auth + Animal Management](./phase-04-web-admin-animal.md)    | 3    | Pending |
| 05  | [Mobile App Foundation + QR Scanner](./phase-05-mobile-foundation.md)     | 4    | Pending |
| 06  | [Health Status + Quick Actions](./phase-06-health-quick-actions.md)       | 2    | Pending |
| 07  | [Vaccination System + Alerts](./phase-07-vaccination-alerts.md)           | 2    | Pending |

### Phase 2 — Advanced (~25 days)

| #   | Phase                                                           | Days | Status  |
| --- | --------------------------------------------------------------- | ---- | ------- |
| 08  | [Disease Records + Treatment](./phase-08-disease-treatment.md)  | 5    | Pending |
| 09  | [Batch (Lứa) Management](./phase-09-batch-management.md)        | 5    | Pending |
| 10  | [Feeding Records + FCR](./phase-10-feeding-fcr.md)              | 6    | Pending |
| 11  | [Reproduction Events](./phase-11-reproduction.md)               | 7    | Pending |
| 12  | [Advanced Dashboard + Reports](./phase-12-dashboard-reports.md) | 2    | Pending |

## Key Dependencies

- Phase 01 blocks all others (monorepo + DB schema)
- Phase 02 blocks 03–12 (auth middleware required)
- Phase 03 blocks 04, 05, 06 (animal APIs)
- Phase 06 blocks 07 (status history for alerts)
- Phase 08 blocks 09 (disease tied to batch stats)

## Context

- Brainstorm: `../reports/brainstorm-260421-1711-livestock-management-system.md`
- Mobile UX: `../reports/brainstorm-260421-1711-mobile-app-ui-ux-flow.md`
- Web UX: `../reports/brainstorm-260421-1711-web-admin-ui-ux-flow.md`
- Tech: `../reports/researcher-turborepo-monorepo-260422.md`, `../reports/researcher-expo-qr-260422.md`, `../reports/researcher-drizzle-orm-260422.md`
