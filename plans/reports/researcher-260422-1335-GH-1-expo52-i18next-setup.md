# Research Report: i18next + react-i18next + expo-localization Setup for Expo 52

**Date:** 2026-04-22 | **Expo Target:** 52 (~52.x) | **React Native:** 0.76+ | **Expo Router:** v4

---

## Executive Summary

i18next + react-i18next + expo-localization form stable trio for Expo 52. No known breaking changes in v23+ i18next with React Native 0.76. Patterns: initialize i18next in root `_layout.tsx`, use `expo-localization` getLocales() for device detection, implement AsyncStorage-backed language switcher via context provider. TypeScript support requires module augmentation or type-generation tooling.

---

## Compatible Versions

| Package | Recommended | Notes |
|---------|------------|-------|
| `expo-localization` | ^14.0.0 | Official Expo SDK 52 support |
| `i18next` | ^23.0.0+ | Latest v24 stable; TypeScript v5+ only |
| `react-i18next` | ^14.0.0+ | Pairs with i18next v23+ |
| `@react-native-async-storage/async-storage` | ^1.21.0+ | For locale persistence |

**Install:** `npx expo install expo-localization react-i18next i18next @react-native-async-storage/async-storage`

---

## 1. Device Locale Detection

```typescript
// src/libs/i18n/index.ts
import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Detect device language
const deviceLanguage = getLocales()[0]?.languageCode || 'en';

// Load translation JSON from packages/shared/locales/
import en from '../../../packages/shared/locales/en.json';
import ja from '../../../packages/shared/locales/ja.json';

i18next
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ja: { translation: ja } },
    fallbackLng: 'en',
    lng: deviceLanguage,
    interpolation: { escapeValue: false },
  });
```

---

## 2. Expo Router v4 Integration

Wrap root `_layout.tsx` with i18n import—triggers initialization before screens render:

```typescript
// app/_layout.tsx
import '../libs/i18n'; // Import first, side effect only
import { I18nProvider } from '../context/i18n-context';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <I18nProvider>
      <Stack />
    </I18nProvider>
  );
}
```

**Critical:** Import i18n module at top; do NOT use `React.lazy()` or dynamic imports—breaks locale detection on app load.

---

## 3. Runtime Language Switcher (Context Pattern)

```typescript
// src/context/i18n-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import i18next from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface I18nContextType {
  locale: string;
  setLocale: (lang: string) => Promise<void>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('locale');
      if (saved) {
        setLocaleState(saved);
        await i18next.changeLanguage(saved);
      }
    })();
  }, []);

  const setLocale = async (lang: string) => {
    await i18next.changeLanguage(lang);
    await AsyncStorage.setItem('locale', lang);
    setLocaleState(lang);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
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

---

## 4. TypeScript Type Safety

### Module Augmentation (Minimal Approach)

```typescript
// src/types/i18next.d.ts
import 'react-i18next';
import en from '../../../packages/shared/locales/en.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}
```

### Type-Safe Translation Hook

```typescript
// In component
const { t } = useTranslation();
// ✓ t('key') is type-checked against JSON structure
// ✗ t('invalid.key') → TypeScript error
```

**Requires TypeScript v5+.** For auto-generation from JSON, use `i18next-resources-for-ts` CLI.

---

## 5. Loading Translations from Shared Package

**File structure:**
```
packages/shared/locales/
  ├── en.json
  └── ja.json
```

**Import pattern (relative path):**
```typescript
import en from '../../../packages/shared/locales/en.json';
import ja from '../../../packages/shared/locales/ja.json';
```

**For pnpm workspaces,** ensure shared package is referenced in root `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

---

## 6. Use Translation Hook in Expo Router Screens

```typescript
// app/home.tsx
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('welcome')}</Text>
      {/* Key must exist in en.json/ja.json */}
    </View>
  );
}
```

---

## 7. Expo 52 / Expo Router v4 Gotchas

| Gotcha | Issue | Solution |
|--------|-------|----------|
| **Lazy locale init** | Screens render before i18next initialized; fallback text flashes | Import i18n at root `_layout.tsx` top; ensure synchronous init |
| **AsyncStorage timing** | Saved locale not applied on cold start | Init locale in Context useEffect BEFORE rendering children |
| **Module augmentation order** | TS compiler can't resolve types | Place `i18next.d.ts` in `src/types/`, import in `tsconfig.json` → `typeRoots` |
| **New Architecture (Hermes)** | i18next untested on New Architecture | Use legacy build; track upstream [React Native Directory](https://reactnative.directory/?search=i18next) |
| **Hot reload stale translations** | Fast refresh doesn't reload JSON | Use expo-dev-client or reload whole app; workaround: dev mode only |

---

## 8. Minimal i18next Config (Expo 52 Recommended)

```typescript
i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, ja: { translation: ja } },
  fallbackLng: 'en',
  lng: getLocales()[0]?.languageCode || 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  interpolation: { escapeValue: false },
  react: { useSuspense: false }, // ← Mandatory for RN; prevents suspense boundary issues
});
```

**Key:** `useSuspense: false` prevents Suspense boundary errors in React Native.

---

## Sources & References

- [Expo Localization Documentation](https://docs.expo.dev/versions/latest/sdk/localization/)
- [react-i18next Official Docs](https://react.i18next.com/)
- [i18next TypeScript Integration](https://www.i18next.com/overview/typescript)
- [Medium: i18next + Expo Router Setup](https://medium.com/@vandetho/an-easy-to-internationalize-your-mobile-app-using-expo-router-and-i18next-react-4b13a408b52c)
- [Implementing i18next + expo-localization](https://medium.com/@kgkrool/implementing-internationalization-in-expo-react-native-i18next-expo-localization-8ed810ad4455)
- [Better i18n Expo Guide](https://better-i18n.com/en/i18n/expo/)
- [Phrase: React Native Localization Guide](https://phrase.com/blog/posts/react-native-i18n-with-expo-and-i18next-part-1/)

---

## Unresolved Questions

- New Architecture (Hermes) support status for i18next—check React Native Directory monthly
- Performance impact of JSON imports vs. dynamic loading for large translation files
- Best practice for encrypting sensitive translations in AsyncStorage
