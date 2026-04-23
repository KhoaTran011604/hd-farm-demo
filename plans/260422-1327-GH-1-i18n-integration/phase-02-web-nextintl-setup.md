# Phase 02 — Web next-intl Setup

## Context Links
- Overview: `./plan.md`
- Research: `plans/reports/researcher-260422-1335-nextintl-v4-next15.md`
- Depends on: `./phase-01-shared-locales.md` (completed)

## Overview
- **Date:** 2026-04-22
- **Priority:** P1
- **Status:** complete
- **Effort:** 1.5h (actual: 1.7h)
- **Description:** Install `next-intl@^4` in `apps/web`, wire up URL prefix routing (`/vi/...`, `/en/...`), configure middleware + `getRequestConfig`, mount `NextIntlClientProvider` at root layout, wire TypeScript type generation.

## Key Insights
- next-intl v4.9.1 requires Next.js ≥15.2 (we have 15.2) and React ≥19 (we have 19) — compatible.
- `createMiddleware(routing)` handles locale detection + redirect automatically.
- `getRequestConfig` runs server-side once per request; imports shared messages from `@hd-farm/shared/locales/*`.
- In Next.js 15, `params` in layouts/pages are **Promises** → must `await`.
- `createMessagesDeclaration: true` auto-generates `.d.json.ts` files for TypeScript autocomplete.
- `localePrefix: 'always'` forces all routes under `/[locale]/` — required for predictable SEO and SSR.

## Requirements

### Functional
- Middleware detects locale from URL, cookie, `Accept-Language` header; redirects `/` → `/vi/` (default).
- Both `/vi/*` and `/en/*` render correctly with matching messages.
- Client components can use `useTranslations()` via provider.
- Server components can use `getTranslations()` directly.
- TypeScript autocomplete for translation keys.

### Non-Functional
- Zero runtime fetch for messages (compile-time `import()`)
- Hydration-safe (no client/server mismatch)
- File sizes < 200 lines each

## Architecture

```
apps/web/
├── i18n/
│   ├── routing.ts         # locales, defaultLocale, localePrefix
│   ├── request.ts         # getRequestConfig — loads shared messages
│   ├── navigation.ts      # locale-aware Link/useRouter wrappers
│   └── global.ts          # TS module augmentation
├── middleware.ts          # createMiddleware(routing)
├── next.config.ts         # withNextIntl plugin
├── app/
│   └── [locale]/
│       └── layout.tsx     # NextIntlClientProvider + html root
└── tsconfig.json          # allowArbitraryExtensions: true
```

## Related Code Files

### Create
- `apps/web/next.config.ts`
- `apps/web/middleware.ts`
- `apps/web/i18n/routing.ts`
- `apps/web/i18n/request.ts`
- `apps/web/i18n/navigation.ts`
- `apps/web/i18n/global.ts`
- `apps/web/app/[locale]/layout.tsx`

### Modify
- `apps/web/package.json` (add `next-intl`)
- `apps/web/tsconfig.json` (add `allowArbitraryExtensions: true`)

## Implementation Steps

### 1. Install next-intl
```bash
pnpm -F @hd-farm/web add next-intl
```

### 2. Create `apps/web/i18n/routing.ts`
```ts
import { defineRouting } from 'next-intl/routing';
import { LOCALES, DEFAULT_LOCALE } from '@hd-farm/shared/locales';

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});
```

### 3. Create `apps/web/i18n/request.ts`
```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (
    await import(`@hd-farm/shared/locales/${locale}.json`)
  ).default;

  return { locale, messages };
});
```

### 4. Create `apps/web/i18n/navigation.ts`
```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### 5. Create `apps/web/i18n/global.ts` (module augmentation)
```ts
import type en from '@hd-farm/shared/locales/en.json';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NextIntl {
    interface AppConfig {
      Messages: typeof en;
      Locale: 'vi' | 'en';
    }
  }
}

export {};
```

### 6. Create `apps/web/middleware.ts`
```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Exclude API, Next internals, and static files
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
```

### 7. Create `apps/web/next.config.ts`
```ts
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './i18n/request.ts',
  experimental: {
    createMessagesDeclaration: './i18n/messages.d.json.ts',
  },
});

const nextConfig: NextConfig = {
  transpilePackages: ['@hd-farm/shared'],
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
```

### 8. Update `apps/web/tsconfig.json`
Add to `compilerOptions`:
```json
{
  "compilerOptions": {
    "allowArbitraryExtensions": true
  }
}
```

### 9. Create `apps/web/app/[locale]/layout.tsx`
```tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 10. Verify build
```bash
pnpm -F @hd-farm/web type-check
pnpm -F @hd-farm/web build
```

## Todo List
- [x] `pnpm -F @hd-farm/web add next-intl`
- [x] Create `apps/web/i18n/routing.ts`
- [x] Create `apps/web/i18n/request.ts`
- [x] Create `apps/web/i18n/navigation.ts`
- [x] Create `apps/web/i18n/global.ts`
- [x] Create `apps/web/middleware.ts`
- [x] Create `apps/web/next.config.ts`
- [x] Add `allowArbitraryExtensions: true` to `apps/web/tsconfig.json`
- [x] Create `apps/web/app/[locale]/layout.tsx`
- [x] Run type-check + build; fix any warnings

## Success Criteria
- `pnpm -F @hd-farm/web build` succeeds
- Dev server (`pnpm -F @hd-farm/web dev`) redirects `/` → `/vi`
- `/en` renders with English messages; `/vi` renders with Vietnamese
- `useTranslations('common')` gives typed autocomplete for `save`, `cancel`, etc.
- No hydration warnings in browser console

## Risk Assessment
- **Shared package JSON import in Next build**: mitigate with `transpilePackages: ['@hd-farm/shared']` in `next.config.ts`
- **Matcher too broad** → static assets fall through middleware: default matcher already excludes `_next`, `_vercel`, files with extensions
- **`createMessagesDeclaration` path collision**: file generated at `./i18n/messages.d.json.ts` — add to `.gitignore` if desired
- **Dynamic import path with template literal**: Next supports this for build-time resolution when base dir + extension are static

## Security Considerations
- Middleware matcher explicitly excludes `/api/*` → API routes NOT gated by locale
- No cookie set outside next-intl's own (`NEXT_LOCALE`); respects browser preferences
- No runtime user-supplied paths reach `import()` statement

## Completion Notes

**Code Review:** APPROVED (2026-04-23, code-review-260423-1408-phase02-web-nextintl.md)

**Key Deviations from Plan:**
1. **Next.js pinned to 15.3.9** (vs. plan 15.5.15): Pragmatic workaround for monorepo React duplication bug causing `/404` prerender `useRef` null error. Temporary pin; track upstream for unpinning.
2. **pnpm.overrides added at root** (`react@19.1.0`, `react-dom@19.1.0`, `@types/react@^19.0.0`, `@types/react-dom@^19.0.0`): Previous `@types/react@~18.2.0` wrongly pinned and caused type mismatches. Overrides ensure monorepo type consistency.
3. **Dropped experimental flags:** Removed `createMessagesDeclaration` (redundant with `global.ts` type augmentation) and `serverActions.allowedOrigins` (YAGNI — login uses fetch-to-API). Reduces config bloat.

**Scope Beyond Plan:** Added `app/global-error.tsx` and `app/[locale]/not-found.tsx` to handle next-intl error boundaries per Next 15 SSG patterns. No functional impact; follows framework conventions.

## Next Steps
- Phase 03: create placeholder page + language switcher under `app/[locale]/`
