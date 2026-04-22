---
title: Phase 03 — Core Config + Zone/Pen/Animal APIs
description: CRUD for config, zones, pens, animals with tenant scoping, QR generation, and cursor pagination
status: completed
priority: P1
effort: 3 days
branch: khoatran/phase-1-2
tags:
  - backend
  - apis
  - tenant-scoping
  - qr-generation
  - pagination
created: 2026-04-22
---

# Phase 03 — Core Config + Zone/Pen/Animal APIs

## Context Links
- Brainstorm: `../reports/brainstorm-260421-1711-livestock-management-system.md`
- Schema: `packages/db/src/schema/{animals,config,tenancy}.ts`

## Overview
- **Priority**: P1
- **Status**: Complete
- **Effort**: 3 days
- **Description**: CRUD for core config tables + zones/pens/animals. QR generation + QR lookup endpoint for mobile scanner.

## Key Insights
- Config tables (animal_types, vaccine_types, feed_types, disease_types) are company-scoped — seeded defaults plus custom entries
- Animal QR = `animal.uuid` (v4); QR image generated on-demand in web admin, not stored
- Pen `current_count` is a COMPUTED field from `SELECT COUNT(*) FROM animals WHERE pen_id = ?` — expose via view or lazy compute in service
- Cursor pagination mandatory for animals (farms may have 5000+)

## Requirements

### Functional
- **Config CRUD** (admin/manager): animal_types, vaccine_types, feed_types, disease_types
- **Zones CRUD** (manager+): create/list/update/delete; scoped by farm_id
- **Pens CRUD** (manager+): same as zones; with capacity + current_count
- **Animals CRUD**:
  - `GET /animals?farmId=&zoneId=&penId=&status=&batchId=&cursor=&limit=` (paginated)
  - `GET /animals/:id` — full detail
  - `GET /animals/by-qr/:uuid` — mobile QR lookup
  - `POST /animals` — create, auto-generate UUID QR
  - `PATCH /animals/:id` — update
  - `PATCH /animals/:id/status` — quick status change
  - `DELETE /animals/:id` — soft delete

### Non-Functional
- All responses strictly typed from shared package
- Yup validation on all mutations
- Response time < 200ms for cursor-paginated list

## Architecture
```
apps/api/src/modules/
├── config/
│   ├── animalTypes.{routes,service}.ts
│   ├── vaccineTypes.{routes,service}.ts
│   ├── feedTypes.{routes,service}.ts
│   └── diseaseTypes.{routes,service}.ts
├── tenancy/
│   ├── farms.{routes,service}.ts
│   ├── zones.{routes,service}.ts
│   └── pens.{routes,service}.ts
└── animals/
    ├── animals.routes.ts
    ├── animals.service.ts
    └── animals.schema.ts
```

## Related Code Files

### Create
- `apps/api/src/modules/config/*`
- `apps/api/src/modules/tenancy/{farms,zones,pens}.*`
- `apps/api/src/modules/animals/*`
- `packages/shared/src/validators/{animal,zone,pen,config}.ts`
- `packages/shared/src/types/{animal,tenancy,config}.ts`
- `packages/db/src/seed.ts` — extend with default config rows

### Modify
- `apps/api/src/server.ts` — register new routes

## Implementation Steps

1. **Config generic service**: single `createConfigModule(tableName, validator)` factory → DRY
2. **Farms service**: CRUD scoped by `companyId` from JWT; manager restricted to own farm
3. **Zones service**: CRUD scoped by farm; verify farm belongs to company
4. **Pens service**: CRUD scoped by zone → farm → company; `current_count` via subquery
5. **Animals service**:
   - `list({ filters, cursor, limit })` — Drizzle `.where(and(...))` + `.limit(limit+1)` + `.orderBy(asc(id))`
   - `getById(id)` — include joined zone, pen, batch, animal_type
   - `getByQr(uuid)` — index on `uuid` column; same joined shape
   - `create(data)` — generate uuid v4 for QR, set `company_id` + `farm_id` from zone→farm lookup
   - `updateStatus(id, status, reason?)` — insert row into `health_records` audit stub
6. **Animals routes**: role guards — admin/manager all; worker only status/weight update; vet read + disease/vaccination only
7. **QR image generation**: client-side (web admin) using `qrcode` NPM — no server endpoint needed
8. **Pagination helper**: extract cursor-based helper in `utils/pagination.ts`, reusable
9. **Seed extension**: add 1 farm, 2 zones, 4 pens, 3 animal_types (gà, heo, bò), 5 vaccine_types, 5 feed_types, 5 disease_types, 10 sample animals
10. **Validate + compile check**

## Todo List
- [x] Config generic module factory (`config-factory.ts` + `config-routes.ts`)
- [x] Farms/Zones/Pens CRUD with tenant scoping + child-count guards on delete
- [x] Animals service + QR uuid generation (randomUUID)
- [x] Animals list with cursor pagination (composite keyset: createdAt|id) + filters
- [x] `GET /animals/by-qr/:uuid` endpoint
- [x] `PATCH /animals/:id/status` with healthRecords audit (transaction)
- [x] Shared validators (Yup) + types for config, tenancy, animal status
- [x] Seed extended with 2 zones, 4 pens, 3 animal_types, 5 vaccine_types, 5 feed_types, 5 disease_types, 10 animals
- [x] Compile verified (0 errors)

## Success Criteria
- Seed produces 10 animals with valid QR uuids
- `GET /animals/by-qr/:uuid` returns animal + zone + pen + animal_type
- Filters compose: `?status=active&zoneId=X&batchId=Y`
- Cursor pagination returns `nextCursor` when >limit, null otherwise
- Tenant leak test: user in company A cannot read company B animals

## Risk Assessment
- **N+1 queries**: use Drizzle relational queries or explicit joins
- **Pen capacity overflow**: validate in create/transfer (reject if `current_count >= capacity`)
- **Status change race**: use transaction for status update + audit insert

## Security Considerations
- Validate role on every route; manager scoped to own farm (from `user_farm_roles`)
- QR uuid non-sequential (v4) prevents enumeration
- Reject mutation payloads with `company_id`/`farm_id` — derive from JWT only

## Next Steps
- Phase 04 consumes these APIs for web admin
- Phase 05 consumes `/animals/by-qr/:uuid` for mobile scanner
- Phase 06 extends status patch with full health_records integration
