# Brainstorm Report: i18n Integration

**Date:** 2026-04-22  
**Branch:** khoatran/phase-1-2

---

## Problem Statement

Integrate i18n into HD-FARMS monorepo (Turborepo) supporting:
- **Apps**: Web (Next.js 15 App Router) + Mobile (Expo Router v4)
- **Languages**: Vietnamese (vi) + English (en)
- **Locale files**: Shared in `packages/shared/locales/`
- **Web routing**: URL prefix (`/vi/...`, `/en/...`)

---

## Evaluated Approaches

### Option A — next-intl (web) + i18next (mobile) + shared JSON ✅ CHOSEN
- Web: `next-intl@^4` — native RSC, Next.js 15 compat, excellent TS
- Mobile: `expo-localization` + `i18next@^24` + `react-i18next@^15`
- Shared: `packages/shared/locales/{en,vi}.json`
- Trade-off: 2 different APIs, but each is best-in-class for its platform

### Option B — i18next everywhere ❌ REJECTED
- next-i18next deprecated for App Router; RSC incompatible natively

### Option C — next-intl everywhere ❌ REJECTED
- Mobile support undocumented/untested; risky

---

## Final Solution

```
packages/shared/
  locales/
    en.json    ← shared translations (nested JSON)
    vi.json

apps/web/
  middleware.ts          ← next-intl locale routing + detection
  i18n/request.ts        ← getRequestConfig
  app/[locale]/          ← ALL routes wrapped here (breaking change)

apps/mobile/
  i18n/config.ts         ← i18next + expo-localization setup
```

### Locale JSON structure
```json
{
  "common": { "save": "Lưu", "cancel": "Hủy" },
  "auth": { "login": "Đăng nhập" },
  "animals": { "title": "Quản lý vật nuôi" }
}
```

---

## Key Risks

| Risk | Severity | Mitigation |
|---|---|---|
| App Router restructure (`app/[locale]/`) | High | Phase carefully, test all routes |
| 2 APIs for team | Low | Clear docs per platform |
| Missing translation keys | Low | i18next missing key handler |

---

## Implementation Phases (high-level)

1. Setup `packages/shared/locales/` with en.json + vi.json (skeleton)
2. Web: install next-intl, create middleware, restructure `app/[locale]/`
3. Web: add `NextIntlClientProvider`, migrate hardcoded strings
4. Mobile: install expo-localization + i18next, setup config
5. Mobile: migrate hardcoded strings
6. Add language switcher UI on both platforms

---

## Success Criteria

- URL `/vi/dashboard` and `/en/dashboard` work correctly on web
- Mobile detects device locale and falls back to en
- All user-facing strings externalized to locale JSON
- TypeScript autocomplete on translation keys
