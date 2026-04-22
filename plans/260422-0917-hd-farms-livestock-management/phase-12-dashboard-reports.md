# Phase 12 — Advanced Dashboard + Reports

## Context Links
- Web UX: `../reports/brainstorm-260421-1711-web-admin-ui-ux-flow.md`
- Mobile UX: `../reports/brainstorm-260421-1711-mobile-app-ui-ux-flow.md`

## Overview
- **Priority**: P2
- **Status**: Pending
- **Effort**: 2 days
- **Description**: Web dashboard with 4 KPI cards + alert list + zone capacity grid + weight trend chart. Reports pages: FCR, weight trend, batch performance. Mobile manager home overview.

## Key Insights
- Dashboard consumes existing aggregation endpoints — no new DB columns
- KPI cards: Total animals / Active batches / Alerts count / Mortality % (7d)
- Zone capacity grid: color-coded cards (green <70%, yellow 70-90%, red >90%)
- All report queries must be farm-scoped (not global) for perf

## Requirements

### Functional
- **Web dashboard** (`/`):
  - 4 KPI cards
  - Upcoming alerts widget (re-use Phase 07 widget)
  - Zone capacity grid
  - Weight trend chart (last 30d)
- **Reports pages**:
  - `/reports/fcr` — table + chart across batches
  - `/reports/weight-trend` — animal/batch filter + chart
  - `/reports/batch-performance` — all batches comparison table
- **Mobile**: Manager home shows farm overview (KPIs + alerts)
- **Exports**: optional CSV export per report (stretch)

### Non-Functional
- Dashboard loads in <1s with cached data
- Charts responsive; empty states handled

## Architecture
```
apps/api/src/modules/
├── dashboard/
│   ├── dashboard.routes.ts
│   └── dashboard.service.ts          (aggregate KPIs)
└── reports/
    ├── reports.routes.ts
    └── reports.service.ts            (FCR + weight + batch perf)

apps/web/app/(dashboard)/
├── page.tsx                          (dashboard — real impl)
└── reports/
    ├── fcr/page.tsx
    ├── weight-trend/page.tsx
    └── batch-performance/page.tsx

apps/web/components/dashboard/
├── KpiCards.tsx
├── ZoneCapacityGrid.tsx
└── WeightTrendChart.tsx

apps/web/components/reports/
├── FcrReport.tsx
├── WeightTrendReport.tsx
└── BatchPerformanceTable.tsx

apps/mobile/app/(tabs)/index.tsx      (manager home overview)
```

## Related Code Files

### Create
- `apps/api/src/modules/dashboard/*`
- `apps/api/src/modules/reports/*`
- `apps/web/app/(dashboard)/page.tsx` (replace Phase 04 placeholder)
- `apps/web/app/(dashboard)/reports/*`
- `apps/web/components/{dashboard,reports}/*`

### Modify
- `apps/mobile/app/(tabs)/index.tsx` — manager overview

## Implementation Steps

1. **Dashboard service**:
   - `getOverview(farmId)`: KPIs in parallel via `Promise.all`
   - `getZoneCapacity(farmId)`: list zones with pens aggregated `current_count / capacity`
   - `getWeightTrend(farmId, days=30)`: avg weight grouped by day across all active animals
2. **Dashboard routes**: role = manager+/admin
3. **Reports service**:
   - `fcrReport(farmId, from, to)`: reuse Phase 10 FCR service per batch
   - `weightTrendReport(filters)`: flexible filters (batch/animal/date)
   - `batchPerformanceReport(farmId)`: list of batches with stats per
4. **Web KpiCards**: 4 cards with icon + value + trend arrow (7d change)
5. **Web ZoneCapacityGrid**: responsive grid, color per zone based on utilization
6. **Web WeightTrendChart**: Recharts AreaChart, 30 days
7. **Web FCR report**: table (batch name | FCR | feed kg | gain kg) + aggregate chart
8. **Web WeightTrendReport**: filter bar + chart + export CSV button
9. **Web BatchPerformanceTable**: sortable columns (days_active, mortality, FCR, avg_weight)
10. **Mobile manager overview**: 4 KPI cards stacked + top 5 alerts
11. **CSV export** (stretch): `papaparse` → blob download
12. **Compile + review empty states (new farm with no data)**

## Todo List
- [ ] Dashboard service with parallel KPI queries
- [ ] Dashboard routes
- [ ] Reports service (FCR, weight, batch perf)
- [ ] Reports routes
- [ ] Web KpiCards
- [ ] Web ZoneCapacityGrid
- [ ] Web WeightTrendChart
- [ ] Web FcrReport page
- [ ] Web WeightTrendReport page
- [ ] Web BatchPerformanceTable page
- [ ] Mobile manager home overview
- [ ] Empty state handling
- [ ] CSV export (stretch)
- [ ] Compile + test with seed data

## Success Criteria
- Dashboard loads <1s with 500 animals
- All 3 report pages render charts + tables correctly
- Mobile manager sees identical KPIs to web dashboard
- Empty state shows friendly "No data yet" — not errors

## Risk Assessment
- **Slow aggregates**: pre-build indexes verified in EXPLAIN ANALYZE
- **Time zone in trend charts**: use UTC buckets at DB, convert at UI
- **Worker sees manager dashboard**: strict role gate (worker home is task list from Phase 05)

## Security Considerations
- Reports scoped to user's farms
- CSV export respects RBAC
- No admin-only data in manager reports (e.g., no user PII beyond own farm)

## Next Steps
- Post-MVP: scheduled email reports (weekly FCR digest)
- Post-MVP: custom report builder
- Production deploy planning (separate phase outside MVP scope)
