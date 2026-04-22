# next-intl v4 + Next.js 15 Setup Research

## Package Versions (Confirmed)

**next-intl**: v4.9.1 (stable, Apr 10 2026) | **Next.js**: 15.x | **React**: 19.x
**Installation**: `pnpm add next-intl`

## 1. Installation & Dependencies

No conflicts with pnpm workspaces. Installs as `next-intl` (single package, no peer-install splits).
Peer deps: Next.js ≥15.2, React ≥19.0. TypeScript config: set `allowArbitraryExtensions: true` for `.d.json.ts` message files.

## 2. Required File Structure

```
src/
├── i18n/
│   ├── routing.ts           # locales, defaultLocale, localePrefix
│   ├── request.ts           # getRequestConfig() function  
│   └── navigation.ts        # (optional) locale-aware Link/redirect
├── middleware.ts            # (Next.js 15 only; v16+ uses proxy.ts)
├── app/
│   └── [locale]/
│       ├── layout.tsx       # Root layout wraps with NextIntlClientProvider
│       ├── page.tsx
│       └── ...
└── messages/
    ├── en.json              # { "key": "value" }
    └── vi.json
```

## 3. Minimal middleware.ts (URL prefix routing /vi/..., /en/...)

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
```

**What it does**: Detects locale from URL prefix → redirects to `/[locale]/` → negotiates fallback (cookies, Accept-Language header).

## 4. routing.ts & getRequestConfig Pattern

```typescript
// src/i18n/routing.ts
export const routing = {
  locales: ['en', 'vi'],
  defaultLocale: 'en',
  localePrefix: 'always'  // Force /en/... /vi/... for all routes
};

// src/i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = requestLocale || routing.defaultLocale;
  
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

**v4 API**: `getRequestConfig()` runs once per request, server-side. Automatic async import of messages. Hydration-safe.

## 5. Server Components (useTranslations + getTranslations)

```typescript
// app/[locale]/page.tsx (Server Component by default)
import {getTranslations} from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations();
  return <h1>{t('home.title')}</h1>;
}
```

**No Provider needed** for Server Components. `getTranslations()` is async, uses request context.

## 6. Client Components (NextIntlClientProvider)

```typescript
// app/[locale]/layout.tsx
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';

export default async function Layout({children, params}) {
  const locale = (await params).locale;
  const messages = await getMessages({locale});

  return (
    <html>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Client Component Hook**:
```typescript
// components/Counter.tsx (Client Component)
'use client';
import {useTranslations} from 'next-intl';

export function Counter() {
  const t = useTranslations();
  return <button>{t('counter.label')}</button>;
}
```

**Pattern**: Messages passed from Server Layout → automatically inherited by nested Client Components via Context.

## 7. TypeScript Type Generation

**Enable in next.config.ts**:
```typescript
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts', {
  createMessagesDeclaration: true  // Generates .d.json.ts for messages
});
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "allowArbitraryExtensions": true
  }
}
```

**Augment types** (optional, for stricter autocomplete):
```typescript
// src/i18n/global.ts
import type {Config} from 'next-intl';

declare global {
  namespace NextIntl {
    interface AppConfig extends Config<typeof import('../messages/en.json')> {}
  }
}
```

Auto-generated `.d.json.ts` files provide full key autocomplete in `t('key')` calls.

## 8. Next.js 15 / React 19 Gotchas

**✓ Confirmed Fixed in v4.9.1**:
- Removed deprecated `ReactNodeArray` (was breaking in React 19)
- Next.js 15 explicitly in peer dependencies
- `params` in layout/page are now **Promises** → **must `await params`** before accessing

**Hydration Edge Case**: With `localePrefix: 'always'` + static rendering, initial `usePathname()` may mismatch client/server. Use `useRouter()` for navigation, let middleware handle redirects.

**Caching Change** (Next.js 15+): Fetch requests no longer cached by default. Message imports via `await import(...)` in `getRequestConfig` are fine (compiled at build).

## Summary

next-intl v4.9.1 is production-ready for Next.js 15 + React 19. URL prefix routing (/vi/, /en/) requires minimal config: 3 files (middleware.ts, routing.ts, request.ts) + [locale] folder + Provider in root layout. Server Components async-first (no Provider). Client Components inherit messages automatically. TypeScript types optional but recommended.

---

## Sources

- [next-intl.dev – Official Documentation](https://next-intl.dev/)
- [next-intl Getting Started: App Router](https://next-intl.dev/docs/getting-started/app-router)
- [next-intl Middleware Docs](https://next-intl.dev/docs/routing/middleware)
- [next-intl Routing Setup](https://next-intl.dev/docs/routing/setup)
- [next-intl Configuration & TypeScript](https://next-intl.dev/docs/configuration)
- [next-intl TypeScript Workflows](https://next-intl.dev/docs/workflows/typescript)
- [next-intl GitHub – v4 Support](https://github.com/amannn/next-intl/issues/1075)
- [next-intl npm – v4.9.1](https://www.npmjs.com/package/next-intl)
- [Build with Matija – Next.js 15 Setup Guide](https://www.buildwithmatija.com/blog/nextjs-internationalization-guide-next-intl-2025)
