# Brainstorm Report: HD-FARMS Livestock Management System

**Date:** 2026-04-22 | **Status:** Finalized (v4 — added Pen/Chuồng layer)

---

## Problem Statement

Xây dựng hệ thống quản lý chăn nuôi chuyên nghiệp cho công ty đa quốc gia và đa chi nhánh farm, mỗi farm lớn (> 5000 vật nuôi, > 10 khu) gồm:
- Web admin quản lý toàn diện vòng đời vật nuôi
- Mobile app với QR scan + 1-tap quick forms để nhập liệu nhanh
- Đa loại vật nuôi (heo, gà, bò...) cùng một platform

---

## Requirements Confirmed

| Area | Decision |
|------|----------|
| Scale | > 5000 animals/farm, > 10 zones/farm, nhiều chuồng/zone |
| Tenancy | Đa quốc gia, đa chi nhánh farm, bắt buộc login |
| Connectivity | Online only |
| Stack | Full JS/TS (Fastify + Next.js + Expo) |
| Mobile input | QR scan → 1-tap quick forms |
| Notifications | MVP: in-app alerts; post-MVP: push |
| Deployment | TBD |

---

## Architecture Decision: Monolith Monorepo

```
hd-farms/                          ← Turborepo root
├── apps/
│   ├── api/                       ← Fastify + TypeScript (REST)
│   ├── web/                       ← Next.js 14 App Router
│   └── mobile/                    ← Expo (React Native)
└── packages/
    ├── shared/                    ← Types, constants, Yup validators
    └── db/                        ← Drizzle schema + migrations
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Monorepo | Turborepo + pnpm | 3x nhanh hơn Nx, ít config |
| Backend | Node.js + Fastify + TS | 2x nhanh hơn Express, schema-based validation tích hợp |
| Validation | Yup | Dùng chung web/mobile/api, fluent API, async validation |
| Database | **PostgreSQL** | Relational, JSONB cho flexible fields |
| ORM | Drizzle | 4-5x nhanh hơn Prisma, TypeScript-first |
| Web Admin | Next.js 14 (App Router) | SSR, performance |
| UI Library | shadcn/ui + Tailwind | Component sẵn, customizable |
| Web Charts | Recharts | React chart library |
| Mobile | Expo (React Native) | expo-camera built-in |
| Mobile Charts | Victory Native | Charts cho RN |
| Auth | JWT + bcrypt | Multi-farm aware, scope token theo company/farm |
| QR | uuid + qrcode | Deep link: `hdfarms://animal/{uuid}` |

---

## Database Schema (Full)

### Core Hierarchy

```sql
-- Cấu hình
animal_types    (id, name, species_key, description)  ← heo/gà/bò
vaccine_types   (id, name, species_key, interval_days)
feed_types      (id, name, protein_pct, fat_pct, price_per_kg)
disease_types   (id, name, species_key, symptoms, description)

-- Org structure (multi-tenant)
companies  (id, name, country, timezone)
farms      (id, company_id, name, address, country)
zones      (id, farm_id, name, capacity, description)
pens       (id, zone_id FK, name, capacity int, description, status enum(active,inactive))
--          ↑ Chuồng — mỗi zone nhiều chuồng

-- Animal (core)
animals (
  id uuid PK,
  qr_code uuid UNIQUE,          ← QR scan lookup (indexed)
  pen_id FK,                    ← zone suy ra qua join: animal→pen→zone
  animal_type_id FK,
  batch_id FK,
  number varchar,               ← Số hiệu trong khu
  name varchar,
  notes text,
  born_at date,
  status enum(                  ← QUAN TRỌNG
    healthy, monitoring, sick,
    quarantine, recovered,
    dead, sold
  ),
  type_metadata JSONB           ← species-specific: role, parity, etc.
)
```

### Health & Medical

```sql
health_records (
  id, animal_id, weight_kg, body_condition_score,
  notes, recorded_by, recorded_at
)

disease_records (
  id, animal_id, disease_type_id,
  symptoms, severity enum(mild/moderate/severe),
  diagnosed_at, diagnosed_by,
  outcome enum(recovering/recovered/dead/sold_sick)
)

treatment_records (
  id, disease_record_id,
  medicine_name, dosage, unit,
  treated_at, treated_by, notes
)

vaccination_records (
  id, animal_id, vaccine_type_id,
  administered_at, next_due_at,  ← Alert query
  lot_number, administered_by, notes
)
```

### Feeding & Nutrition (FCR)

```sql
feeding_records (
  id uuid PK,
  pen_id FK → pens.id,          ← ghi theo chuồng, không phải từng con
  feed_type_id FK,
  quantity_kg decimal,
  animal_count int,             ← snapshot số con tại thời điểm ghi (FCR cần)
  recorded_at timestamp,
  recorded_by FK → users.id,
  notes text
)
-- FCR = SUM(quantity_kg) / SUM(weight_gain_per_animal_in_pen)
-- animal_count snapshot giúp tính đúng khi có con chết/bán trong kỳ
```

### Reproduction

```sql
reproduction_events (
  id, animal_id,
  event_type enum(mating, pregnant, birth, wean, egg_cycle),
  event_date,
  related_animal_id,     ← đực giống / mẹ / cha
  litter_size int,       ← số con sinh ra (birth event)
  live_count int,        ← số con sống
  notes text,
  metadata JSONB         ← species-specific flexible data
)
```

### Batch / Lứa

```sql
batches (
  id, farm_id,   ← scoped theo farm
  name, description,
  animal_type_id,
  start_date, expected_end_date,
  source varchar,        ← mua từ đâu / tự nuôi
  status enum(active, completed, cancelled)
)
-- animals.batch_id FK → batches.id
-- Batch stats: computed from animals in batch
```

### Critical Indexes

```sql
CREATE UNIQUE INDEX ON animals(qr_code);
CREATE INDEX ON animals(pen_id);              ← đổi từ zone_id
CREATE INDEX ON animals(status);
CREATE INDEX ON animals(batch_id);
CREATE INDEX ON pens(zone_id);                ← mới
CREATE INDEX ON feeding_records(pen_id, recorded_at);  ← mới (đổi từ animal_id)
CREATE INDEX ON vaccination_records(next_due_at);  ← alert query
CREATE INDEX ON health_records(animal_id, recorded_at);
CREATE INDEX ON disease_records(animal_id);
```

---

## Mobile UX: QR Scan → 1-Tap Quick Forms

```
Scan QR
  └── Animal Detail Screen
        ├── [STATUS BADGE: khỏe / theo dõi / bệnh]
        ├── Quick Actions (1-tap):
        │   ├── ⚖️  Ghi cân nặng    → số + submit
        │   ├── 💉 Tiêm vaccine    → chọn vaccine + ngày
        │   ├── 🤒 Ghi bệnh        → chọn bệnh + severity
        │   ├── 🍽️  Cho ăn          → chọn thức ăn + kg
        │   └── 🔄 Đổi trạng thái  → quick status picker
        └── [History tabs: Sức khỏe | Vaccine | Bệnh | Ăn uống]
```

**Nguyên tắc UX worker:** Tối đa 3 tap để nhập 1 record. Field nào không bắt buộc thì ẩn mặc định.

---

## Vaccination Alerts (In-App MVP)

```
API: GET /alerts/upcoming-vaccinations?days=7
Response: list of {animal, vaccine, next_due_at, zone}

Web Dashboard: widget "Cần tiêm trong 7 ngày tới"
Mobile: badge + notification screen khi mở app
```

---

## API Structure (REST)

```
POST /auth/login | GET /auth/me

GET/POST        /zones
GET/PUT/DELETE  /zones/:id
GET/POST        /zones/:id/pens              ← mới
GET/PUT/DELETE  /pens/:id                    ← mới
GET             /pens/:id/animals            ← danh sách con trong chuồng

GET/POST        /animals          (filter: penId, zoneId, type, status, batch)
GET/PUT/DELETE  /animals/:id
GET             /animals/by-qr/:qrCode       ← QR scan
PATCH           /animals/:id/status          ← quick status change
PATCH           /animals/:id/pen             ← chuyển chuồng (hiếm)

POST/GET        /animals/:id/health-records
POST/GET        /animals/:id/vaccinations
POST/GET        /animals/:id/disease-records
POST/GET        /animals/:id/treatments
POST/GET        /animals/:id/reproduction
POST/GET        /pens/:id/feedings           ← feeding giờ theo chuồng

GET/POST        /batches
GET             /batches/:id/stats           ← FCR, avg weight, mortality

GET             /dashboard/stats
GET             /alerts/upcoming-vaccinations

GET             /reports/fcr?batchId=&from=&to=
GET             /reports/weight-trend?animalId=
GET             /reports/batch-performance?batchId=
```

---

## Phased Implementation Plan

### Phase 1 — Core (~20 ngày)
| Task | Days |
|------|------|
| Monorepo setup + DB schema + Auth | 3 |
| Animal + Zone + Type CRUD (API) | 3 |
| QR generation + Web Admin UI | 3 |
| Mobile: Expo setup + QR scan + Animal Detail | 4 |
| Health status + quick status change | 2 |
| Vaccination schedule + records + alerts | 3 |
| Weight records + trend chart | 2 |

**Deliverable Phase 1:** Hệ thống cơ bản vận hành được — scan QR, xem thông tin, ghi cân, tiêm vaccine, theo dõi sức khỏe.

### Phase 2 — Advanced (~25-30 ngày)
| Task | Days |
|------|------|
| Disease records + Treatment + Medical history | 5 |
| Batch/Lứa management + batch stats | 5 |
| Feeding records + FCR calculation | 6 |
| Reproduction events (multi-species via JSONB) | 7 |
| Advanced dashboard + charts | 5 |

**Deliverable Phase 2:** Hệ thống chuyên nghiệp đầy đủ — FCR, sinh sản, lứa nuôi, bệnh án.

**Total: ~45-50 ngày dev**

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Multi-species reproduction logic phức tạp | JSONB metadata + event_type enum — flexible, không cần separate tables |
| Worker không nhập feeding hàng ngày → FCR vô nghĩa | UX 1-tap, batch input cho cả khu, dashboard show "thiếu dữ liệu" warning |
| 5000+ records → slow queries | Cursor pagination + composite indexes |
| QR bị hỏng/mất | Backup lookup qua số hiệu + zone name |
| Status transition sai (healthy → sold mà không qua cân) | Soft rules: warn khi status change bất thường, không hard block |

---

## Unresolved Questions

- Deployment target (VPS vs cloud managed)
- Push notifications: cần FCM setup khi vào Phase 2
- PostgreSQL backup strategy
- Phân quyền roles (admin vs worker vs viewer) — chưa thiết kế
- Xuất báo cáo PDF/Excel — post-Phase 2
