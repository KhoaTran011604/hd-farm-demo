# Phase 07 — Vaccination System + Alerts

## Context Links
- Mobile UX: `../reports/brainstorm-260421-1711-mobile-app-ui-ux-flow.md`
- Web UX: `../reports/brainstorm-260421-1711-web-admin-ui-ux-flow.md`
- Schema: `packages/db/src/schema/health.ts` (`vaccination_records`)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 2 days
- **Description**: Vaccination records CRUD + upcoming-vaccination alerts. Web: timeline tab + dashboard widget. Mobile: Alerts screen with pre-fill form.

## Key Insights
- `vaccine_types` has `recommended_interval_days` + `recommended_age_days` for auto-alert computation
- Alert = vaccination DUE within N days based on: (last vaccination + interval) OR (animal DOB + recommended_age_days)
- Alerts are COMPUTED at query time (no alerts table) — simpler, fewer moving parts
- Mobile pre-fill: alert → tap → form opens with animal + vaccine type pre-selected

## Requirements

### Functional
- **Vaccination CRUD**:
  - `POST /vaccinations` — `{ animal_id, vaccine_type_id, dose_ml?, given_at, next_due_at?, note? }`
  - `GET /animals/:id/vaccinations` — paginated
  - `PATCH /vaccinations/:id`, `DELETE /vaccinations/:id`
- **Alerts**:
  - `GET /alerts/upcoming-vaccinations?days=7&farmId=` — returns `[{ animal, vaccine_type, due_date, reason }]`
- **Web**:
  - Vaccination tab on animal detail — timeline of records
  - Dashboard widget: "Upcoming Vaccinations (7 days)" list
  - `POST /vaccinations` form dialog
- **Mobile**:
  - Alerts screen — list of upcoming vaccinations, tap → pre-fill form
  - Vaccination quick form

### Non-Functional
- Alerts query must use indexes — `vaccination_records(animal_id, vaccine_type_id, given_at DESC)`
- Response time <300ms for 5000 animals

## Architecture
```
apps/api/src/modules/
├── vaccinations/
│   ├── vaccinations.routes.ts
│   ├── vaccinations.service.ts
│   └── vaccinations.schema.ts
└── alerts/
    ├── alerts.routes.ts
    └── alerts.service.ts            (upcoming-vaccinations compute)

apps/web/components/
├── animals/VaccinationTab.tsx
├── vaccinations/VaccinationDialog.tsx
└── dashboard/UpcomingVaccinationsWidget.tsx

apps/mobile/app/(tabs)/alerts.tsx
apps/mobile/components/quickForms/VaccinationForm.tsx
```

## Related Code Files

### Create
- `apps/api/src/modules/vaccinations/*`
- `apps/api/src/modules/alerts/*`
- `apps/web/components/animals/VaccinationTab.tsx`
- `apps/web/components/vaccinations/VaccinationDialog.tsx`
- `apps/web/components/dashboard/UpcomingVaccinationsWidget.tsx`
- `apps/mobile/components/quickForms/VaccinationForm.tsx`
- `packages/shared/src/validators/vaccination.ts`

### Modify
- `apps/web/app/(dashboard)/animals/[id]/page.tsx` — wire Vaccination tab
- `apps/web/app/(dashboard)/page.tsx` — add widget
- `apps/mobile/app/(tabs)/alerts.tsx` — implement

## Implementation Steps

1. **Vaccinations service**:
   - `create`: insert record; if `next_due_at` not provided but vaccine_type has `recommended_interval_days`, compute `given_at + interval`
   - `listByAnimal(id, cursor)`: with join to vaccine_types for name
   - `update`, `remove`
2. **Alerts service — upcoming-vaccinations**:
   ```
   SQL pattern (Drizzle):
   SELECT a.id, a.tag, vt.id as vaccine_id, vt.name,
          COALESCE(MAX(vr.next_due_at),
                   a.dob + vt.recommended_age_days * INTERVAL '1 day') as due_date
   FROM animals a
   JOIN animal_types at ON at.id = a.animal_type_id
   JOIN vaccine_types vt ON vt.animal_type_id = at.id
   LEFT JOIN vaccination_records vr ON vr.animal_id = a.id AND vr.vaccine_type_id = vt.id
   WHERE a.farm_id = ? AND a.status IN ('active','sick','treating')
   GROUP BY a.id, vt.id
   HAVING due_date BETWEEN now() AND now() + ? * INTERVAL '1 day'
   ORDER BY due_date ASC
   ```
3. **Vaccination routes**: vet + manager write; all roles read
4. **Alerts route**: authed, scoped to accessible farms
5. **Web VaccinationTab**: timeline with vaccine name, date, next_due_at, by-user; "Record Vaccination" button
6. **Web VaccinationDialog**: vaccine_type select → auto-fill next_due_at based on interval
7. **Web Dashboard widget**: top 5 upcoming, link to full list
8. **Mobile Alerts screen**: FlatList of alerts, group by due date (Today, Tomorrow, This Week); tap → VaccinationForm pre-filled
9. **Mobile VaccinationForm**: animal read-only (if pre-filled), vaccine_type select, date (default today), note
10. **Compile + test with seed data**

## Todo List
- [ ] Vaccinations CRUD (API)
- [ ] Alerts query + route
- [ ] Shared Yup validator
- [ ] Web VaccinationTab (timeline)
- [ ] Web VaccinationDialog with auto next_due
- [ ] Web Dashboard alert widget
- [ ] Mobile Alerts screen
- [ ] Mobile VaccinationForm with pre-fill
- [ ] Seed: add 3 vaccinations + 2 overdue to test alerts
- [ ] Compile + test

## Success Criteria
- Creating vaccination auto-sets next_due_at when interval defined
- Alert query returns animals without history (based on dob + age) AND animals with expired next_due_at
- Mobile alert tap → form opens with animal + vaccine preselected
- Dashboard widget refreshes on new vaccination

## Risk Assessment
- **Alert query perf**: ensure composite indexes; add EXPLAIN ANALYZE step
- **Timezone bugs**: use UTC in DB, convert at UI layer with user's tz
- **Missed animals**: animals without matching vaccine_type (different species) — filter by `animal_type_id` correctly

## Security Considerations
- Only vet + manager can create/edit/delete vaccinations
- Worker can view only
- Alert scope respects farm access

## Next Steps
- Phase 08 adds Disease + Treatment (similar pattern)
- Phase 12 dashboard reuses alert widget pattern
