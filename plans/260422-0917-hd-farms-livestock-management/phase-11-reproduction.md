# Phase 11 — Reproduction Events

## Context Links
- Brainstorm: `../reports/brainstorm-260421-1711-livestock-management-system.md`
- Schema: `packages/db/src/schema/ops.ts` (`reproduction_events`)

## Overview
- **Priority**: P2
- **Status**: Pending
- **Effort**: 7 days
- **Description**: Multi-species reproduction tracking via unified event table + JSONB metadata. Event types: mating, pregnant, birth, wean, egg_cycle. Web Sinh sản tab + timeline. Mobile quick forms.

## Key Insights
- One table, many species: `reproduction_events { animal_id, event_type, occurred_at, metadata JSONB }`
- Metadata shape varies by event_type + animal species — Yup schema discriminated union
- Events form timeline; derive state (pregnant, lactating) from latest events via SQL window functions
- Offspring linking: birth event metadata includes `offspring_animal_ids[]` (or auto-create placeholder animals)

## Requirements

### Functional
- **Reproduction CRUD**:
  - `POST /reproductions` — `{ animal_id, event_type, occurred_at, metadata }`
  - `GET /animals/:id/reproductions` — timeline
  - `PATCH /reproductions/:id`, `DELETE`
- **Event types + metadata schemas**:
  - `mating`: `{ partner_id?, method: 'natural'|'ai', ai_sire_code? }`
  - `pregnant`: `{ expected_birth_date, confirmed_by? }`
  - `birth`: `{ offspring_count, alive_count, dead_count, offspring_animal_ids?[], note? }`
  - `wean`: `{ weaned_count, wean_weight_avg_kg? }`
  - `egg_cycle`: `{ start_date, end_date?, eggs_collected, hatched_count? }` (for poultry)
- **Derived state**: `GET /animals/:id/reproduction-state` → `{ currently_pregnant, days_pregnant, last_birth_date, productivity_score? }`
- **Web**: Sinh sản tab with timeline UI + event-type-specific forms
- **Mobile**: quick form modal (event type chooser → form)

### Non-Functional
- JSONB indexed with GIN for metadata queries
- Events immutable after 24h (or via admin override) — audit integrity

## Architecture
```
apps/api/src/modules/reproductions/
├── reproductions.routes.ts
├── reproductions.service.ts
├── reproductions.metadata.ts        (per-event-type Yup schemas)
└── reproductions.derived.ts         (state compute)

packages/shared/src/
├── types/reproduction.ts            (event type union, metadata types)
└── validators/reproduction.ts       (discriminated union Yup)

apps/web/components/animals/
├── ReproductionTab.tsx
└── reproductions/
    ├── MatingDialog.tsx
    ├── PregnancyDialog.tsx
    ├── BirthDialog.tsx
    ├── WeanDialog.tsx
    └── EggCycleDialog.tsx

apps/mobile/components/quickForms/
└── ReproductionForm.tsx             (event type picker → dynamic fields)
```

## Related Code Files

### Create
- `apps/api/src/modules/reproductions/*`
- `apps/web/components/animals/ReproductionTab.tsx`
- `apps/web/components/animals/reproductions/*`
- `apps/mobile/components/quickForms/ReproductionForm.tsx`
- `packages/shared/src/{types,validators}/reproduction.ts`

### Modify
- `apps/web/app/(dashboard)/animals/[id]/page.tsx` — wire Sinh sản tab
- `packages/db/src/schema/ops.ts` — ensure GIN index on metadata

## Implementation Steps

1. **Type definitions** (shared):
   - Discriminated union by `event_type`
   - Per-species variants via animal_type constraints (e.g., egg_cycle only for poultry)
2. **Yup validators**: `yup.lazy` + `when('event_type', ...)` per-type schema
3. **Service `create`**:
   - Validate metadata against type schema
   - If birth: optionally create offspring animals with `parent_id` reference
   - Insert event
4. **Derived state**:
   - `currently_pregnant`: latest event is 'pregnant' with no subsequent 'birth'
   - `days_pregnant`: NOW - pregnant.occurred_at
   - `last_birth_date`: MAX(occurred_at) WHERE type='birth'
5. **Routes**: vet + manager write; worker read only (reproduction tracked by specialists)
6. **Web ReproductionTab**: vertical timeline, each event as card with type icon, date, metadata summary
7. **Per-event-type Dialog components** — each with its own form fields
8. **Timeline "Add Event" button → event type picker → route to corresponding dialog**
9. **Mobile ReproductionForm**: step 1 pick type (chip list), step 2 dynamic form based on type
10. **Mobile**: show in scan result sheet as quick action "Sinh sản"
11. **Auto-create offspring flow** (web birth dialog): checkbox "Create offspring animals" → N new animals with parent_id set
12. **Seed**: 1 mating + 1 pregnant + 1 birth chain for demo animal
13. **Compile + test each event type**

## Todo List
- [ ] Shared types + discriminated Yup validator
- [ ] Reproductions service + create validation
- [ ] Offspring auto-create logic
- [ ] Derived state endpoint
- [ ] Routes + role guards
- [ ] Web ReproductionTab timeline
- [ ] Web: 5 event-type dialogs
- [ ] Mobile ReproductionForm (two-step)
- [ ] Wire mobile scan quick action
- [ ] GIN index on metadata
- [ ] Seed reproduction chain
- [ ] Compile + test all 5 event types

## Success Criteria
- Creating birth with `offspring_count > 0` + auto-create flag creates N animals with parent_id
- Derived state: mating → pregnant → birth correctly shows `currently_pregnant = true` then false
- Metadata validation rejects invalid shape (e.g., `egg_cycle` for pig)
- Timeline renders chronologically with per-type icons

## Risk Assessment
- **Metadata schema drift**: version metadata shape field (`v: 1`) for future migrations
- **Multi-species complexity**: start with 2 species fully supported (heo, gà); others follow pattern
- **Offspring creation errors**: tx rollback if any animal create fails

## Security Considerations
- Event immutability after 24h: audit trail (override requires admin + note)
- Parent_id cannot be changed post-creation
- Validation: animal species must support event type

## Next Steps
- Phase 12 dashboard: reproduction KPI (pregnancy rate, farrowing rate)
- Future: breeding performance reports, genetics tracking
