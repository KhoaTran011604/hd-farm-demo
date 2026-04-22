# Phase 06 — Health Status + Quick Actions

## Context Links
- Mobile UX: `../reports/brainstorm-260421-1711-mobile-app-ui-ux-flow.md`
- Schema: `packages/db/src/schema/health.ts` (`health_records`)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 2 days
- **Description**: Full status change flow with validation + `health_records` audit log. Quick weight + status forms on mobile. Web optimistic status modal.

## Key Insights
- Status transitions have RULES (e.g., `sold` is terminal; cannot go `sold → active`) — enforce in service layer
- Every status change writes a `health_records` row: `{ animal_id, recorded_at, status, weight_kg, note, recorded_by }`
- Weight is optional on status change but strongly suggested in worker UX
- Use DB transaction: update animals + insert health_records atomically

## Requirements

### Functional
- `PATCH /animals/:id/status` — body `{ status, weight_kg?, note? }` → updates animal + inserts health_records
- `POST /animals/:id/weight` — body `{ weight_kg, note? }` → insert health_records only
- `GET /animals/:id/health` — list health_records cursor-paginated
- Mobile: Quick Weigh form (weight + optional note)
- Mobile: Status Change form (select status + weight + note)
- Web: Status modal on animal detail + animal list row action

### Non-Functional
- Transition validator shared between web + mobile (in packages/shared)
- Optimistic UI on web with rollback on error

## Architecture
```
packages/shared/src/
└── validators/animalStatus.ts       (transitions map + validate fn)

apps/api/src/modules/animals/
├── animals.service.ts               (extend: updateStatus, recordWeight)
└── animals.routes.ts                (PATCH status, POST weight, GET health)

apps/web/components/animals/
├── StatusChangeDialog.tsx
└── HealthTab.tsx                    (wire up to GET /animals/:id/health)

apps/mobile/components/quickForms/
├── WeighForm.tsx
└── StatusChangeForm.tsx
```

## Related Code Files

### Create
- `packages/shared/src/validators/animalStatus.ts`
- `apps/web/components/animals/StatusChangeDialog.tsx`
- `apps/web/components/animals/HealthTab.tsx`
- `apps/mobile/components/quickForms/{WeighForm,StatusChangeForm}.tsx`

### Modify
- `apps/api/src/modules/animals/animals.service.ts` — add `updateStatus`, `recordWeight` with transactions
- `apps/api/src/modules/animals/animals.routes.ts` — add routes
- `apps/web/app/(dashboard)/animals/[id]/page.tsx` — wire Health tab + status button

## Implementation Steps

1. **Status transition map** (shared): 
   ```ts
   const transitions = {
     active: ['sick', 'treating', 'sold', 'dead'],
     sick: ['treating', 'active', 'dead', 'sold'],
     treating: ['active', 'sick', 'dead', 'sold'],
     sold: [], dead: []
   }
   ```
   + `canTransition(from, to): boolean`
2. **Service `updateStatus(id, payload, userId)`**:
   - SELECT current animal (lock with `FOR UPDATE`)
   - Validate transition
   - Transaction: UPDATE animals SET status=? + INSERT health_records
   - Return updated animal + new record
3. **Service `recordWeight(id, payload, userId)`**: INSERT health_records only; do NOT mutate animal.weight_kg (use latest record as source of truth)
4. **Routes**: register + role guards (worker allowed for weight; manager+ for status)
5. **Web StatusChangeDialog**: shadcn Dialog with Select + optional weight + textarea; react-query mutation with optimistic update
6. **Web HealthTab**: infinite list of health records with timeline UI (date, status badge, weight, note, by-user)
7. **Mobile WeighForm**: single numeric input + note; submit → invalidate animal query
8. **Mobile StatusChangeForm**: status chips + weight + note
9. **Wire both forms into ScanResultSheet + Animal detail**
10. **Compile + manual test**

## Todo List
- [ ] Status transition validator (shared)
- [ ] animals.service.updateStatus with tx
- [ ] animals.service.recordWeight
- [ ] Routes + role guards
- [ ] Web StatusChangeDialog
- [ ] Web HealthTab with timeline
- [ ] Mobile WeighForm + StatusChangeForm
- [ ] Wire forms into scan sheet + detail
- [ ] Compile + test invalid transitions (should 400)

## Success Criteria
- Attempting `sold → active` returns 400 with clear error
- Valid status change creates health_records row + updates animal atomically
- Web optimistic update rolls back cleanly on server error
- Mobile quick forms complete in <5 taps including submit

## Risk Assessment
- **Concurrent status updates**: `FOR UPDATE` lock prevents lost writes
- **Weight unit confusion**: store kg always; display conversion at UI layer if needed
- **Accidental status change**: add confirm step for terminal statuses (sold/dead)

## Security Considerations
- Role-check: worker can't mark sold/dead (manager+/vet only for death)
- Audit trail: `recorded_by = userId` from JWT always
- Input validation: weight_kg > 0 and < 2000 (sanity bound)

## Next Steps
- Phase 07 adds vaccination records + alerts (extends health domain)
- Later reports use health_records for weight trend charts
