# HD-FARMS: Code Standards & Implementation Guidelines

Every file, function, and API endpoint must follow these standards. **This is not optional.** These rules enable code reviews, onboarding, and maintainability across all 12 phases.

---

## 1. File Organization & Naming

### File Naming Convention
- **All files:** kebab-case (lowercase, hyphens for word separation)
- **JavaScript/TypeScript:** `.ts`, `.tsx` (never `.js`)
- **Imports:** ordered as (1) third-party → (2) internal packages → (3) local
- **Barrel exports:** every module exports via `index.ts`

**Examples:**
```
Good:   animal-service.ts, health-record.ts, user-auth.ts
Bad:    animalService.ts, HealthRecord.ts, UserAuth.ts
```

### File Size Constraint
- **Maximum per file:** 200 lines (including comments, imports, exports)
- **Action when exceeded:** Split into focused modules immediately
- **Example split:** 400-line service → split into `{domain}-read.service.ts` + `{domain}-write.service.ts`

### Barrel Exports (index.ts)
Every module/package must have `index.ts` exporting public symbols:

```typescript
// packages/shared/src/types/index.ts
export type { Animal, Zone, Pen } from './animal.js';
export type { HealthRecord, HealthStatus } from './health.js';

// apps/api/src/modules/animals/index.ts
export { animalRoutes } from './animal.routes.js';
export { animalService } from './animal.service.js';
```

---

## 2. TypeScript Standards

### Strict Mode (Always)
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "alwaysStrict": true
  }
}
```

### No `any` — Use `unknown` + Type Guards
```typescript
// Bad
const handle = (data: any) => { data.property; };

// Good
const handle = (data: unknown) => {
  if (typeof data === 'object' && data !== null && 'property' in data) {
    console.log((data as Record<string, unknown>).property);
  }
};
```

### Explicit Return Types on Public Functions
```typescript
// Bad
export const getUserById = (id: string) => {
  return db.query(...);
};

// Good
export const getUserById = (id: string): Promise<User | null> => {
  return db.query(...);
};
```

### Type vs Interface
- **Use `type`** for object shapes, unions, tuples:
  ```typescript
  type Animal = { id: string; name: string; status: HealthStatus };
  type HealthStatus = 'healthy' | 'sick' | 'quarantine';
  ```
- **Use `interface`** only when extending/merging is needed:
  ```typescript
  interface ApiResponse<T> {
    data: T;
    meta: { timestamp: string };
  }
  ```

### Import Order
```typescript
// 1. Third-party
import { FastifyInstance } from 'fastify';
import { schema } from 'yup';

// 2. Internal packages
import { Animal } from '@hd-farms/shared/types';
import { db } from '@hd-farms/db';

// 3. Local modules
import { animalService } from './animal.service';
import { validateAnimal } from './animal.schema';
```

---

## 3. API Layer (Fastify)

### Module Pattern
Every domain has exactly 3 files:

```
apps/api/src/modules/{domain}/
├── {domain}.routes.ts    (route handlers)
├── {domain}.service.ts    (business logic)
└── {domain}.schema.ts     (Yup validators)
```

### Route Handler Pattern
```typescript
// animals.routes.ts
import { FastifyInstance } from 'fastify';
import { animalService } from './animal.service';
import { animalSchema } from './animal.schema';

export const animalRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: CreateAnimalInput }>(
    '/api/v1/animals',
    {
      schema: { body: animalSchema.create().describe('Create animal') },
      onRequest: [app.authenticate, app.requireRole('manager')]
    },
    async (req, res) => {
      const validated = await animalSchema.create().validate(req.body);
      const result = await animalService.create(validated, req.user);
      return res.code(201).send({ data: result });
    }
  );

  // GET, PATCH, DELETE follow same pattern
};
```

### Yup Schema in Routes
```typescript
// animal.schema.ts
import * as Yup from 'yup';

export const animalSchema = {
  create: () => Yup.object().shape({
    name: Yup.string().required(),
    species: Yup.string().oneOf(['heo', 'gà', 'bò']).required(),
    penId: Yup.string().uuid().required(),
  }),
  update: () => Yup.object().shape({
    name: Yup.string().optional(),
    status: Yup.string().optional(),
  }),
};
```

### Service Layer Pattern
```typescript
// animal.service.ts
import { db } from '@hd-farms/db';
import type { User } from '@hd-farms/shared/types';

export const animalService = {
  async create(input: CreateAnimalInput, user: User) {
    // Tenant-scoped query
    return db.animals.insert({
      ...input,
      companyId: user.companyId,
      farmId: user.farmId,
      createdBy: user.id,
    });
  },

  async getById(id: string, user: User) {
    // ALWAYS scope by tenant
    return db.animals.findOne({
      id,
      companyId: user.companyId,
      farmId: user.farmId,
    });
  },
};
```

### Response Shape (Consistent)
```typescript
// Single resource
{ data: { id: '...', name: '...', ... } }

// List with pagination
{
  data: [{ id, name, ... }, ...],
  meta: { count: 100, page: 1, limit: 20 }
}

// Error
{
  statusCode: 400,
  message: 'Invalid animal type'
}
```

### Error Handling (AppError)
```typescript
// plugins/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
  }
}

// In routes: wrap async handlers
try {
  const result = await animalService.create(input, req.user);
  return { data: result };
} catch (error) {
  if (error instanceof AppError) throw error;
  // Log with context
  console.error('Animal creation failed', {
    userId: req.user.id,
    farmId: req.user.farmId,
    error: error instanceof Error ? error.message : String(error),
  });
  throw new AppError('Failed to create animal', 500);
}
```

### Tenant Isolation (REQUIRED)
**Every query must scope by `companyId` AND `farmId`:**

```typescript
// Bad — exposes data to wrong tenant
const animals = await db.animals.findMany({ farmId: user.farmId });

// Good — full tenant scope
const animals = await db.animals.findMany({
  companyId: user.companyId,
  farmId: user.farmId,
});
```

### Fastify Plugins (Cross-Cutting Concerns)

```typescript
// plugins/auth.ts
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (app) => {
  app.register(jwt, { secret: process.env.JWT_SECRET });
  
  app.decorate('authenticate', async (req, res) => {
    try {
      await req.jwtVerify();
    } catch {
      res.code(401).send({ statusCode: 401, message: 'Unauthorized' });
    }
  });

  app.decorate('requireRole', (roles: string[]) => async (req, res) => {
    if (!roles.includes(req.user.role)) {
      res.code(403).send({ statusCode: 403, message: 'Forbidden' });
    }
  });
});
```

---

## 4. Database Layer (Drizzle ORM)

### Schema File Organization
One domain per file in `packages/db/src/schema/`:

```
schema/
├── tenancy.ts         (companies, farms, zones, pens)
├── auth.ts            (users, user_farm_roles)
├── animals.ts         (animals, batches)
├── config.ts          (animal_types, vaccine_types, etc.)
├── health.ts          (health_records, disease_records, treatment_records)
├── ops.ts             (feeding_records, reproduction_events)
└── index.ts           (barrel export all tables)
```

### Schema Code-First Pattern
```typescript
// schema/animals.ts
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const animals = pgTable('animals', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  farmId: uuid('farm_id').notNull(),
  name: text('name').notNull(),
  species: text('species', { enum: ['heo', 'gà', 'bò'] }).notNull(),
  status: text('status').notNull().default('healthy'),
  qrCode: text('qr_code').unique().notNull(),
  typeMetadata: jsonb('type_metadata'), // Species-specific fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
});
```

### Migrations (Auto-Generated, Never Manual)
```bash
# Generate migration from schema changes
pnpm db:generate

# Review generated file before applying
cat packages/db/migrations/0001_*.sql

# Apply migrations
pnpm db:migrate
```

**Rule:** Never manually edit migration files — always regenerate from schema changes.

### Indexes on Foreign Keys & Filters
```typescript
export const animals = pgTable('animals', {
  // ... columns
}, (table) => ({
  companyFarmIdx: index('animals_company_farm_idx').on(
    table.companyId,
    table.farmId
  ),
  statusIdx: index('animals_status_idx').on(table.status),
  deletedAtIdx: index('animals_deleted_at_idx').on(table.deletedAt),
}));
```

### Soft Delete Pattern
```typescript
// Always filter out soft-deleted records
const activeAnimals = await db.select()
  .from(animals)
  .where(and(
    eq(animals.farmId, farmId),
    isNull(animals.deletedAt)
  ));

// Soft delete: update deletedAt
await db.update(animals)
  .set({ deletedAt: new Date() })
  .where(eq(animals.id, id));
```

### JSONB for Species-Specific Fields
```typescript
// Avoid adding columns for each species variant
type_metadata JSONB:
{
  "heo": { "pigletCount": 12, "weanAge": 21 },
  "gà": { "eggProduction": 0.95 },
  "bò": { "milkYield": 25.5 }
}
```

---

## 5. Frontend Layer (Next.js App Router)

### Server Components by Default
```typescript
// app/animals/page.tsx — Server Component
import { getAnimals } from '@/lib/animals';

export default async function AnimalsPage() {
  const animals = await getAnimals();
  return <AnimalsList animals={animals} />;
}
```

### Mutations via Server Actions
```typescript
// app/animals/actions.ts
'use server';

import { createAnimal } from '@/lib/animals';
import { revalidatePath } from 'next/cache';

export async function createAnimalAction(input: CreateAnimalInput) {
  const result = await createAnimal(input);
  revalidatePath('/animals');
  return result;
}
```

### Client Components (Minimal, Explicit)
```typescript
'use client';

import { createAnimalAction } from './actions';

export function CreateAnimalForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    setLoading(true);
    await createAnimalAction(formData);
    setLoading(false);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### shadcn Components + Tailwind Only
```typescript
// BAD: inline styles
<div style={{ color: 'red', padding: '16px' }}>Error</div>

// GOOD: Tailwind
<div className="text-red-600 p-4">Error</div>

// BAD: custom CSS files
<button className={styles.button}>Click</button>

// GOOD: shadcn + Tailwind
import { Button } from '@/components/ui/button';
<Button>Click</Button>
```

### Responsive Mobile-First
```typescript
// BAD: desktop-first
<div className="md:hidden">Mobile</div>

// GOOD: mobile-first
<div className="lg:hidden">Mobile</div>

// Tables
<table className="w-full">
  <tr className="h-12 sm:h-16 md:h-14">
    <td className="px-2 sm:px-4">...</td>
  </tr>
</table>
```

### Component Variants via CVA
```typescript
// components/ui/badge.tsx
import { cva } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
  {
    variants: {
      status: {
        healthy: 'text-green-600 bg-green-100',
        sick: 'text-red-600 bg-red-100',
        monitoring: 'text-amber-600 bg-amber-100',
      },
    },
  }
);

export function Badge({ status = 'healthy' }) {
  return <span className={badgeVariants({ status })}>Label</span>;
}
```

---

## 6. Mobile Layer (Expo React Native)

### Expo Router v3 File-Based Routing
```
app/
├── (auth)/
│   ├── login.tsx
│   └── signup.tsx
├── (tabs)/
│   ├── home.tsx
│   ├── animals.tsx
│   ├── alerts.tsx
│   └── profile.tsx
└── _layout.tsx
```

### Camera Permissions (Always Request)
```typescript
// app/qr-scanner.tsx
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';

export default function QRScanner() {
  useEffect(() => {
    (async () => {
      const { status } = await Permissions.askAsync(
        Permissions.CAMERA,
        Permissions.MEDIA_LIBRARY
      );
      if (status !== 'granted') {
        Alert.alert('Camera permission required');
      }
    })();
  }, []);

  return <Camera {...} />;
}
```

### Touch Targets ≥ 44x44px
```typescript
// BAD: 32px touch target
<TouchableOpacity style={{ width: 32, height: 32 }} />

// GOOD: 44px minimum
<TouchableOpacity
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  style={{ width: 36, height: 36 }}
/>
```

### Platform-Specific Files (Last Resort)
```
Only use .ios.tsx / .android.tsx when behavior truly diverges:

component.ios.tsx
component.android.tsx

For conditional rendering, use Platform module:
import { Platform } from 'react-native';

{Platform.OS === 'ios' && <IosSpecific />}
```

### Bottom Sheet Post-Scan
```typescript
// Use React Native Bottom Sheet library
import BottomSheet from '@gorhom/bottom-sheet';

<BottomSheet snapPoints={[300, 500]}>
  <AnimalDetailHeader animal={scanned} />
  <ScrollView horizontal>
    <QuickActionButton title="Health Check" />
    <QuickActionButton title="Vaccination" />
  </ScrollView>
</BottomSheet>
```

---

## 7. Shared Package (packages/shared)

### Types Only (No Logic)
```typescript
// types/animal.ts
export type Animal = {
  id: string;
  name: string;
  species: 'heo' | 'gà' | 'bò';
  status: HealthStatus;
  penId: string;
  qrCode: string;
  createdAt: Date;
};

export type HealthStatus =
  | 'healthy'
  | 'monitoring'
  | 'sick'
  | 'quarantine'
  | 'recovered'
  | 'dead'
  | 'sold';
```

### Yup Validators (Reused by API, Web, Mobile)
```typescript
// schemas/animal.ts
import * as Yup from 'yup';

export const createAnimalSchema = Yup.object().shape({
  name: Yup.string()
    .required('Animal name is required')
    .min(2)
    .max(100),
  species: Yup.string()
    .oneOf(['heo', 'gà', 'bò'])
    .required(),
  penId: Yup.string().uuid().required(),
});

// Reused in API:
app.post('/api/v1/animals', async (req, res) => {
  const data = await createAnimalSchema.validate(req.body);
  ...
});

// Reused in Web/Mobile:
const [errors, setErrors] = useState({});
try {
  await createAnimalSchema.validate(formData);
} catch (err) {
  setErrors(err.inner.reduce(...));
}
```

### Constants (No Business Logic)
```typescript
// constants/species.ts
export const ANIMAL_SPECIES = ['heo', 'gà', 'bò'] as const;
export const SPECIES_LABELS: Record<string, string> = {
  heo: 'Lợn',
  gà: 'Gà',
  bò: 'Bò',
};

export const HEALTH_STATUSES = [
  'healthy',
  'monitoring',
  'sick',
  'quarantine',
  'recovered',
  'dead',
  'sold',
] as const;
```

---

## 8. Security Standards

### Password Hashing (argon2id, Never bcrypt)
```typescript
import argon2 from 'argon2';

// Hash on registration
const passwordHash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});

// Verify on login
const isValid = await argon2.verify(passwordHash, plaintext);
```

### JWT Secret from Environment Only
```typescript
// plugins/jwt.ts
export default fp(async (app) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');

  app.register(require('@fastify/jwt'), { secret });
});

// .env.example
JWT_SECRET=<CHANGE_ME_IN_PRODUCTION>
```

### Never Commit .env
```bash
# .gitignore
.env
.env.local
.env.*.local
```

### Sanitize User Input via Yup Before DB Writes
```typescript
// ALWAYS validate before insert/update
const validated = await animalSchema.create().validate(req.body);
await db.animals.insert(validated);

// Never pass raw req.body to DB
// ✗ db.animals.insert(req.body);
```

### Input Sanitization (XSS Prevention)
```typescript
// For text fields stored in JSONB, always sanitize
import sanitizeHtml from 'sanitize-html';

const sanitized = sanitizeHtml(userInput, {
  allowedTags: ['b', 'i', 'em', 'strong'],
  allowedAttributes: {},
});
```

---

## 9. Error Handling & Logging

### Try-Catch Async Handlers
```typescript
async (req, res) => {
  try {
    const result = await animalService.create(input, req.user);
    return { data: result };
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Log error with context
    console.error('Error in handler', {
      route: req.url,
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new AppError('Internal server error', 500);
  }
}
```

### Never Expose Stack Traces in Production
```typescript
// Bad in production
return { error: error.stack };

// Good
return { statusCode: 500, message: 'Internal server error' };
// (Log stack server-side with context)
```

---

## 10. Testing Standards

### Unit Tests (Service Layer)
```typescript
// animal.service.test.ts
describe('animalService', () => {
  it('should create animal with tenant scope', async () => {
    const user: User = { id: '1', companyId: 'c1', farmId: 'f1', role: 'manager' };
    const result = await animalService.create(input, user);
    
    expect(result.companyId).toBe('c1');
    expect(result.farmId).toBe('f1');
  });

  it('should not return soft-deleted animals', async () => {
    const animals = await animalService.getByFarm(farmId, user);
    expect(animals.every(a => a.deletedAt === null)).toBe(true);
  });
});
```

### Integration Tests (API Routes + Real DB)
```typescript
// Use real PostgreSQL test database
describe('POST /api/v1/animals', () => {
  it('should create and return animal', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/animals',
      payload: { name: 'Pig01', species: 'heo', penId: 'p1' },
      headers: { authorization: 'Bearer ' + testToken },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().data.id).toBeDefined();
  });
});
```

### Coverage Target
- **Minimum:** 70% (unit + integration combined)
- **Run before commit:** `pnpm test --coverage`
- **Do not merge:** if coverage drops

### Snapshot Tests (Mobile)
```typescript
// key screen snapshots only
it('renders AnimalDetailScreen', () => {
  const tree = renderer
    .create(<AnimalDetailScreen animalId="123" />)
    .toJSON();
  expect(tree).toMatchSnapshot();
});
```

---

## 11. Git Commit Convention

**Format:** `{type}: {description}`

```
feat: add QR code scanning for animals
fix: tenant isolation bug in zone query
chore: update dependencies
refactor: split animal service into read/write
test: add integration tests for vaccination
docs: update API documentation
```

**Rules:**
- Lowercase description
- Imperative mood ("add" not "added")
- No period at end
- Max 72 characters

---

## 12. Code Review Checklist

Before merging any PR:

- [ ] No `any` types — use `unknown` + type guards
- [ ] Explicit return types on public functions
- [ ] All route handlers wrapped in try-catch
- [ ] Tenant scope check: every query filters by `companyId` + `farmId`
- [ ] No hardcoded secrets/API keys
- [ ] `.env` files not committed
- [ ] Tests pass: `pnpm test` (≥70% coverage)
- [ ] Linting passes: `pnpm lint`
- [ ] File size check: no file exceeds 200 lines
- [ ] Yup schema validates all user input
- [ ] Error messages don't expose stack traces

---

## 13. Naming Conventions

| Element              | Convention                | Example               |
|----------------------|---------------------------|-----------------------|
| Files (components)   | kebab-case                | transaction-form.tsx  |
| Files (utils)        | kebab-case                | api-response.ts       |
| Components           | PascalCase                | TransactionForm       |
| Functions            | camelCase                 | createTransaction     |
| Constants            | SCREAMING_SNAKE           | MAX_FILE_SIZE         |
| Types/Interfaces     | PascalCase with I prefix  | ITransaction          |
| Enums                | PascalCase                | TransactionType       |
| Database collections | snake_case plural         | transactions          |
| API routes           | kebab-case                | /api/v1/bank-accounts |
| Query keys           | camelCase with Keys suffix| transactionKeys       |

---

## 14. Critical Rules

- **No `any` type:** Use proper typing or `unknown` with type guards
- **Explicit return types:** All functions must have explicit return types
- **No hardcoded values:** Use constants or environment variables
- **Error boundaries:** Wrap page components in error boundaries
- **Form validation:** Always validate on both client (Yup) and server (Yup) using shared schemas
- **Phone numbers:** Store raw values; when rendering to UI, always display via `formatPhoneNumber()` from `src/lib/utils/phone.ts` (common formatting for international numbers; VN-specific formatting via rules today; extensible by providing additional `countryRules` and/or setting `NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY`)
- **Optimistic updates:** Use TanStack Query mutations with optimistic updates for better UX
- **Centralized query keys:** Always use `queries/keys.ts` for query keys — NEVER create per-domain keys
- **Use GenericForm/GenericTable:** Always use wrapper components instead of building forms/tables from scratch
- **Mutation callbacks:** NEVER show toast/messages/redirects inside mutation hooks — hooks only handle cache invalidation; all UI feedback (toast, alert, redirect, modal) must be passed via callbacks from the calling component
- **Generic hooks:** All query/mutation hooks must use TypeScript generics for proper type inference

---

**Document Version:** 1.1  
**Last Updated:** 2026-04-22  
**Enforced By:** All code reviews, CI/CD linting, pre-commit hooks
