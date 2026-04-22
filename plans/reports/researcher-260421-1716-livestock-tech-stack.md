# Research Report: Livestock Management System Tech Stack

**Date:** 2026-04-21 | **Scope:** 5000+ animals, 10+ zones, single farm, online-only

---

## Executive Summary

For your livestock management system, recommend **Turborepo + Drizzle + PostgreSQL + REST API** stack:

- **Monorepo:** Turborepo (simpler, faster, perfect for <30 packages; Nx overkill for your scale)
- **Database:** PostgreSQL with Drizzle ORM (type-safe, performant, lightweight)
- **API:** REST (simple CRUD operations; GraphQL adds complexity without clear benefit here)
- **QR Strategy:** react-native-qrcode-svg for generation + expo-camera for scanning + deep linking via custom scheme

This combination prioritizes simplicity, performance, and team velocity—avoiding premature complexity while maintaining solid architecture.

---

## 1. Monorepo: Turborepo vs Nx

### Turborepo Strengths

- **Speed:** 3x faster builds than Nx, 16x faster than Lerna (2025 benchmarks)
- **Simplicity:** Minimal learning curve; easy configuration (turbo.json)
- **Perfect fit:** For monorepos with <15-30 packages—your likely scale
- **Go-based:** Extremely fast incremental builds; effective caching
- **pnpm integration:** Works flawlessly with pnpm workspaces; excellent disk efficiency

### Turborepo Limitations

- **Code generation:** Weak compared to Nx; uses Plop.js templates (no AST-level transforms)
- **Visualization:** No built-in project graph UI (limited dependency debugging)
- **Enterprise scale:** Struggles with 30+ packages or complex cross-domain dependencies

### Nx Strengths

- **Advanced tooling:** Generators with AST-level code modification; scaffolding complex components automatically
- **Project graph:** Visual dependency analysis; detects actual file imports (not just package.json)
- **Enterprise:** Better for 30+ packages; cleaner affected builds with finer granularity
- **Integrated ecosystem:** Built-in plugins for testing, linting, code generation

### Nx Limitations

- **Performance cost:** Slower builds; higher memory overhead
- **Complexity:** Steep learning curve; "magic" can confuse new developers
- **Overkill:** For small-to-medium monorepos (adds 30-40% overhead you won't use)

### Recommendation: **Turborepo**

**Why:** Your structure (backend + web admin + mobile) = ~8-12 packages max. Turborepo's speed and simplicity outweigh Nx's advanced features. Start with Turborepo; migrate to Nx only if you exceed 30 packages and genuinely need advanced dependency analysis.

**Structure:**

```
monorepo/
├── apps/
│   ├── api/              # Node.js/Express backend
│   ├── web-admin/        # React web admin
│   └── mobile/           # React Native Expo
├── packages/
│   ├── shared-types/     # TypeScript types (used by all)
│   ├── shared-utils/     # Utility functions
│   ├── database/         # Drizzle schema + migrations
│   ├── api-client/       # Shared API client logic
│   └── eslint-config/    # Shared linting rules
└── turbo.json            # Cache config; 2-3 KB
```

---

## 2. Database Design: PostgreSQL + Schema for Hierarchy

### Core Schema Pattern

Livestock hierarchy: **Farm → Zone → Pen → Animal**

Use a **normalized core + denormalized read tables** approach:

```sql
-- Normalized: Immutable entity structure
CREATE TABLE animals (
  id UUID PRIMARY KEY,
  farm_id UUID NOT NULL,      -- Single farm, but multi-tenant ready
  zone_id UUID NOT NULL,
  pen_id UUID,                 -- Optional; some systems skip pen level
  qr_code VARCHAR UNIQUE NOT NULL,  -- 1:1 mapping for mobile lookup
  tag_number VARCHAR UNIQUE,   -- Physical tag ID
  name VARCHAR,
  species VARCHAR,             -- cattle, sheep, goats, etc.
  breed VARCHAR,
  date_of_birth DATE,
  gender VARCHAR,
  status VARCHAR DEFAULT 'active',  -- active, culled, sold, deceased
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE zones (
  id UUID PRIMARY KEY,
  farm_id UUID NOT NULL,
  name VARCHAR NOT NULL,       -- "North Pasture", "Breeding Pen A"
  capacity INT,                -- Max animals in zone
  area_sqm DECIMAL,
  zone_type VARCHAR,           -- pasture, pen, barn, etc.
  created_at TIMESTAMP
);

CREATE TABLE pens (
  id UUID PRIMARY KEY,
  zone_id UUID NOT NULL,
  name VARCHAR,
  capacity INT,
  pen_type VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE vaccinations (
  id UUID PRIMARY KEY,
  animal_id UUID NOT NULL,
  vaccine_name VARCHAR,
  date_administered DATE,
  next_due_date DATE,
  administered_by VARCHAR,
  notes TEXT,
  created_at TIMESTAMP
);

CREATE TABLE health_records (
  id UUID PRIMARY KEY,
  animal_id UUID NOT NULL,
  weight_kg DECIMAL,
  condition_score INT,         -- 1-5 scale
  health_status VARCHAR,       -- healthy, sick, injured, etc.
  record_date DATE,
  notes TEXT,
  recorded_at TIMESTAMP
);

-- Denormalized: For fast queries (updated via triggers or batch job)
CREATE TABLE animal_current_state (
  animal_id UUID PRIMARY KEY,
  zone_name VARCHAR,
  pen_name VARCHAR,
  last_weight_kg DECIMAL,
  last_health_check DATE,
  next_vaccination_date DATE,
  days_since_last_check INT,
  updated_at TIMESTAMP
);

-- Indexes for mobile QR lookup (critical performance path)
CREATE INDEX idx_animals_qr ON animals(qr_code);
CREATE INDEX idx_animals_zone ON animals(zone_id);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_health_animal_date ON health_records(animal_id, record_date DESC);
```

### Design Rationale

- **Normalization:** Avoids data duplication; updates are atomic (one source of truth)
- **Denormalization:** `animal_current_state` pre-aggregates for mobile app queries (no joins on QR scan)
- **Indexes:** QR lookup is O(1) via unique index; zone queries are O(log n)
- **Scalability:** For 5000 animals + 10 zones: ~50k vaccinations, ~200k health records → PostgreSQL handles easily

### Query Performance Notes

- **Hot path (QR scan):** `SELECT * FROM animals WHERE qr_code = ? ` + join to `animal_current_state` (2 queries, <5ms)
- **Trend queries:** Aggregations over health_records (indexed on animal_id + date) scale well
- **List endpoints:** Paginated queries with zone filters; PostgreSQL optimizer handles efficiently

---

## 3. ORM: Drizzle vs Prisma vs TypeORM

### Drizzle ORM

**Performance:** ~4.6k req/s with ~100ms p95 latency on 370k PostgreSQL records (production E-commerce traffic)

- Lightweight; minimal abstraction overhead
- Query builder maps 1:1 to SQL; full visibility into executed queries
- Type-safe via TypeScript schema definitions (code-first approach)
- Migrations: Simple SQL files; excellent version control
- Bundle size: ~40KB (vs Prisma ~500KB)
- **Verdict:** Fastest; lowest overhead; production-proven at scale

### Prisma ORM

**Performance:** Significantly slower than Drizzle; CPU overhead from ORM abstraction layer

- Schema-first approach (separate `.prisma` file); code generation required
- Automatic migrations; excellent DX
- Rich ecosystem; popular in startups
- Auto-formatting; opinionated best practices
- Good for 80% of use cases; struggles with bulk operations and complex aggregations
- **Verdict:** Good DX, moderate performance; overkill if performance matters

### TypeORM

**Performance:** Worst of three; class instantiation overhead for each row (CPU saturates on bulk queries)

- Decorator-based; requires understanding of both TypeScript and SQL concepts
- Excellent for ORMs in other languages (Java/Spring pattern); feels foreign in Node.js
- Enterprise adoption; but newer projects favor Drizzle/Prisma
- **Verdict:** Legacy choice; avoid for new projects

### Recommendation: **Drizzle ORM**

**Why:** Your 5000+ animals dataset will generate frequent trend queries and bulk operations. Drizzle's performance advantage (4-5x faster than Prisma on large datasets) matters here. The code-first approach aligns with TypeScript best practices; migrations are explicit and reviewable.

**Code Example:**

```typescript
import { pgTable, uuid, varchar, timestamp, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const animals = pgTable('animals', {
  id: uuid('id').primaryKey(),
  zone_id: uuid('zone_id').notNull(),
  qr_code: varchar('qr_code').unique().notNull(),
  name: varchar('name'),
  weight_kg: decimal('weight_kg', { precision: 5, scale: 2 }),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const zones = pgTable('zones', {
  id: uuid('id').primaryKey(),
  name: varchar('name').notNull(),
  capacity: integer('capacity'),
});

export const animalsRelations = relations(animals, ({ one }) => ({
  zone: one(zones, { fields: [animals.zone_id], references: [zones.id] }),
}));

// Usage: Type-safe, no code generation step
const getAnimalByQR = async (qrCode: string) => {
  return await db.query.animals.findFirst({
    where: eq(animals.qr_code, qrCode),
    with: { zone: true },
  });
};
```

---

## 4. QR Code Strategy: Generation + Deep Linking

### Architecture

1. **Generation (Backend):** Generate 5000 QR codes once during setup; store as SVG/PNG
2. **Mobile Scanning:** Use `expo-camera` for camera access; parse QR content
3. **Deep Link Format:** `hdfarm://animal/{animalId}` or `hdfarm://qr/{qrCode}`
4. **Storage:** QR as URLs in database for web display; embed as image in mobile

### Implementation Strategy

**Backend (Node.js):**

```typescript
import QRCode from 'qrcode';

// Generate once; store in DB or static file
const generateQRCode = async (animalId: string, qrCode: string) => {
  const deepLink = `hdfarm://animal/${animalId}`;
  const svgString = await QRCode.toString(deepLink, {
    type: 'image/svg+xml',
    width: 300,
    margin: 1,
  });
  return svgString;
};

// Store in database as blob or reference to cloud storage
```

**React Native (Expo):**

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import * as Linking from 'expo-linking';

// Scanning view
export const QRScanner = ({ onScanned }: Props) => {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission?.granted) {
    return <RequestCameraPermission onAllow={requestPermission} />;
  }

  return (
    <CameraView
      onBarcodeScanned={({ data }) => {
        // data = "hdfarm://animal/uuid-123"
        const animalId = extractIdFromDeepLink(data);
        navigation.navigate('AnimalDetail', { animalId });
      }}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
    />
  );
};

// Deep linking handler in app.json
{
  "plugins": [
    ["expo-camera", { "cameraPermission": "Camera access required" }]
  ],
  "scheme": "hdfarm"
}

// In App.tsx linking config
const linking = {
  prefixes: ['hdfarm://', 'https://hdfarm.com'],
  config: {
    screens: {
      AnimalDetail: 'animal/:id',
    },
  },
};
```

### Web Admin Display

```typescript
// React component
<QRCode value={`hdfarm://animal/${animalId}`} size={256} />
// Or display stored SVG from backend
```

### Unresolved Questions

- **Cloud storage vs DB:** Store QR images in cloud (S3, Cloudinary) for large scale, or as blobs in DB? (DB simpler for single farm; cloud better if you scale to multi-tenant)
- **Offline QR scanning:** Does mobile need offline QR lookup, or always online? (Affects cache strategy)

---

## 5. REST vs GraphQL

### REST API (Recommended)

**Strengths for Your Use Case:**

- Simple CRUD operations: Animals, zones, vaccinations, health records → REST endpoints are natural fit
- HTTP caching works out-of-the-box (ETag, Last-Modified headers)
- Mobile-friendly: Fixed payload shapes reduce complexity
- CDN-compatible: Static queries cache at edge
- Operational simplicity: Easier monitoring, logging, rate limiting

**Endpoints Structure:**

```
GET    /api/animals                    # List (with pagination)
GET    /api/animals/:id                # Detail
POST   /api/animals                    # Create
PATCH  /api/animals/:id                # Update
DELETE /api/animals/:id                # Delete

GET    /api/animals/:id/vaccinations   # Nested resource
GET    /api/animals/:id/health-history # Trend data

GET    /api/zones                      # Zone hierarchy
GET    /api/zones/:id/animals          # Animals in zone

GET    /api/reports/health-summary     # Aggregations
GET    /api/reports/vaccination-due    # Filtered queries
```

**Mobile Query Example:**

```
GET /api/animals?qr_code={code}       # Fast lookup
GET /api/animals/{id}?include=zone,vaccinations  # Reduce round-trips
```

### GraphQL Considerations

**Strengths:**

- Complex nested queries in one request (e.g., animal + zone + recent vaccines)
- Mobile data usage optimization (query only needed fields)

**Weaknesses for Your System:**

- **Overkill for CRUD:** Your queries are mostly straightforward (fetch animal, list by zone, trend charts)
- **Caching complexity:** GraphQL uses POST; APQ (Automatic Persisted Queries) needed for caching
- **Operational overhead:** Query depth limits, field-level authorization, query complexity analysis required
- **Learning curve:** Team must understand GraphQL schema; debugging harder
- **Performance:** Without proper optimization (batching, DataLoader), actually slower than REST for simple queries

**When GraphQL would help:** If you have 50+ entities with complex relationships, or need sub-second real-time updates. Not your current case.

### Recommendation: **REST API**

**Why:** Simple CRUD operations dominate. REST's simplicity, caching, and operational transparency win. You can always add a GraphQL layer later if complexity increases (e.g., multi-farm analytics).

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Turborepo Monorepo                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   apps/api   │  │ apps/web     │  │ apps/mobile  │  │
│  │  (Node.js)   │  │ (React)      │  │ (RN/Expo)    │  │
│  │  Express     │  │  Admin Panel  │  │  Field Ops   │  │
│  │  REST API    │  │               │  │  QR Scanner  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                 │                   │         │
│         └─────────────────┼───────────────────┘         │
│                           │                             │
│         ┌─────────────────────────────────┐            │
│         │   packages/shared-types         │            │
│         │   packages/database (Drizzle)   │            │
│         │   packages/api-client           │            │
│         └─────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
    ┌──────────────┐              ┌──────────────┐
    │ PostgreSQL   │              │ File Storage │
    │ Database     │              │ (QR images)  │
    │ (5000+ rows) │              │              │
    └──────────────┘              └──────────────┘
```

---

## Implementation Roadmap

1. **Monorepo Setup** (Day 1): Initialize Turborepo + pnpm workspaces
2. **Database Design** (Day 2-3): PostgreSQL schema + Drizzle setup + migrations
3. **Backend API** (Days 4-7): Express + Drizzle queries + REST endpoints
4. **QR System** (Day 8): Backend QR generation + mobile scanner
5. **Web Admin** (Days 9-15): React + REST client + CRUD UI
6. **Mobile App** (Days 16-21): React Native + deep linking + offline support

---

## Key Takeaways

| Decision | Choice                   | Why                                                 |
| -------- | ------------------------ | --------------------------------------------------- |
| Monorepo | Turborepo                | 3x faster; simplicity for small scale               |
| ORM      | Drizzle                  | 4-5x faster on large datasets; lightweight          |
| Database | PostgreSQL               | Proven; excellent for hierarchical queries          |
| API      | REST                     | Simple CRUD; native caching; operational simplicity |
| QR       | expo-camera + qrcode-svg | Battle-tested; Expo-native integration              |

---

## Sources

**Monorepo Comparison:**

- [Turborepo vs Nx: I Migrated a Monorepo Twice](https://navanathjadhav.medium.com/turborepo-vs-nx-i-migrated-a-monorepo-twice-to-compare-38e95e434273)
- [Monorepo Tools Comparison 2025](https://dev.to/_d7eb1c1703182e3ce1782/monorepo-tools-comparison-turborepo-vs-nx-vs-lerna-in-2025-15a6)
- [Setting Up a React and React Native Monorepo with Turborepo](https://medium.com/@alex.derville/setting-up-a-react-and-react-native-monorepo-with-turborepo-and-pnpm-8310c1faf18c)

**ORM Performance:**

- [Drizzle vs Prisma: Practical Comparison 2026](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma)
- [Performance Benchmarks: TypeScript ORMs](https://www.prisma.io/blog/performance-benchmarks-comparing-query-latency-across-typescript-orms-and-databases)
- [Drizzle ORM Benchmarks](https://orm.drizzle.team/benchmarks)
- [Best ORM for NestJS 2025](https://dev.to/sasithwarnakafonseka/best-orm-for-nestjs-in-2025-drizzle-orm-vs-typeorm-vs-prisma-229c)

**QR Code & Deep Linking:**

- [Expo QR Code Documentation](https://docs.expo.dev/more/qr-codes/)
- [How to Use Custom Deep Links in React Native Expo](https://mattermost.com/blog/custom-deep-links-for-react-native-apps/)
- [Building a QR Code Scanner with React Native Expo](https://sasandasaumya.medium.com/building-a-qr-code-scanner-with-react-native-df8e8f9e4c08)

**REST vs GraphQL:**

- [GraphQL vs REST API 2025](https://api7.ai/blog/graphql-vs-rest-api-comparison-2025)
- [REST API vs GraphQL: 2025 Statistics & Performance](https://jsonconsole.com/blog/rest-api-vs-graphql-statistics-trends-performance-comparison-2025)
- [API Design Best Practices 2025](https://dev.to/cryptosandy/api-design-best-practices-in-2025-rest-graphql-and-grpc-234h)

**Database Design:**

- [PostgreSQL Schema Design Guide](https://www.tigerdata.com/learn/how-to-design-postgresql-database-two-schema-examples)
- [Modeling Hierarchical Tree Data in PostgreSQL](https://leonardqmarcq.com/posts/modeling-hierarchical-tree-data)

---

**Unresolved Questions:**

1. Cloud vs DB storage for QR images? (Depends on scale expansion plans)
2. Does mobile app need offline QR lookup capability?
3. Multi-farm support planned in future? (Affects schema normalization strategy)
4. Real-time animal tracking or batch updates sufficient? (Affects WebSocket strategy)
