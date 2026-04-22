# Phase 05 — Mobile App Structure + Language Switcher

## Context Links
- Overview: `./plan.md`
- Research: `plans/reports/researcher-260422-1335-GH-1-expo52-i18next-setup.md`
- Depends on: `./phase-04-mobile-i18next-setup.md`

## Overview
- **Date:** 2026-04-22
- **Priority:** P1
- **Status:** pending
- **Effort:** 1h
- **Description:** Bootstrap Expo Router tab layout, home/dashboard placeholder screen, and a language switcher component that uses `useI18n()` from phase 4. Validates end-to-end i18n pipeline on mobile.

## Key Insights
- Expo Router v4 groups: `(tabs)` = group folder, `_layout.tsx` inside = tab bar container.
- Tab screens render inside the tab layout; each screen file becomes a tab.
- `useTranslation()` from `react-i18next` gives `t()`; `useI18n()` from phase 4 gives `locale` + `setLocale()`.
- Switching locale triggers re-render of all screens using `useTranslation()` (subscribed to i18next events via `react-i18next`).
- Keep `Pressable` + inline styles for the switcher — no styling dependency yet (ui-styling epic comes later).

## Requirements

### Functional
- Bottom tab bar with at least one tab: `Home` (dashboard placeholder).
- Home screen displays translated title + subtitle.
- Language switcher component shows two buttons (Vietnamese / English); active locale is visually disabled.
- Tapping a language persists selection and updates the UI immediately.

### Non-Functional
- No hardcoded user-facing strings — all go through `t(key)`.
- Works on iOS simulator, Android emulator, and Expo Go.

## Architecture

```
apps/mobile/
├── app/
│   ├── _layout.tsx              # (from phase 4) root I18nProvider
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tab bar
│       └── index.tsx            # Home/Dashboard screen
└── components/
    └── language-switcher.tsx    # <LanguageSwitcher />
```

## Related Code Files

### Create
- `apps/mobile/app/(tabs)/_layout.tsx`
- `apps/mobile/app/(tabs)/index.tsx`
- `apps/mobile/components/language-switcher.tsx`

### Modify
- `packages/shared/locales/en.json` + `vi.json` — add `dashboard.title`, `dashboard.subtitle` if not yet present from phase 3, plus `tabs.home`, `common.switchLanguage/english/vietnamese` (already added in phase 3 — reuse).

## Implementation Steps

### 1. Confirm locale keys exist
Phase 3 already added `dashboard.*`, `common.switchLanguage/english/vietnamese`. Add `tabs.home` to both JSONs:

`vi.json`:
```json
"tabs": { "home": "Trang chủ" }
```

`en.json`:
```json
"tabs": { "home": "Home" }
```

### 2. Create `apps/mobile/components/language-switcher.tsx`
```tsx
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n/i18n-context';
import type { Locale } from '@/i18n/supported-locales';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18n();

  const options: Array<{ value: Locale; label: string }> = [
    { value: 'vi', label: t('common.vietnamese') },
    { value: 'en', label: t('common.english') },
  ];

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('common.switchLanguage')}
      style={{ flexDirection: 'row', gap: 8, padding: 16 }}
    >
      {options.map(({ value, label }) => {
        const active = value === locale;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled: active }}
            disabled={active}
            onPress={() => void setLocale(value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: active ? '#111' : '#e5e5e5',
            }}
          >
            <Text style={{ color: active ? '#fff' : '#111' }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

### 3. Create `apps/mobile/app/(tabs)/_layout.tsx`
```tsx
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home') }}
      />
    </Tabs>
  );
}
```

### 4. Create `apps/mobile/app/(tabs)/index.tsx`
```tsx
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '600' }}>
          {t('dashboard.title')}
        </Text>
        <Text style={{ fontSize: 16, color: '#666' }}>
          {t('dashboard.subtitle')}
        </Text>
      </View>
      <LanguageSwitcher />
    </ScrollView>
  );
}
```

### 5. Smoke test
```bash
pnpm -F @hd-farm/mobile type-check
pnpm -F @hd-farm/mobile dev
```
- Open iOS simulator (language = English) → screen shows English.
- Change device language to Vietnamese in sim settings, reload app → should show Vietnamese.
- Tap VI/EN buttons → UI updates immediately; restart app → persisted locale retained.

## Todo List
- [ ] Add `tabs.home` key to both `en.json` and `vi.json`
- [ ] Create `apps/mobile/components/language-switcher.tsx`
- [ ] Create `apps/mobile/app/(tabs)/_layout.tsx`
- [ ] Create `apps/mobile/app/(tabs)/index.tsx`
- [ ] Run `pnpm -F @hd-farm/mobile type-check`
- [ ] Launch on iOS + Android sim; verify language detection + switching + persistence

## Success Criteria
- Type-check passes; dev build runs on Expo Go
- Home screen displays `dashboard.title` + `dashboard.subtitle` correctly in current locale
- Language switcher toggles UI instantly
- Device-locale auto-detection works on cold start (no prior AsyncStorage entry)
- After switching + killing app, reopened app keeps previously selected locale

## Risk Assessment
- **Tab bar not re-rendering on locale change**: Tabs.Screen `title` is resolved at render time by `useTranslation()` — safe. If issues arise, force re-render via `key={locale}` on the Tabs container.
- **Expo Router warning about unused tab**: single-tab bar is fine for bootstrap; future phases add more tabs.
- **AsyncStorage race with i18next init**: `I18nProvider.useEffect` runs after first render — acceptable brief flash; consider splash screen later.

## Security Considerations
- No authenticated content in this phase; screens render for all users.
- Buttons only call `setLocale()` with validated allow-list from `supported-locales.ts` — no arbitrary input.
- No deep-linking routing added yet → no auth bypass vectors introduced.

## Next Steps
- Integrate real screens (auth, animals, farms) behind tabs; each will use `useTranslation()` per existing pattern.
- Follow-up epic: add language switcher to a settings screen rather than home.
- Consider splash screen to hide locale hydration flash once real UI content grows.

---

## Unresolved Questions (epic-wide)
- **i18next + New Architecture (Hermes)**: research flagged untested combo. Decide later whether to stay on legacy build.
- **Metro resolver for pnpm workspace JSON imports**: if `@hd-farm/shared/locales/en.json` fails to resolve at runtime, we may need a custom `metro.config.js` with `watchFolders` + `nodeModulesPaths`. Defer config until we hit the issue.
- **Missing-key handler strategy**: not yet defined for production (currently falls back to key string). Revisit once translation ownership process is set.
