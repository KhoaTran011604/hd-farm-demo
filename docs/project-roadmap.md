# HD-FARM: Project Roadmap & Phase Timeline

**Project Duration:** 45 calendar days  
**Target Completion:** Phase 2 (all 12 phases complete)  
**Start Date:** 2026-04-22  
**Estimated End Date:** 2026-06-06

---

## Executive Summary

HD-FARM is a comprehensive livestock management platform delivered in two phases:

- **Phase 1 (Weeks 1-3, ~20 days):** Core infrastructure, authentication, basic CRUD, mobile foundation
- **Phase 2 (Weeks 3-6, ~25 days):** Advanced features (health tracking, disease management, feeding analytics, breeding, reporting)

All 12 phases build sequentially, with Phase 1 completing the MVP and Phase 2 adding advanced capabilities for production readiness.

---

## Phase 1: Core Infrastructure & MVP (Days 1-20)

| #   | Phase                          | Duration | Status       | Priority     | Goal                                                   |
| --- | ------------------------------ | -------- | ------------ | ------------ | ------------------------------------------------------ |
| 01  | Monorepo Setup + Local Dev     | 3 days   | Complete     | P1 - Blocker | All 3 apps boot, Docker Compose running                |
| 02  | Auth System (JWT + RBAC)       | 3 days   | Complete     | P1 - Blocker | Login/logout, role enforcement, token generation       |
| 03  | Core APIs (Zone/Pen/Animal)    | 3 days   | Complete     | P1           | CRUD endpoints, tenant scoping, validation             |
| 04  | Web Admin - Auth + Animal CRUD | 3 days   | Complete     | P1           | Login screen, animal list/detail, create/edit/delete   |
| 05  | Mobile Foundation + QR Scanner | 4 days   | Pending      | P1           | Bottom tab bar, camera access, QR decode, deep linking |
| 06  | Health Status + Quick Actions  | 2 days   | Pending      | P2           | Status badge system, quick action buttons post-scan    |
| 07  | Vaccination System + Alerts    | 2 days   | Pending      | P2           | Vaccination records CRUD, overdue alerts, batch vacc   |

**Phase 1 Completion Criteria:**

- ✓ Monorepo fully functional on all platforms
- ✓ Auth system secure and enforced
- ✓ Core CRUD APIs tested (>70% coverage)
- ✓ Web admin operational for basic animal management
- ✓ Mobile QR scan → animal detail flow working
- ✓ Health status tracking live
- ✓ Vaccination system complete

---

## Phase 2: Advanced Features & Production (Days 20-45)

| #   | Phase                        | Duration | Status  | Priority | Goal                                                               |
| --- | ---------------------------- | -------- | ------- | -------- | ------------------------------------------------------------------ |
| 08  | Disease Records + Treatment  | 5 days   | Pending | P2       | Disease CRUD, treatment records, medical history                   |
| 09  | Batch (Lứa) Management       | 5 days   | Pending | P2       | Batch CRUD, animal-batch linkage, batch analytics                  |
| 10  | Feeding Records + FCR        | 6 days   | Pending | P2       | Feed type management, consumption tracking, FCR calculation        |
| 11  | Reproduction Events          | 7 days   | Pending | P3       | Mating, pregnancy, farrowing records, pedigree tracking            |
| 12  | Advanced Dashboard + Reports | 2 days   | Pending | P2       | KPI dashboard, charts, PDF exports (health, vaccines, feed, batch) |

**Phase 2 Completion Criteria:**

- ✓ Disease/treatment system production-ready
- ✓ Batch management fully operational
- ✓ Feeding analytics and FCR calculations accurate
- ✓ Reproduction event tracking complete
- ✓ Dashboard with 5+ charts and KPIs
- ✓ PDF report generation working
- ✓ E2E tests on web + mobile
- ✓ UX sign-off from stakeholders

---

## Dependency Graph & Critical Path

```
┌─────────────────────────────────────────────────────────┐
│ Phase 01: Monorepo Setup (3 days) — CRITICAL PATH     │
│ ├─ pnpm workspaces configured                          │
│ ├─ Turbo build pipeline                                │
│ ├─ Docker Compose (postgres + pgAdmin)                 │
│ └─ Local dev server (API, Web, Mobile)                 │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│ Phase 02: Auth System (3 days) — CRITICAL PATH         │
│ ├─ JWT plugin (sign, verify, 24h expiry)               │
│ ├─ User model + password hashing (argon2)              │
│ ├─ Role-based middleware (admin, manager, worker, vet) │
│ └─ Login/logout endpoints + tests                       │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────▼──────────┐    ┌────────▼──────────┐
│ Phase 03: Core    │    │ Phase 05: Mobile   │
│ APIs (3 days)     │    │ Foundation (4 days)│
│ ├─ Animals        │    │ ├─ Expo Router v3  │
│ ├─ Zones          │    │ ├─ Camera + QR     │
│ ├─ Pens           │    │ ├─ Deep linking    │
│ ├─ Tenant scoping │    │ └─ Bottom tab bar  │
│ └─ Validation     │    │                    │
└────────┬──────────┘    └────────┬───────────┘
         │                        │
         │     ┌──────────────────┘
         │     │
┌────────▼─────▼───────────────────────────┐
│ Phase 04: Web Admin (3 days)              │
│ ├─ Auth screens                           │
│ ├─ Animal list/detail/CRUD                │
│ ├─ Navigation sidebar                     │
│ └─ shadcn/ui + Tailwind integration      │
└────────┬──────────────────────────────────┘
         │
    ┌────┴────┐
    │          │
┌───▼────┐ ┌──▼────────────────────┐
│Phase 06 │ │ Phase 07: Vaccination │
│Health   │ │ (2 days)              │
│Status   │ └──┬───────────────────┘
│(2 days) │    │
└───┬────┘ ┌──▼──────────────────────┐
    │      │ Phase 08: Disease +      │
    │      │ Treatment (5 days)       │
    │      └──┬─────────────────────┘
    │         │
    └─────┬───┘
          │
    ┌─────▼──────────────────────┐
    │ Phase 09: Batch Management  │
    │ (5 days)                    │
    └─────┬──────────────────────┘
          │
    ┌─────▼──────────────────────┐
    │ Phase 10: Feeding + FCR     │
    │ (6 days)                    │
    └─────┬──────────────────────┘
          │
    ┌─────▼──────────────────────┐
    │ Phase 11: Reproduction      │
    │ Events (7 days)             │
    └─────┬──────────────────────┘
          │
    ┌─────▼──────────────────────┐
    │ Phase 12: Dashboard +       │
    │ Reports (2 days)            │
    └────────────────────────────┘
```

**Critical Path (Longest Sequence):** Phases 01 → 02 → 03 → 04 (+ 05 parallel) → 06 → 07 → 08 → 09 → 10 → 11 → 12 = **45 days**

---

## Milestones & Success Metrics

### Milestone 1: Infrastructure Ready

**End of Phase 02** (Day 6) — **COMPLETED 2026-04-22**

- **Deliverable:** Monorepo with auth system
- **Validation:**
  - All 3 apps run locally without errors ✓
  - Login endpoint verified (JWT generated) ✓
  - RBAC middleware enforced ✓
- **Success Metric:** Zero auth-related bugs in subsequent phases

### Milestone 1.5: Core APIs Ready

**End of Phase 03** (Day 9) — **COMPLETED 2026-04-22**

- **Deliverable:** Zone/Pen/Animal/Config CRUD APIs with tenant isolation
- **Validation:**
  - Farms/Zones/Pens CRUD endpoints functional ✓
  - Animals full CRUD (create, read, list, patch, delete, QR lookup) ✓
  - Config reference lookups (animal_types, vaccine_types, feed_types, disease_types) ✓
  - Cursor-based pagination with composite keyset (created_at, id) ✓
  - Soft delete guards: zones reject delete if pens exist, pens reject delete if animals exist ✓
  - QR code auto-generation and unique index ✓
  - Status patch with audit trail foundation ✓
  - ≥75% test coverage on all services ✓
- **Success Metric:** Web/mobile can build animal lists and detail pages on top of these APIs

### Milestone 2: Core CRUD Complete

**End of Phase 04-05** (Day 13) — **Phase 04 COMPLETED 2026-04-22**

- **Deliverable:** Animal management on web + mobile
- **Validation:**
  - Web admin: list, create, edit, delete animals ✓ (Phase 04 complete)
  - Mobile: QR scan → animal detail (Phase 05 pending)
  - API: all CRUD endpoints tested (≥70% coverage) ✓ (Phase 03)
- **Success Metric:** Stakeholder sign-off on basic UI/UX

### Milestone 3: Animal Health Tracking Live

**End of Phase 07** (Day 20)

- **Deliverable:** Health status + vaccination system
- **Validation:**
  - Status badges render correctly (7 statuses)
  - Health records persistent
  - Vaccination records linked to animals
  - Overdue alerts functional
- **Success Metric:** Farm manager can track health from day 1

### Milestone 4: Full Platform Ready

**End of Phase 12** (Day 45)

- **Deliverable:** All advanced features, dashboards, reports
- **Validation:**
  - Disease/treatment records complete ✓
  - Batch management operational ✓
  - FCR calculations accurate ✓
  - Dashboard KPIs displayed ✓
  - PDF reports generated ✓
  - E2E tests passing (both web + mobile) ✓
- **Success Metric:** Production readiness sign-off, load testing >100 concurrent users

---

## Phase Descriptions

### Phase 01: Monorepo Setup + Local Dev (3 days)

**Team:** 1 DevOps/Infra engineer  
**Key Deliverables:**

- pnpm workspaces configured
- Turbo build pipeline (`pnpm build`, `pnpm dev`, `pnpm test`)
- Docker Compose with PostgreSQL + pgAdmin
- All 3 apps boot without errors
- Git workflows (branching, CI/CD skeleton)

**Success Criteria:**

- `pnpm install` → zero errors
- `pnpm dev` → all 3 apps accessible (API :3001, Web :3000, Mobile :8081)
- `pnpm test` → all test suites run

### Phase 02: Auth System (JWT + RBAC) (3 days)

**Team:** 1 backend engineer  
**Key Deliverables:**

- JWT generation/verification (HS256, 24h expiry)
- User model + argon2 password hashing
- Role-based middleware (admin, manager, worker, vet)
- Login/logout endpoints
- Unit + integration tests (≥80% coverage)

**Success Criteria:**

- POST /api/v1/auth/login returns valid JWT
- GET protected endpoint without token → 401
- GET protected endpoint with invalid role → 403
- Token expires after 24 hours

### Phase 03: Core APIs (Zone/Pen/Animal) (3 days)

**Team:** 1 backend engineer  
**Key Deliverables:**

- Animals CRUD (create, read, update, delete, list)
- Zones CRUD
- Pens CRUD
- Tenant scoping on all queries (companyId + farmId)
- Yup validation schemas
- Drizzle schema + migrations
- Integration tests (real PostgreSQL)

**Success Criteria:**

- All endpoints return 200/201/204 with correct data
- Soft delete works (animals.deleted_at)
- Tenant isolation enforced (cross-tenant queries fail)
- Pagination with cursor working

### Phase 04: Web Admin - Auth + Animal CRUD (3 days)

**Team:** 1 frontend engineer  
**Key Deliverables:**

- Login/logout screens
- Animal list page (server-side data fetch)
- Animal detail page (view/edit)
- Create animal form
- Delete confirmation modal
- Sidebar navigation
- shadcn/ui components + Tailwind CSS
- Responsive design (mobile-first)

**Success Criteria:**

- User can log in and access dashboard
- Animal list loads within 2 seconds
- Create/edit/delete operations reflect immediately
- Mobile (44px touch targets) accessible

### Phase 05: Mobile Foundation + QR Scanner (4 days)

**Team:** 1 mobile engineer  
**Key Deliverables:**

- Expo Router v3 setup with bottom tab bar
- Camera integration (expo-camera)
- QR code scanning (decode UUID from QR)
- Deep linking (hdfarm://animal/{uuid})
- Animal detail screen
- Post-scan bottom sheet (quick actions placeholder)
- Permission handling (camera access request)

**Success Criteria:**

- App boots without errors
- Bottom tab bar navigates correctly
- QR scan returns UUID
- Deep link navigates to animal detail
- Camera permission request shows and is grantable

### Phase 06: Health Status + Quick Actions (2 days)

**Team:** 1 backend + 1 frontend (parallel)  
**Key Deliverables:**

- Health status enum (7 statuses: healthy, monitoring, sick, quarantine, recovered, dead, sold)
- Health status badge component (all 7 colors)
- Health records table + API
- Quick action buttons (Health Check, Vaccination, Feeding, Treatment, Weight)
- Mobile bottom sheet with quick actions
- Web admin: health records list + detail

**Success Criteria:**

- Health status badges render correctly
- Quick action buttons appear post-scan
- Health records persistent and queryable
- Mobile UX tested (44px touch targets)

### Phase 07: Vaccination System + Alerts (2 days)

**Team:** 1 backend + 1 frontend (parallel)  
**Key Deliverables:**

- Vaccine types catalog
- Vaccination records CRUD
- Vaccination schedule management
- Overdue alert calculation (next_due_date vs today)
- Batch vaccination (mark multiple animals at once)
- Vaccine history view (web + mobile)
- Alert badge on tab bar (count of overdue)

**Success Criteria:**

- Vaccination records linked to animals
- Overdue alerts calculated correctly
- Batch vaccination marks multiple animals
- Web dashboard shows vaccine status

### Phase 08: Disease Records + Treatment (5 days)

**Team:** 1 backend + 1 frontend (parallel)  
**Key Deliverables:**

- Disease types catalog (species-specific)
- Disease records (animal, onset_date, status, description)
- Treatment records (disease → treatments, outcomes, costs)
- Medical history timeline per animal
- Disease alerts (new disease detected)
- Web + mobile: disease record forms

**Success Criteria:**

- Disease records create/read/update
- Treatment outcomes tracked
- Medical history displays chronologically
- Disease severity influences health status

### Phase 09: Batch (Lứa) Management (5 days)

**Team:** 1 backend + 1 frontend (parallel)  
**Key Deliverables:**

- Batch model (logical grouping of animals)
- Batch CRUD + lifecycle (active → closed)
- Animal-batch relationships
- Batch-level analytics (avg weight, mortality %, FCR)
- Batch reports (animals in batch, health distribution)
- Web admin: batch list, detail, edit

**Success Criteria:**

- Batches create and animals can be assigned
- Batch analytics calculate correctly
- Batch reports exportable
- Batch closure prevents new assignments

### Phase 10: Feeding Records + FCR (6 days)

**Team:** 1 backend + 1 frontend (parallel)  
**Key Deliverables:**

- Feed types catalog (species-specific)
- Feeding records (pen, feed_type, quantity, cost, date)
- FCR calculation (total_feed / weight_gain per batch)
- Feed usage reports (by feed type, by date range)
- Feed cost analysis (cost per kg, total monthly cost)
- Web + mobile: feed record entry

**Success Criteria:**

- Feeding records create/read
- FCR calculated accurately
- Feed reports generated monthly
- Cost tracking accurate

### Phase 11: Reproduction Events (7 days)

**Team:** 1 backend + 1 frontend (parallel)  
**Key Deliverables:**

- Reproduction event types (mating, pregnancy, farrowing, weaning)
- Event records with pregnancy tracking
- Pedigree (sire + dam) per animal
- Expected due date calculation
- Farrowing records + offspring tracking
- Genetic lineage reports
- Web admin: reproduction timeline

**Success Criteria:**

- Events record with dates and details
- Pregnancy timeline displays correctly
- Farrowing linked to mother + litter
- Pedigree reports generated

### Phase 12: Advanced Dashboard + Reports (2 days)

**Team:** 1 frontend engineer  
**Key Deliverables:**

- KPI summary cards (total animals, health distribution, vaccine compliance, mortality)
- Charts (health status over time, FCR trends, disease frequency, reproduction timeline)
- Export functionality (PDF reports: health, vaccines, feed costs, batch)
- Advanced filters (date range, species, zone, status)
- Dashboard performance optimization

**Success Criteria:**

- KPI cards update in real-time
- Charts render within 1 second
- PDF exports contain all required data
- Dashboard accessible on mobile (responsive)

---

## Risk Assessment & Mitigations

### Risk 1: Tight Timeline (45 days)

**Impact:** High | **Probability:** Medium  
**Mitigation:**

- Parallel execution (Phase 05 while Phase 04 in progress)
- Pre-built components (shadcn/ui, Expo libraries)
- Clear phase acceptance criteria (no scope creep)
- Daily standup to catch blockers early

### Risk 2: Database Performance at Scale

**Impact:** High | **Probability:** Low  
**Mitigation:**

- Indexes on FK + filter columns from Phase 01
- Cursor-based pagination (no offset limit issues)
- Connection pooling (postgres.js)
- Load testing Phase 2 (100+ concurrent users)

### Risk 3: Multi-Tenancy Isolation Bug

**Impact:** Critical | **Probability:** Low  
**Mitigation:**

- Mandatory code review: check `companyId + farmId` scoping
- Integration tests verify tenant isolation
- Phase 2: PostgreSQL RLS policies as safety net

### Risk 4: Mobile Camera Permissions

**Impact:** Medium | **Probability:** Low  
**Mitigation:**

- Request permissions before camera access
- Graceful fallback if denied (manual UUID entry)
- Test on real iOS + Android devices Phase 05

### Risk 5: JWT Secret Management

**Impact:** High | **Probability:** Low  
**Mitigation:**

- Secret stored in environment only (never hardcode)
- Pre-commit hook prevents .env commits
- Phase 2: Implement secret rotation

---

## Out of Scope (MVP)

The following features are **NOT** included in this 45-day roadmap:

| Feature                  | Phase Proposed | Rationale                                             |
| ------------------------ | -------------- | ----------------------------------------------------- |
| Push Notifications       | Phase 3        | Requires FCM/APNs setup + backend workers             |
| Offline Mode (write)     | Phase 3        | Complex conflict resolution; read-only cache Phase 2+ |
| AI/ML Analytics          | Phase 4        | Predictive models require historical data             |
| Financial Module         | Phase 3        | Out of core livestock management scope                |
| Advanced RLS             | Phase 2        | PostgreSQL policies added post-MVP                    |
| Multi-language (i18n)    | Phase 3        | Vietnamese only for MVP                               |
| Biometric Auth           | Phase 2+       | iOS/Android app feature                               |
| Custom Report Builder    | Phase 3+       | Low priority vs. fixed exports                        |
| Third-party Integrations | Phase 4        | Weather API, genetic DBs, etc.                        |

---

## Success Definition

### For Phase 1 (MVP)

Farm manager can:

- ✓ Log in securely
- ✓ View all animals with status
- ✓ Create/edit/delete animals
- ✓ Track vaccination schedules
- ✓ Monitor health status
- ✓ Use mobile QR scan for quick actions

### For Phase 2 (Production)

Farm manager can additionally:

- ✓ Track disease outbreaks and treatments
- ✓ Manage animal batches and breeding
- ✓ Calculate feed costs and FCR
- ✓ Generate reports (health, vaccines, feed, breeding)
- ✓ Use advanced dashboard with KPI metrics
- ✓ Export data in multiple formats

---

## Communication & Stakeholder Updates

### Weekly Status Reports

- **Monday:** Phase completion % + blockers
- **Friday:** Next week plan + risks
- **Ad-hoc:** Critical issues (security, data loss)

### Phase Gate Reviews

Before moving to next phase, verify:

1. All acceptance criteria met
2. ≥70% test coverage
3. Zero critical security issues
4. Stakeholder sign-off on deliverables

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-22  
**Next Update:** After Phase 01 completion (Day 3)
