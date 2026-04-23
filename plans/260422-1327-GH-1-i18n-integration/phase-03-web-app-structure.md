# Phase 03 — Web App Structure + Language Switcher

## Context Links
- Overview: `./plan.md`
- Research: `plans/reports/researcher-260422-1335-nextintl-v4-next15.md`
- Depends on: `./phase-02-web-nextintl-setup.md`

## Overview
- **Date:** 2026-04-22
- **Priority:** P1
- **Status:** complete
- **Effort:** 1h
- **Description:** Create initial page scaffolding under `app/[locale]/`, add a `LanguageSwitcher` client component using next-intl's `Link`/`useRouter`, and a locale-aware 404 page. Validates the full i18n pipeline end to end.

## Key Insights
- Server Components use `getTranslations()` (async, no provider).
- Client Components use `useTranslations()` + rely on the provider wired in phase 2.
- `Link` from `@/i18n/navigation` preserves current locale automatically.
- `useRouter().replace({ pathname }, { locale: 'en' })` switches locale while staying on current path.
- `not-found.tsx` at `[locale]/` level gets the locale from the layout's provider.

## Requirements

### Functional
- `/vi/` and `/en/` render a placeholder dashboard with translated heading + subtitle.
- Language switcher button toggles locale and navigates to the equivalent path in the other locale.
- 404 page ("Not found") renders in the current locale.

### Non-Functional
- All user-facing strings come from locale JSON
- No client-side re-fetch of messages when switching locales (handled by full page navigation)

## Architecture

```
apps/web/
├── app/
│   └── [locale]/
│       ├── layout.tsx        # (from phase 2)
│       ├── page.tsx          # Server component: dashboard placeholder
│       └── not-found.tsx     # Locale-aware 404
├── components/
│   └── language-switcher.tsx # Client component using next-intl navigation
```

## Related Code Files

### Create
- `apps/web/app/[locale]/page.tsx`
- `apps/web/app/[locale]/not-found.tsx`
- `apps/web/components/language-switcher.tsx`

### Modify
- `apps/web/app/[locale]/layout.tsx` (mount `<LanguageSwitcher />` in body)
- `packages/shared/locales/en.json` + `vi.json` — add `dashboard.title`, `dashboard.subtitle`, `common.notFound`, `common.switchLanguage`, `common.english`, `common.vietnamese` keys

## Implementation Steps

### 1. Extend shared locales
Add to both `en.json` and `vi.json` under existing namespaces.

`vi.json`:
```json
"common": {
  ...existing,
  "notFound": "Không tìm thấy trang",
  "switchLanguage": "Đổi ngôn ngữ",
  "english": "Tiếng Anh",
  "vietnamese": "Tiếng Việt"
},
"dashboard": {
  "title": "Bảng điều khiển",
  "subtitle": "Chào mừng đến với HD-FARMS"
}
```

`en.json` mirrors with English values (`"Not found"`, `"Switch language"`, `"English"`, `"Vietnamese"`, `"Dashboard"`, `"Welcome to HD-FARMS"`).

### 2. Create `apps/web/app/[locale]/page.tsx`
```tsx
import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  await params; // ensures locale is settled
  const t = await getTranslations('dashboard');

  return (
    <main style={{ padding: 24 }}>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </main>
  );
}
```

### 3. Create `apps/web/components/language-switcher.tsx`
```tsx
'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

type Locale = 'vi' | 'en';

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (next: Locale) => {
    if (next === currentLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <nav aria-label={t('switchLanguage')} style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        disabled={isPending || currentLocale === 'vi'}
        onClick={() => handleSwitch('vi')}
      >
        {t('vietnamese')}
      </button>
      <button
        type="button"
        disabled={isPending || currentLocale === 'en'}
        onClick={() => handleSwitch('en')}
      >
        {t('english')}
      </button>
    </nav>
  );
}
```

### 4. Create `apps/web/app/[locale]/not-found.tsx`
```tsx
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('common');

  return (
    <main style={{ padding: 24 }}>
      <h1>{t('notFound')}</h1>
    </main>
  );
}
```

### 5. Mount switcher in root layout
Update `apps/web/app/[locale]/layout.tsx` body:
```tsx
<NextIntlClientProvider locale={locale} messages={messages}>
  <LanguageSwitcher />
  {children}
</NextIntlClientProvider>
```
Add import: `import { LanguageSwitcher } from '@/components/language-switcher';`

### 6. Verify
```bash
pnpm -F @hd-farm/web dev
```
Visit `http://localhost:3000/` → should redirect to `/vi`. Click English button → goes to `/en`. Visit `/vi/xyz` → locale-aware 404.

## Todo List
- [x] Add `dashboard.*` + `common.notFound/switchLanguage/english/vietnamese` keys to both locale JSONs
- [x] Create `apps/web/app/[locale]/page.tsx`
- [x] Create `apps/web/components/language-switcher.tsx`
- [x] Create `apps/web/app/[locale]/not-found.tsx`
- [x] Mount `<LanguageSwitcher />` in `[locale]/layout.tsx`
- [x] Smoke test dev server: `/` → `/vi`, switcher, 404

## Success Criteria
- `/` redirects to `/vi/` (default locale)
- `/vi/` renders Vietnamese; `/en/` renders English
- Clicking language switcher navigates between locales without full page flash
- `/vi/does-not-exist` renders Vietnamese 404; `/en/does-not-exist` renders English 404
- `pnpm -F @hd-farm/web build` succeeds

## Risk Assessment
- **Hydration mismatch** on `<html lang>`: mitigated by `setRequestLocale(locale)` in layout (phase 2)
- **Button onClick race**: `useTransition` guards against stale locale during route change
- **Stale client cache after switch**: next-intl's `useRouter` triggers full server render — messages reload automatically

## Security Considerations
- `router.replace(pathname, ...)` only accepts internal pathname; no open-redirect risk
- Buttons are buttons, not links to arbitrary URLs — no XSS via locale param
- `notFound()` in layout (phase 2) prevents serving unknown-locale paths

## Next Steps
- Mobile side (phases 4-5) runs in parallel; no further web work needed in this epic.
- Follow-up (future epic): migrate real feature pages (animals, farms) onto `[locale]/` namespace.
