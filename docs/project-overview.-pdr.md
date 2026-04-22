# HD-FARMS: Product Development Requirements (PDR)

## Executive Summary

**HD-FARMS** is a comprehensive multi-tenant livestock management platform designed for large-scale farms managing 5,000+ animals across multiple zones, species, and operational locations. The system provides real-time health tracking, vaccination management, feeding optimization, disease reporting, and breeding event management through integrated web and mobile interfaces.

**Project Duration:** 45 calendar days  
**Target Launch:** Phase 2 complete (both core + advanced features)  
**Primary Users:** Farm managers, zone workers, veterinarians, farm owners

---

## 1. Business Context

### Problem Statement
Large-scale livestock operations lack centralized, real-time visibility into:
- Individual animal health status and medical history
- Vaccination schedules and compliance
- Feed consumption and feed conversion ratios (FCR)
- Disease outbreaks and treatment protocols
- Breeding events and reproduction cycles

### Market Scope
- **Geographic:** Vietnam-focused (Vietnamese language support, metrics)
- **Scale:** 5,000+ animals per farm; 10+ zones per farm
- **Species:** Hogs (heo), poultry (gà), cattle (bò) — multi-species same platform
- **Business Model:** SaaS (per-farm monthly subscription) — single tenant per farm account

---

## 2. User Roles & Permissions

| Role | Scope | Permissions | Use Case |
|---|---|---|---|
| **Admin** (Super) | Cross-company | Manage companies, users, audit logs, billing | System operator |
| **Admin** (Farm) | Single farm | All features, user management, settings | Farm owner/director |
| **Manager** | Single farm | View all zones, animal CRUD, health/vaccine, reports | Farm operations manager |
| **Worker** | Single zone | Quick actions (feeding, health check), QR scan | Daily pen ops |
| **Vet** | Single farm | Health records, disease reports, treatments | On-farm veterinarian |

**Isolation:** JWT payload: `{ userId, companyId, farmId, role }` — every query scoped by `companyId` + `farmId`

---

## 3. Core Feature Modules

### Module 1: Multi-Tenancy & Auth
- Company → Farm → Zone → Pen → Animal hierarchy
- JWT authentication (24h expiry, HS256, no refresh tokens — MVP)
- Role-based access control (RBAC) enforced per endpoint
- Soft delete (never hard delete user/animal data)

### Module 2: Animal Lifecycle
- Create/update animals with species type (heo, gà, bò)
- Track: ID, name, DOB, sex, status, pen location, batch assignment
- QR code per animal (UUID-based, generated on creation, deep link: `hdfarms://animal/{uuid}`)
- Bulk import via CSV (web admin only)

### Module 3: Health Status & Tracking
- Real-time health status: Healthy | Monitoring | Sick | Quarantine | Recovered | Dead | Sold
- Health records: date, status, notes, updated_by, timestamp
- Quick status change actions from mobile (QR scan + tap)

### Module 4: Vaccination Management
- Vaccine types (species-specific)
- Vaccination records: animal, vaccine, date, tech, notes
- Alerts: overdue vaccinations (configurable threshold)
- Batch vaccination tracker (mark multiple animals at once)

### Module 5: Disease & Treatment
- Disease types catalog
- Disease records: animal, disease, onset_date, description, status
- Treatment records: disease, treatment_type, date, duration, outcome
- Medical history timeline per animal

### Module 6: Feeding & FCR
- Feed types catalog (by species)
- Feeding records: pen, date, feed_type, quantity, cost
- FCR calculation: (total feed per batch) / (weight gain per batch)
- Monthly feed usage reports

### Module 7: Batch (Lứa) Management
- Logical grouping of animals (herd, generation, cohort)
- Track batch lifecycle: creation → growth → sale/slaughter
- Batch-level analytics: average weight, mortality rate, FCR

### Module 8: Reproduction Events
- Event types: mating, pregnancy detection, farrowing/birth, weaning
- Pedigree tracking: sire + dam per animal
- Expected due dates + farrowing records
- Genetic lineage reports

### Module 9: Advanced Dashboards & Reports
- KPI summary: total animals, health distribution, vaccine compliance, mortality
- Charts: health status over time, FCR trends, disease frequency
- Export: PDF reports (health, vaccines, feed costs, batch reports)

---

## 4. Functional Requirements

### 4.1 API Requirements
- RESTful endpoints only (no GraphQL — MVP)
- Standard response format:
  - Lists: `{ data: [...], meta: { count, page, limit } }`
  - Single: `{ data: {...} }`
  - Errors: `{ statusCode: number, message: string }`
- Pagination: cursor-based for all list endpoints
- All endpoints tenant-scoped (filter by `companyId` from JWT)

### 4.2 Web Admin Requirements
- Server Components by default (Next.js 14 App Router)
- Data fetches in server components; mutations in server actions
- Responsive: mobile-first (sm:, md:, lg: breakpoints)
- Sidebar: collapsible, 10 nav items (see design-guidelines.md)
- Data tables: sticky headers, bulk actions, sortable columns
- Forms: validation via Yup schemas (shared from packages/shared)
- Charts: Recharts (KPI cards, line/bar charts)

### 4.3 Mobile Requirements
- Expo Router v3 file-based routing
- Bottom tab bar: Home | Animals | [QR FAB] | Alerts | Profile
- QR Scanner: expo-camera + custom viewfinder overlay
- Touch targets: 44x44px minimum
- Bottom sheet for post-scan quick actions
- Offline support: local cache (Phase 2+)

### 4.4 Database Requirements
- PostgreSQL 16 (Docker Compose local, Cloud TBD)
- Drizzle ORM (code-first schema)
- One schema file per domain (animals.ts, health.ts, etc.)
- Migrations: auto-generate via drizzle-kit, never edit manually
- Indexes on FK + filter columns
- JSONB `type_metadata` for species-specific fields

---

## 5. Non-Functional Requirements

| Requirement | Target | Rationale |
|---|---|---|
| **API Performance (p95)** | <200ms | Real-time mobile interactions |
| **Mobile Response (QR scan)** | <500ms | Smooth UX after scan |
| **Database Scalability** | 5,000+ animals/farm | No pagination limits on internal queries |
| **Concurrency** | 100+ concurrent users/farm | Peak farm activity |
| **Data Retention** | Permanent (soft delete) | Compliance + historical analysis |
| **TypeScript Strictness** | `"strict": true` | Type safety, zero `any` |
| **Code Coverage** | ≥70% unit + integration tests | Reliability |
| **Availability (MVP)** | Online-only (no offline) | Simplified data sync |

---

## 6. Technical Constraints

### Stack Constraints
- **Node.js:** ≥20.x (ES2024 features)
- **pnpm:** ≥9.x (workspace management)
- **Turbo:** ≥2.x (monorepo builds)
- **PostgreSQL:** 16.x (JSON operators, RLS in Phase 2)
- **Expo SDK:** ≥51.x (latest stable)

### Implementation Constraints
- TypeScript strict mode always (`"strict": true`)
- No `any` type — use `unknown` + type guards
- argon2id for password hashing (never bcrypt)
- JWT HS256, 24h expiry, stored client-side only
- postgres.js library (NOT pg) for database client
- Yup validators for all request validation (shared packages/shared)
- REST API only (no GraphQL Phase 1)

---

## 7. Success Criteria by Phase

### Phase 1 (Phases 1-7: ~20 days)
- [ ] Monorepo fully functional (all 3 apps boot)
- [ ] Auth system: login/logout, JWT verify, RBAC middleware
- [ ] Core CRUD APIs complete: animals, zones, pens
- [ ] Web admin: animal list, create, edit, delete
- [ ] Mobile: QR scan → animal detail view
- [ ] Health status quick actions working
- [ ] Vaccination records CRUD complete
- **Validation:** All unit + integration tests pass; >70% coverage

### Phase 2 (Phases 8-12: ~25 days)
- [ ] Disease/treatment records complete
- [ ] Batch management CRUD + batch-level analytics
- [ ] Feeding records + FCR calculation
- [ ] Reproduction event tracking
- [ ] Advanced dashboard with 5+ charts
- [ ] PDF report export (health, vaccines, feed, batch)
- [ ] Mobile offline cache (read-only)
- **Validation:** E2E tests on both web + mobile; UX sign-off

---

## 8. Out of Scope (MVP)

- **Push Notifications** — Phase 2+ (FCM/APNs setup)
- **Offline Mode** — Read-only cache only, Phase 2+
- **AI/ML Analytics** — Predictive models Phase 3+
- **Financial Module** — Cost tracking, revenue, margins Phase 3+
- **Advanced RLS (Row-Level Security)** — Phase 2 (PostgreSQL policies)
- **Third-party Integrations** — Weather, genetics DBs Phase 3+
- **Multi-language** (Vietnamese only for MVP, i18n Phase 2+)
- **Biometric Auth** — Face/touch ID Phase 2+
- **Custom Reports Builder** — Phase 3+

---

## 9. Compliance & Standards

- **Data Privacy:** Soft delete pattern (no permanent removal of records)
- **Security:** JWT auth, role-based access, tenant isolation, input validation via Yup
- **Accessibility:** WCAG 2.1 AA (web); touch targets ≥44px (mobile)
- **Performance:** Lighthouse score ≥80 (web); TTI <3s mobile

---

## 10. Architecture Overview

```
Turborepo Monorepo (pnpm workspaces)
│
├── apps/api (Fastify + TypeScript)
│   ├── plugins: jwt, auth, db, errorHandler
│   └── modules: {domain}/(routes.ts, service.ts, schema.ts)
│
├── apps/web (Next.js 14 App Router + shadcn/ui)
│   ├── app: file-based routing
│   └── components: shadcn reusable, variant via cva()
│
├── apps/mobile (Expo Router v3 + React Native)
│   ├── app: file-based routing
│   └── modules: screens + components
│
└── packages
    ├── shared: types, Yup validators, constants
    ├── db: Drizzle schema + migrations
    ├── eslint-config
    └── tsconfig
```

**Authentication Flow:**  
Login → argon2 verify → JWT sign (24h) → store client → attach `Authorization: Bearer {token}` → Fastify JWT verify → role check → handler

**Multi-Tenancy Scoping:**  
JWT `{ userId, companyId, farmId, role }` → every query filters `WHERE company_id = $1 AND farm_id = $2`

---

## 11. Deployment & DevOps (Initial)

- **Local Dev:** Docker Compose (postgres + pgAdmin)
- **Hosting:** TBD (AWS/Azure/Vercel for web)
- **Database:** PostgreSQL 16 (Cloud: managed RDS/Azure Database)
- **CI/CD:** GitHub Actions (lint, test, build)
- **Monitoring:** Basic error logging (Phase 2+)

---

## 12. Open Questions / Risks

1. **Species-specific fields:** How much variation in animal types (heo vs gà vs bò)? Plan: JSONB metadata + conditional UI
2. **Batch accounting:** How are animals moved between batches during lifecycle?
3. **Offline mobile:** Phase 1 online-only; Phase 2 read-only cache design TBD
4. **Payment integration:** Subscription model — when? (Not MVP)
5. **Multi-farm users:** Can one user access multiple farms? (Current: no — future enhancement)

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-22  
**Next Review:** After Phase 1 completion
