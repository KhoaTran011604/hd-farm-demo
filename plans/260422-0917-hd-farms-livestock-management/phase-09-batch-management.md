# Phase 09 — Batch (Lứa) Management

## Context Links
- Brainstorm: `../reports/brainstorm-260421-1711-livestock-management-system.md`
- Schema: `packages/db/src/schema/animals.ts` (`batches`)

## Overview
- **Priority**: P2
- **Status**: Pending
- **Effort**: 5 days
- **Description**: Batch (lứa) lifecycle CRUD + batch statistics (avg weight, mortality %, FCR stub until Phase 10). Web: /batches list + detail page with charts.

## Key Insights
- A batch groups animals by shared lifecycle event (same intake date, same species, same farm)
- Batch stats are COMPUTED from animals + health_records — no denormalized columns
- Status lifecycle: `planning → active → closed` (closed when all animals sold/dead)
- FCR (Feed Conversion Ratio) = SUM(feed_kg) / SUM(weight_gain_kg) — depends on Phase 10 data

## Requirements

### Functional
- **Batch CRUD**:
  - `POST /batches` — `{ name, farm_id, animal_type_id, intake_date, planned_count?, note? }`
  - `GET /batches?farmId=&status=` — list
  - `GET /batches/:id` — detail + stats
  - `PATCH /batches/:id`, `POST /batches/:id/close`
- **Batch stats**: `GET /batches/:id/stats` — `{ animal_count, active_count, dead_count, sold_count, avg_weight_kg, mortality_pct, fcr?, days_active }`
- **Assignment**: animals.batch_id on create OR bulk-assign existing animals
- **Web**:
  - `/batches` list with status badge, progress (days/90)
  - `/batches/[id]` detail: stats cards, animals table, weight-over-time chart (Recharts)
- **Mobile**: show batch info on animal detail

### Non-Functional
- Stats response cached 60s per batch
- Charts render < 500ms for 100 data points

## Architecture
```
apps/api/src/modules/batches/
├── batches.routes.ts
├── batches.service.ts
├── batches.stats.ts                 (compute helpers)
└── batches.schema.ts

apps/web/app/(dashboard)/batches/
├── page.tsx                         (list)
└── [id]/page.tsx                    (detail)

apps/web/components/batches/
├── BatchStatsCards.tsx
├── BatchAnimalsTable.tsx
└── BatchWeightChart.tsx             (Recharts LineChart)
```

## Related Code Files

### Create
- `apps/api/src/modules/batches/*`
- `apps/web/app/(dashboard)/batches/{page.tsx,[id]/page.tsx,new/page.tsx}`
- `apps/web/components/batches/*`
- `packages/shared/src/validators/batch.ts`

### Modify
- `apps/api/src/modules/animals/animals.service.ts` — allow `batch_id` in create/update
- `apps/web/components/animals/AnimalTabs.tsx` — show batch link in Overview
- `apps/mobile/app/animals/[id].tsx` — show batch chip

## Implementation Steps

1. **Batches service CRUD**: scoped by farm
2. **Stats computation** (`batches.stats.ts`):
   - `animal_count` = COUNT(*) FROM animals WHERE batch_id = ?
   - `active_count` / `dead_count` / `sold_count` grouped by status
   - `avg_weight_kg` = AVG of latest health_record.weight_kg per animal
   - `mortality_pct` = dead_count / animal_count * 100
   - `days_active` = NOW - intake_date
   - `fcr` = NULL in Phase 09 (wired in Phase 10)
3. **Weight-over-time**: GROUP BY week(health_records.recorded_at) → AVG(weight_kg), last 12 weeks
4. **Close batch**: set `closed_at`; validate all animals in sold/dead status
5. **Bulk assign**: `POST /batches/:id/animals` with `{ animalIds: [] }` → UPDATE animals SET batch_id
6. **Web list**: cards with name, days_active progress bar, animal_count, mortality %
7. **Web detail**: tabs (Overview stats, Animals, Chart)
8. **Recharts LineChart** for weight trend
9. **Mobile**: extend animal detail to show `batch.name + batch.id link` (no batch screen in mobile MVP)
10. **Compile + seed 2 batches with 5 animals each**

## Todo List
- [ ] Batches service CRUD + close
- [ ] Stats service (SQL aggregates)
- [ ] Weight timeline query
- [ ] Bulk assign endpoint
- [ ] Shared validators
- [ ] Web /batches list
- [ ] Web /batches/[id] detail + stats cards
- [ ] Web weight chart (Recharts)
- [ ] Mobile animal detail batch chip
- [ ] Seed batches
- [ ] Compile + test stats accuracy

## Success Criteria
- Creating batch + assigning 5 animals returns correct animal_count
- Killing 1 animal → mortality_pct = 20%
- Weight chart renders smoothly with 12 weeks of data
- Close batch blocks if any animal still active

## Risk Assessment
- **Expensive stats query**: add indexes on `animals(batch_id)`, `health_records(animal_id, recorded_at)`
- **Bulk assign race**: wrap in tx with row locks if contention observed
- **FCR null in Phase 09**: web UI shows "N/A - feeding data pending"

## Security Considerations
- Manager scoped to own farm's batches
- Worker: read only
- Cannot re-open closed batch (audit integrity)

## Next Steps
- Phase 10 populates FCR by adding feeding_records
- Phase 12 dashboard uses batch stats for KPI cards
