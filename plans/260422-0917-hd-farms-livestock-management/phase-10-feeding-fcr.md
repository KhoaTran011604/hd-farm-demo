# Phase 10 — Feeding Records + FCR

## Context Links
- Brainstorm: `../reports/brainstorm-260421-1711-livestock-management-system.md`
- Schema: `packages/db/src/schema/ops.ts` (`feeding_records`)

## Overview
- **Priority**: P2
- **Status**: Pending
- **Effort**: 6 days
- **Description**: Pen-level feeding records + FCR computation + weekly chart. Mobile quick feed form. Batch FCR wired from Phase 09 stub.

## Key Insights
- Feeding is PEN-LEVEL (not per animal) — realistic farm workflow
- `animal_count_snapshot` captured at feed time (pen count may change daily)
- FCR = total_feed_kg / total_weight_gain_kg over a period
- Weight gain = SUM of positive deltas in health_records per animal
- Feeding attribution to batch: via pen → animals.batch_id (may be multi-batch per pen — prorate)

## Requirements

### Functional
- **Feeding CRUD**:
  - `POST /feedings` — `{ pen_id, feed_type_id, quantity_kg, fed_at, animal_count_snapshot?, note? }`
  - `GET /pens/:id/feedings` — paginated
  - `GET /feedings/:id`, `PATCH`, `DELETE`
- **FCR calc**:
  - `GET /batches/:id/fcr?from=&to=` → `{ total_feed_kg, total_weight_gain_kg, fcr, data_points[] }`
  - `GET /pens/:id/fcr?from=&to=`
- **Weekly chart data**: `GET /batches/:id/feeding-weekly` → week buckets
- **Mobile**: Quick feed form (pen select → feed type → kg → submit)
- **Web**: Feeding tab on animal detail (read-only, derived from pen); Feeding section on batch detail; FCR chart

### Non-Functional
- FCR queries aggregated at DB level (no JS loops)
- Mobile form completes in <10 seconds including submit

## Architecture
```
apps/api/src/modules/
├── feedings/
│   ├── feedings.routes.ts
│   ├── feedings.service.ts
│   └── feedings.schema.ts
└── analytics/
    └── fcr.service.ts                (batch + pen FCR compute)

apps/web/components/
├── animals/FeedingTab.tsx            (pen-derived list)
├── batches/BatchFcrChart.tsx
└── pens/PenFeedingHistory.tsx

apps/mobile/components/quickForms/
└── FeedingForm.tsx
```

## Related Code Files

### Create
- `apps/api/src/modules/feedings/*`
- `apps/api/src/modules/analytics/fcr.service.ts`
- `apps/web/components/{animals/FeedingTab,batches/BatchFcrChart,pens/PenFeedingHistory}.tsx`
- `apps/mobile/components/quickForms/FeedingForm.tsx`
- `packages/shared/src/validators/feeding.ts`

### Modify
- `apps/api/src/modules/batches/batches.stats.ts` — wire FCR
- `apps/web/app/(dashboard)/animals/[id]/page.tsx` — Feeding tab
- `apps/web/app/(dashboard)/batches/[id]/page.tsx` — FCR chart

## Implementation Steps

1. **Feedings service CRUD**: tenant scope via pen → zone → farm
2. **`animal_count_snapshot`**: default = count animals in pen at `fed_at` time
3. **FCR service**:
   - `computeBatchFcr(batchId, from, to)`:
     - feed_kg = SUM(feedings.quantity_kg) WHERE pen_id IN (pens of animals in batch) × (batch_animals / pen_animals_snapshot)  ← prorate
     - weight_gain_kg = SUM per animal of (max_weight - min_weight) in date range
     - fcr = feed_kg / weight_gain_kg
   - Return data_points grouped by week
4. **FCR routes**: authed, role = manager+/vet/admin
5. **Update batches stats**: call FCR service when `?includeFcr=true`
6. **Mobile FeedingForm**:
   - Pen select (recent pens prioritized)
   - Feed type select (recent types prioritized)
   - Quantity numeric
   - `fed_at` defaults to NOW
   - Submit → invalidate pen query
7. **Web Feeding tab (animal)**: read-only list derived from pen feedings, show per-animal share
8. **Web Batch FCR chart**: Recharts dual-axis LineChart (feed_kg + weight_gain overlay)
9. **Pen feeding history page**: list with filters
10. **Seed**: 30 days of feeding data across 2 batches for demo
11. **Compile + test FCR math with known inputs**

## Todo List
- [ ] Feedings CRUD with tenant scope
- [ ] Snapshot default compute
- [ ] FCR service (batch + pen)
- [ ] Weekly buckets query
- [ ] Wire batch stats FCR
- [ ] Shared validator
- [ ] Web FeedingTab (animal read-only)
- [ ] Web BatchFcrChart (Recharts)
- [ ] Web PenFeedingHistory
- [ ] Mobile FeedingForm
- [ ] Seed 30 days data
- [ ] Unit test FCR calc with known values
- [ ] Compile

## Success Criteria
- FCR for test batch matches manual calculation within 0.01
- Feeding form submits in <10s on mobile
- Chart shows 12 weeks of feed vs gain
- Animal Feeding tab shows prorated share

## Risk Assessment
- **FCR prorate complexity**: document formula; add unit tests with edge cases (pen with multi-batch)
- **Weight gain negative**: clamp to 0 OR flag data quality issue
- **Missing weight data**: skip animals without ≥2 health_records in range

## Security Considerations
- Worker: create feeding allowed (daily task)
- Delete feeding: manager+ only (data integrity)
- Rate-limit feeding POST to prevent accidental duplicates

## Next Steps
- Phase 11 (reproduction) is orthogonal; can run in parallel
- Phase 12 dashboard shows FCR trend KPI
