# Phase 08 — Disease Records + Treatment

## Context Links
- Mobile UX: `../reports/brainstorm-260421-1711-mobile-app-ui-ux-flow.md`
- Schema: `packages/db/src/schema/health.ts` (`disease_records`, `treatment_records`)

## Overview
- **Priority**: P2
- **Status**: Complete
- **Effort**: 5 days
- **Description**: Disease records + linked treatment records CRUD. Auto status change to `sick`/`treating` on disease recording. Mobile quick disease form. Web Bệnh án tab with treatment timeline.

## Key Insights
- `disease_records` and `treatment_records` are 1:N (one disease can have multiple treatments over time)
- Recording disease with `severity >= moderate` auto-triggers animal status → `sick`
- Starting treatment → status `treating`; resolving → status `active`
- Treatment records include drug name, dose, withdrawal_period_days (meat safety)

## Requirements

### Functional
- **Disease CRUD**:
  - `POST /diseases` — `{ animal_id, disease_type_id, severity, diagnosed_at, symptoms?, note? }`
  - `GET /animals/:id/diseases` — list
  - `PATCH /diseases/:id` — update including `resolved_at`
- **Treatment CRUD**:
  - `POST /treatments` — `{ disease_record_id, drug, dose, started_at, ended_at?, withdrawal_days?, note? }`
  - `GET /diseases/:diseaseId/treatments`
  - `PATCH /treatments/:id`
- **Auto status**:
  - On disease create with severity >= moderate → animal.status = 'sick'
  - On treatment create → 'treating'
  - On disease update with resolved_at set + no active treatments → 'active'
- **Mobile**: Quick Ghi bệnh form (disease type + severity + symptoms; triggers status change)
- **Web**: Disease tab with treatment timeline; add/edit dialogs

### Non-Functional
- Status auto-change wrapped in transaction with disease insert
- Withdrawal calculator: treatment.withdrawal_days → earliest safe slaughter date shown in UI

## Architecture
```
apps/api/src/modules/
├── diseases/
│   ├── diseases.routes.ts
│   ├── diseases.service.ts
│   └── diseases.schema.ts
└── treatments/
    ├── treatments.routes.ts
    ├── treatments.service.ts
    └── treatments.schema.ts

apps/web/components/animals/
└── DiseaseTab.tsx                    (list + dialogs)

apps/mobile/components/quickForms/
└── DiseaseReportForm.tsx
```

## Related Code Files

### Create
- `apps/api/src/modules/diseases/*`
- `apps/api/src/modules/treatments/*`
- `apps/web/components/animals/DiseaseTab.tsx`
- `apps/web/components/diseases/{DiseaseDialog,TreatmentDialog}.tsx`
- `apps/mobile/components/quickForms/DiseaseReportForm.tsx`
- `packages/shared/src/validators/{disease,treatment}.ts`

### Modify
- `apps/web/app/(dashboard)/animals/[id]/page.tsx` — wire Disease tab

## Implementation Steps

1. **Severity enum** (shared): `mild | moderate | severe | critical`
2. **Diseases service**:
   - `create`: tx — insert disease + (if severity>=moderate) update animal status to 'sick' + insert health_record
   - `resolve(id, resolvedAt)`: tx — update disease + check active treatments + update animal status
3. **Treatments service**:
   - `create`: tx — insert treatment + update animal status to 'treating' if currently 'sick'
   - `list`, `update`, `remove`
   - Helper: `withdrawalEndDate(treatment)` = ended_at + withdrawal_days
4. **Routes**: vet + manager write; worker can REPORT disease (create only, no treatments)
5. **Web DiseaseTab**: timeline — grouped cards, each disease with treatment sub-list + resolve CTA
6. **Web DiseaseDialog**: disease_type select, severity radio, symptoms textarea
7. **Web TreatmentDialog**: drug, dose, withdrawal_days, dates
8. **Mobile DiseaseReportForm**: disease_type + severity + quick symptom chips + photo (optional, stretch)
9. **Add to ScanResultSheet + Animal detail quick action "Ghi bệnh"**
10. **Withdrawal warning**: if animal has active withdrawal, show banner on animal detail + block slaughter status
11. **Compile + test all transition paths**

## Todo List
- [x] Severity enum + shared types
- [x] Diseases service + auto status tx
- [x] Treatments service + withdrawal helper
- [x] Routes with role guards
- [x] Shared validators
- [x] Web DiseaseTab + dialogs
- [x] Web withdrawal banner on detail
- [x] Mobile DiseaseReportForm
- [x] Wire mobile quick action
- [x] Compile + test status transitions end-to-end

## Deviations from Plan (YAGNI)
- **Severity enum**: Plan had `critical` — DB schema only supports `mild|moderate|severe`. Kept existing enum; `severe` covers critical.
- **Status transitions**: DB enum lacks `treating`/`active`. Implemented: disease severity≥moderate → `sick`; resolve + no active diseases → `recovered`. Skipped intermediate `treating` state.
- **Vet role**: Not defined in `UserRole` type. Medical writes locked to `admin|manager`. Workers can REPORT disease (create only), cannot manage treatments.
- **Schema additions** (`packages/db/src/schema/health.ts`):
  - `disease_records`: added `notes`, `recordedById`
  - `treatment_records`: added `withdrawalDays`, `endedAt`
  - Requires `drizzle-kit generate && migrate` to sync DB.

## Success Criteria
- Creating severe disease sets animal.status = 'sick' atomically
- Adding treatment sets status = 'treating'
- Resolving disease (no active treatments) sets status = 'active'
- Withdrawal banner shows on animal with active drug withdrawal period
- Worker can report disease but cannot add/edit treatments

## Risk Assessment
- **Status flap**: multiple overlapping diseases — keep 'sick'/'treating' until ALL resolved
- **Withdrawal miss**: critical food safety — unit tests required for date calc
- **Treatment history gaps**: prevent delete if resolved disease; use soft delete

## Security Considerations
- Worker: create disease only, read diseases + treatments
- Vet/Manager: full CRUD
- Audit: recorded_by on every record
- Withdrawal enforcement: hard block on status → 'sold' during withdrawal window

## Next Steps
- Phase 09 (batch) aggregates disease/mortality stats per batch
- Later reports: top diseases by frequency, treatment cost analytics
