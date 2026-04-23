---
title: "i18n Integration — Web + Mobile"
description: "Setup next-intl (web) + i18next (mobile) with shared locale JSON in packages/shared"
status: in-progress
priority: P1
effort: 5h
branch: khoatran/phase-1-2
tags: [i18n, web, mobile, next-intl, i18next, localization]
created: 2026-04-22
---

# i18n Integration — Web + Mobile

## Goal
Bootstrap bilingual UI (vi default, en fallback) for HD-FARMS monorepo. Web uses `next-intl@^4` with URL prefix routing (`/vi/...`, `/en/...`). Mobile uses `expo-localization` + `i18next@^23`. Shared locale JSON lives in `packages/shared/locales/`.

## Context
- Monorepo: Turborepo + pnpm workspaces
- Web: Next.js 15 App Router (empty — no source files yet)
- Mobile: Expo Router v4 (empty)
- API: Fastify, complete, untouched

## Research Reports
- `plans/reports/researcher-260422-1335-nextintl-v4-next15.md`
- `plans/reports/researcher-260422-1335-GH-1-expo52-i18next-setup.md`
- `plans/reports/brainstorm-260422-1327-GH-1-i18n-integration.md`

## Phases

| # | Phase | File | Effort | Status |
|---|-------|------|--------|--------|
| 1 | Shared locales (en.json + vi.json) | `phase-01-shared-locales.md` | 30m | complete |
| 2 | Web next-intl setup (middleware, routing, provider) | `phase-02-web-nextintl-setup.md` | 1.5h | complete |
| 3 | Web app structure + language switcher | `phase-03-web-app-structure.md` | 1h | complete |
| 4 | Mobile i18next + expo-localization setup | `phase-04-mobile-i18next-setup.md` | 1h | pending |
| 5 | Mobile app screens + language switcher | `phase-05-mobile-app-structure.md` | 1h | pending |

## Dependencies
- Phase 1 must complete before Phase 2 and Phase 4 (they import shared locales)
- Phase 2 → Phase 3 (structure depends on provider)
- Phase 4 → Phase 5 (screens depend on i18n config)
- Phase 2/3 and Phase 4/5 run in parallel after Phase 1

## Success Criteria
- `/vi/dashboard` and `/en/dashboard` render correctly on web
- Mobile auto-detects device locale, persists user choice, falls back to vi
- Translation keys fully typed on both platforms
- Zero hardcoded user-facing strings in bootstrap pages

## Breaking Changes
- None (new code; web/mobile apps are empty)

## Validation Log

### Session 1 — 2026-04-22
**Trigger:** Initial plan validation before implementation.
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Web URL prefix strategy: hiện plan dùng `localePrefix: 'always'` — mọi URL đều có prefix (/vi/dashboard, /en/dashboard). Bạn có muốn default locale (vi) vẫn duy trì prefix không?
   - Options: always: /vi/... và /en/... | as-needed: / và /en/...
   - **Answer:** always: /vi/... và /en/... (Recommended)
   - **Rationale:** Confirms `localePrefix: 'always'` in i18n/routing.ts. Every URL is explicitly scoped — no ambiguity, cleaner cache/CDN separation.

2. **[Assumptions]** Mobile: khi app khởi động, I18nProvider đọc AsyncStorage (async) nên có một khoảnh khắc trước khi locale được restore. Bạn muốn xử lý thế nào?
   - Options: Render cư trước, sau đó switch locale | Splash screen cho đến khi locale ready
   - **Answer:** Render cư trước, sau đó switch locale (Recommended)
   - **Rationale:** `ready` flag in I18nProvider already handles this. No extra Expo SplashScreen dependency needed.

3. **[Risks]** Metro config cho mobile (pnpm workspace): hiện plan để defer nếu bị lỗi. Bạn muốn xử lý sớm không?
   - Options: Thêm metro.config.js ngay trong Phase 4 | Defer — chỉ add nếu bị lỗi
   - **Answer:** Thêm metro.config.js ngay trong Phase 4 (Recommended)
   - **Rationale:** pnpm symlink resolution with Metro has known edge cases. Proactive setup prevents a hard blocker mid-phase.

#### Confirmed Decisions
- `localePrefix: 'always'`: all locales get URL prefix — confirmed
- Mobile cold-start: render with device locale immediately, apply persisted locale async — confirmed
- Metro config: add `metro.config.js` with `watchFolders` in Phase 4 — new action item

#### Action Items
- [ ] Phase 04: Add `apps/mobile/metro.config.js` with `watchFolders` pointing at `packages/shared`

#### Impact on Phases
- Phase 02: No change — localePrefix: 'always' already in plan.
- Phase 04: Add `metro.config.js` creation step + update todo/related files/architecture.
