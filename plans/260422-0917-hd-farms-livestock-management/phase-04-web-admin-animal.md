# Phase 04 — Web Admin: Auth + Animal Management

## Context Links
- Web UX: `../reports/brainstorm-260421-1711-web-admin-ui-ux-flow.md`
- shadcn/ui: https://ui.shadcn.com

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 3 days
- **Description**: Next.js 14 App Router web admin with login, sidebar layout, animal list (table + filters + pagination), animal detail (6 tabs skeleton), animal create form, QR printing.

## Key Insights
- Use App Router server components for initial list render; client components only for interactive bits
- Auth: store JWT in httpOnly cookie via `/api/auth/login` proxy route (not localStorage)
- React Query (TanStack) for client-side mutations + cache
- shadcn/ui Table + DataTable pattern with TanStack Table
- QR code print: `qrcode` → SVG → print page with CSS `@media print`

## Requirements

### Functional
- `/login` — email + password form → set cookie, redirect
- `/` dashboard placeholder (full dashboard in Phase 12)
- `/animals` — table with filters (status, zone, pen, batch), cursor pagination, row click → detail
- `/animals/new` — create form (zone/pen select, animal type, DOB, weight, tag)
- `/animals/[id]` — 6 tabs: Overview, Health, Vaccination, Disease, Feeding, Reproduction (only Overview fully wired)
- `/animals/[id]/qr` — print-optimized QR page
- Sidebar nav: Dashboard, Animals, Batches, Zones, Config, Users, Reports (some placeholder)

### Non-Functional
- SSR-first where safe, client interaction for mutations
- Dark mode via `next-themes`
- Responsive from 1024px up (admin is desktop-first)

## Architecture
```
apps/web/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              (sidebar + header)
│   │   ├── page.tsx                (dashboard placeholder)
│   │   ├── animals/
│   │   │   ├── page.tsx            (list)
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx        (detail with 6 tabs)
│   │   │       └── qr/page.tsx     (print)
│   │   └── ...
│   └── api/
│       ├── auth/login/route.ts     (proxy → Fastify)
│       └── auth/logout/route.ts
├── components/
│   ├── ui/                         (shadcn/ui)
│   ├── animals/
│   │   ├── AnimalTable.tsx
│   │   ├── AnimalFilters.tsx
│   │   ├── AnimalForm.tsx
│   │   └── AnimalTabs.tsx
│   └── layout/{Sidebar,Breadcrumb}.tsx
├── lib/
│   ├── api.ts                      (fetch wrapper, auto-attach JWT cookie)
│   ├── query-client.ts
│   └── auth.ts                     (cookie helpers)
└── middleware.ts                   (redirect if no JWT cookie)
```

## Related Code Files

### Create
- All app/ routes above
- `components/ui/*` (shadcn init + button, input, table, tabs, badge, dialog, form)
- `components/animals/*`
- `components/layout/*`
- `lib/{api,auth,query-client}.ts`
- `middleware.ts`

### Modify
- `apps/web/next.config.js` — transpile packages/shared
- `apps/web/tailwind.config.ts` — shadcn preset

## Implementation Steps

1. **Next.js init**: `pnpm create next-app@latest --ts --tailwind --app --src-dir=false`
2. **shadcn init**: `pnpm dlx shadcn@latest init`; add components: button, input, form, table, tabs, select, badge, dialog, toast, skeleton
3. **Tailwind** + dark mode via `next-themes`
4. **API wrapper** (`lib/api.ts`): fetch with credentials, attach JWT from cookie, parse JSON errors
5. **Auth proxy routes**: `/api/auth/login` POSTs to Fastify, sets httpOnly cookie; logout clears it
6. **Middleware**: redirect to `/login` if `auth_token` cookie missing
7. **Dashboard layout**: sidebar (nav) + header (breadcrumb + user menu + logout)
8. **Login page**: Form with Yup + react-hook-form → POST proxy → redirect
9. **Animals list**:
   - Server component: initial fetch via cookie-forwarded fetch
   - Client component: `AnimalTable` uses TanStack Table + react-query for filters/pagination
   - Status badge component with color map
10. **Animal filters**: zone/pen selects, status multi-select, batch select
11. **Animal create form**: react-hook-form + yupResolver; zone → filter pens cascade
12. **Animal detail**: 6 tabs component; Overview shows all fields; others show placeholder "Coming in Phase N"
13. **QR print page**: hidden layout, large QR via `qrcode` SVG, animal tag + ID printed below
14. **Toast notifications** for mutations (create/update status)
15. **Compile + manual test** — login → list → create → detail → print QR

## Todo List
- [ ] Next.js + Tailwind + shadcn scaffold
- [ ] Auth proxy routes + middleware
- [ ] Sidebar + breadcrumb layout
- [ ] Login page with Yup validation
- [ ] Animals list + filters + pagination
- [ ] Animals create form
- [ ] Animals detail (6 tabs, Overview wired)
- [ ] QR print page
- [ ] Dark mode toggle
- [ ] Compile + lint check

## Success Criteria
- Login → redirect to dashboard; logout clears cookie
- Animals table paginates, filters apply, status badge colors correct
- Create form validates + creates animal + toasts success
- Clicking row → detail; tabs switch; QR page prints cleanly

## Risk Assessment
- **App Router SSR + cookies**: use `next/headers` cookies() in server components
- **shadcn + Next 14 version skew**: pin versions
- **Large animal list**: virtualize table if >500 rows visible (not needed with cursor pagination, but watch)

## Security Considerations
- JWT in httpOnly, SameSite=Strict, Secure in production
- CSRF: SameSite cookie + POST-only mutation routes (no GET mutations)
- XSS: React escapes by default; sanitize rich text if ever added

## Next Steps
- Phase 06 fills Health tab
- Phase 07 fills Vaccination tab + adds alert widget
- Phase 12 replaces dashboard placeholder with KPI cards
