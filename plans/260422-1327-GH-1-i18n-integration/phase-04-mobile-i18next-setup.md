# Phase 04 — Mobile i18next + expo-localization Setup

## Context Links
- Overview: `./plan.md`
- Research: `plans/reports/researcher-260422-1335-GH-1-expo52-i18next-setup.md`
- Depends on: `./phase-01-shared-locales.md`

## Overview
- **Date:** 2026-04-22
- **Priority:** P1
- **Status:** complete
- **Effort:** 1h
- **Description:** Install `expo-localization`, `i18next`, `react-i18next`, `@react-native-async-storage/async-storage` in `apps/mobile`. Initialize i18next synchronously at app startup using shared locale JSON; detect device locale; persist user selection; wire TypeScript module augmentation.

## Key Insights
- Init i18next **synchronously** at top of `_layout.tsx` (side-effect import) — prevents fallback text flash.
- `react: { useSuspense: false }` is **mandatory** for React Native (prevents suspense boundary errors).
- `getLocales()[0]?.languageCode` returns ISO 639-1 code (`'vi'`, `'en'`); must be validated against supported set.
- Persistence: AsyncStorage key `@hd-farms/locale` loaded in `I18nProvider` context; overrides device detection when set.
- TypeScript safety via `react-i18next` module augmentation pointing at shared `en.json` type.

## Requirements

### Functional
- On cold start: read AsyncStorage → if saved locale present, use it; else use device locale; else fall back to `vi`.
- `useTranslation()` hook works in any screen after `_layout.tsx` mounts.
- `useI18n().setLocale('en')` persists choice and updates UI immediately.
- Supported locales: `vi`, `en` (validated; unsupported device locales fall back to `vi`).

### Non-Functional
- i18next init is synchronous → no flicker of fallback strings
- Bundle impact < 200KB (i18next core + react-i18next)
- TypeScript autocomplete for translation keys

## Architecture

```
apps/mobile/
├── app/
│   └── _layout.tsx             # Imports i18n config (side effect), wraps with I18nProvider
├── i18n/
│   ├── config.ts               # i18next.init() — side-effect module
│   ├── i18n-context.tsx        # React context: locale + setLocale (persists to AsyncStorage)
│   └── supported-locales.ts    # Re-export LOCALES/DEFAULT_LOCALE from shared
└── types/
    └── i18next.d.ts            # Module augmentation for typed keys
```

## Related Code Files

### Create
- `apps/mobile/metro.config.js`
- `apps/mobile/i18n/config.ts`
- `apps/mobile/i18n/i18n-context.tsx`
- `apps/mobile/i18n/supported-locales.ts`
- `apps/mobile/types/i18next.d.ts`
- `apps/mobile/app/_layout.tsx`

### Modify
- `apps/mobile/package.json` (add deps)
- `apps/mobile/tsconfig.json` (include `types/*.d.ts`)

## Implementation Steps

### 1. Install dependencies
```bash
cd apps/mobile
npx expo install expo-localization @react-native-async-storage/async-storage
pnpm -F @hd-farm/mobile add i18next react-i18next
```

### 1b. Create `apps/mobile/metro.config.js`
<!-- Updated: Validation Session 1 - Add metro.config.js with watchFolders for pnpm workspace resolution -->
```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

### 2. Create `apps/mobile/i18n/supported-locales.ts`
```ts
export { LOCALES, DEFAULT_LOCALE, type Locale } from '@hd-farm/shared/locales';
export const LOCALE_STORAGE_KEY = '@hd-farms/locale';
```

### 3. Create `apps/mobile/i18n/config.ts` (side-effect init)
```ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from '@hd-farm/shared/locales/en.json';
import vi from '@hd-farm/shared/locales/vi.json';
import { LOCALES, DEFAULT_LOCALE, type Locale } from './supported-locales';

function resolveInitialLocale(): Locale {
  const device = getLocales()[0]?.languageCode;
  return (LOCALES as readonly string[]).includes(device ?? '')
    ? (device as Locale)
    : DEFAULT_LOCALE;
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: resolveInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  ns: ['translation'],
  defaultNS: 'translation',
  interpolation: { escapeValue: false },
  react: { useSuspense: false }, // MANDATORY for React Native
});

export default i18next;
```

### 4. Create `apps/mobile/i18n/i18n-context.tsx`
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  type Locale,
} from './supported-locales';

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => Promise<void>;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    (i18next.language as Locale) ?? DEFAULT_LOCALE,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (!cancelled && saved && (LOCALES as readonly string[]).includes(saved)) {
          await i18next.changeLanguage(saved);
          setLocaleState(saved as Locale);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    await i18next.changeLanguage(next);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
```

### 5. Create `apps/mobile/types/i18next.d.ts`
```ts
import 'react-i18next';
import type en from '@hd-farm/shared/locales/en.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}
```

### 6. Update `apps/mobile/tsconfig.json` include
```json
{
  "include": ["**/*.ts", "**/*.tsx", "types/**/*.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 7. Create `apps/mobile/app/_layout.tsx`
```tsx
import '@/i18n/config'; // side-effect: initializes i18next BEFORE any screen mounts
import { Stack } from 'expo-router';
import { I18nProvider } from '@/i18n/i18n-context';

export default function RootLayout() {
  return (
    <I18nProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </I18nProvider>
  );
}
```

### 8. Verify
```bash
pnpm -F @hd-farm/mobile type-check
pnpm -F @hd-farm/mobile dev
```

## Todo List
- [x] Install `expo-localization`, `@react-native-async-storage/async-storage` via `expo install`
- [x] Install `i18next`, `react-i18next` via pnpm
- [x] Create `apps/mobile/metro.config.js` with watchFolders for workspace resolution
- [x] Create `apps/mobile/i18n/supported-locales.ts`
- [x] Create `apps/mobile/i18n/config.ts`
- [x] Create `apps/mobile/i18n/i18n-context.tsx`
- [x] Create `apps/mobile/types/i18next.d.ts`
- [x] Update `apps/mobile/tsconfig.json` include list
- [x] Create `apps/mobile/app/_layout.tsx`
- [x] Run type-check; launch Expo dev server; verify no fallback flash

## Success Criteria
- `pnpm -F @hd-farm/mobile type-check` passes
- `t('common.save')` returns translated string at runtime
- Device locale detection works (set iOS/Android sim to Vietnamese → app shows vi)
- `useI18n().setLocale('en')` updates UI and persists across app restart
- Translation keys show typed autocomplete in VS Code

## Risk Assessment
- **Metro JSON import resolution** for workspace package: if fails, add `packagerOpts: { config: 'metro.config.js' }` with `watchFolders` pointing at `packages/shared`. Most pnpm-workspace Expo setups work out of the box when `@hd-farm/shared` has proper `exports`.
- **New Architecture (Hermes) compatibility**: research notes i18next is untested; stay on legacy build if issues appear.
- **AsyncStorage not cleared on reinstall** may cause stale persisted locale during dev — document for QA.
- **Fast Refresh doesn't reload JSON**: reload the app after editing `vi.json`/`en.json` in development.

## Security Considerations
- AsyncStorage is plaintext on iOS/Android — **do NOT store auth tokens or PII** in this context; only locale is stored here.
- `resolveInitialLocale()` validates device locale against allow-list → prevents arbitrary locale injection.
- No network calls for translations → no MITM risk on locale loading.

## Next Steps
- Phase 05: add tab layout, home screen, and language switcher UI.
