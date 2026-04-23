# Code Review — Phase 02: Web next-intl Setup

**Verdict:** APPROVED with minor notes. Ready for Phase 03.

## Scope
- Files: 11 touched (i18n/, middleware, next.config, layouts, not-found, global-error, package.json, tsconfig, shared locales)
- LOC: 199 total across touched web files (under 200-line target overall, largest is middleware at 47)
- Build + type-check pass (13/13 static pages)

## Overall Assessment
Clean, minimal, KISS-aligned implementation. Plan success criteria met:
- `localePrefix: 'always'` + `generateStaticParams` → prerender works for both locales
- Middleware composes auth + i18n correctly (auth check first, i18n handler last)
- Provider nesting correct: `html > body > NextIntlClientProvider > Providers > children`
- `async params` awaited properly in Next 15 layout

## Critical Issues
None.

## High Priority
None.

## Medium Priority

**1. Middleware locale regex is hardcoded (`middleware.ts:13,18`).**
`/^\/(vi|en)/` duplicates `LOCALES` from shared. If a locale is added later, two places must change. Consider `new RegExp(\`^/(${routing.locales.join('|')})\`)` built once at module scope. Low urgency but a future footgun.

**2. `isPublicPath` matches by `startsWith` (`middleware.ts:14`).**
`/login-extra` would be treated as public. With only `/login` today this is fine; flag if public paths grow. Exact-match or bounded regex would be safer.

**3. Public-path strip does not handle bare `/vi` or `/en`.**
`/^\/(vi|en)/.replace` leaves `''` → falls to `'/'`. That works, but `/vienna` (hypothetical) would strip to `nna`. Add `(?=/|$)` to the regex to anchor the locale segment.

## Low Priority

**4. `global.ts` import path works but is non-obvious.**
`import type en from '@hd-farm/shared/locales/en'` relies on the `./locales/en` export mapping to `en.json`. TS resolves this via `allowArbitraryExtensions`. Adding an inline comment would help future maintainers.

**5. `suppressHydrationWarning` on `<html>` (`[locale]/layout.tsx:34`).**
Fine if `next-themes` is used downstream, but not strictly required yet. Leave as-is.

**6. `global-error.tsx` hardcodes `lang="vi"`.**
Acceptable fallback since locale context is unavailable in global error boundary.

## Justified Deviations (all acceptable)
- **#1 Drop `createMessagesDeclaration`** — correct; `global.ts` type augmentation provides the same autocomplete without generated files in git.
- **#2 Drop `serverActions.allowedOrigins`** — correct; login uses fetch-to-API. YAGNI.
- **#3 `MESSAGES[locale]` over dynamic import** — defensible; Phase 01 already bundles both. Trades tiny bundle bloat for simplicity and no edge-case `import()` path-resolution issues. DRY wins.
- **#4 Pin Next 15.3.9** — pragmatic workaround for the documented monorepo React duplication bug on /404 prerender. Document this in phase notes.
- **#5/6 pnpm.overrides** — correct. `@types/react ^19` matches runtime React 19.

## Security
- Middleware correctly short-circuits `/api/*` before the auth branch, so API routes are not gated by locale redirects. API auth must be enforced at route level.
- `AUTH_COOKIE` is HttpOnly + sameSite=strict + secure in prod — good.
- No user-supplied strings reach `import()`; static `MESSAGES[locale]` lookup.
- No secrets in config or locale JSON.

## Correctness
- `async params: Promise<{locale}>` + `await params` — correct for Next 15.
- `setRequestLocale(locale)` called before `getMessages()` — correct order.
- `generateStaticParams` returns both locales — SSG works.
- `not-found.tsx` (root) uses `'use client'` + `next/error` — reasonable workaround for the SSG null-dispatcher bug; document the cause in a code comment (already present).
- `[locale]/not-found.tsx` uses `useTranslations('notFound')` — relies on provider from parent layout, which renders because next-intl invokes `notFound()` AFTER `setRequestLocale`. Works as tested (build passes).

## Monorepo Hygiene
- `transpilePackages: ['@hd-farm/shared']` present → shared JSON imports transpile correctly.
- `packages/shared/package.json` exports map covers `./locales`, `./locales/en`, `./locales/vi` — consistent with `global.ts` and `request.ts`.
- All i18n files well under 200 lines.

## Positive Observations
- Well-commented edge cases (pass-through root layout, null-dispatcher workaround, global-error boundary rationale).
- YAGNI applied: dropped two experimental flags that add no value.
- Auth guard preserves `from` query param for post-login redirect — UX win.
- File structure matches plan architecture exactly.

## Recommended Actions (non-blocking)
1. Extract locale regex from `routing.locales` (Medium #1).
2. Anchor locale segment in path regex (Medium #3).
3. Add inline comment on `global.ts:1` explaining the export-map resolution.

## Unresolved Questions
1. Is the Next 15.3.9 pin temporary? Track upstream issue so it can be unpinned when the monorepo React dup bug is fixed.
2. Will `/api/*` routes ever need locale awareness (e.g., error messages in user's locale)? If yes, revisit matcher strategy in Phase 03+.
