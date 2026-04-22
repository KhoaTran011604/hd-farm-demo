# Phase 01 — Shared Locales

## Context Links
- Overview: `./plan.md`
- Research: `plans/reports/brainstorm-260422-1327-GH-1-i18n-integration.md`

## Overview
- **Date:** 2026-04-22
- **Priority:** P1 (blocks phases 2 and 4)
- **Status:** pending
- **Effort:** 30m
- **Description:** Create `packages/shared/locales/en.json` and `vi.json` with skeleton namespace keys (common, auth, animals, farms, zones, pens, health). Export locale modules from the shared package so web and mobile can import them.

## Key Insights
- Both apps import locale JSON from the same shared package → single source of truth prevents drift.
- Nested JSON is preferred (namespaced `common.save`, `auth.login`) — matches next-intl + i18next defaults.
- Vietnamese is the default/primary locale; English is fallback.
- JSON files are compiled at build time; no runtime download overhead.

## Requirements

### Functional
- Two JSON files: `en.json`, `vi.json`
- Identical key structure; only values differ
- Skeleton namespaces cover phase 1-3 domains: `common`, `auth`, `animals`, `farms`, `zones`, `pens`, `health`
- Export accessible via `@hd-farm/shared/locales/en` and `@hd-farm/shared/locales/vi`

### Non-Functional
- File size under 200 lines each (skeleton only)
- Key naming: camelCase (matches codebase convention for JSON keys)

## Architecture

```
packages/shared/
├── locales/
│   ├── en.json       # English translations (skeleton)
│   ├── vi.json       # Vietnamese translations (skeleton)
│   └── index.ts      # Barrel export (locale type + maps)
├── src/
│   └── index.ts      # Add re-export of locales (optional)
└── package.json      # Add ./locales/* exports
```

## Related Code Files

### Create
- `packages/shared/locales/en.json`
- `packages/shared/locales/vi.json`
- `packages/shared/locales/index.ts`

### Modify
- `packages/shared/package.json` (add `exports` entries)

## Implementation Steps

### 1. Create `packages/shared/locales/vi.json` (default locale)

```json
{
  "common": {
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa",
    "edit": "Sửa",
    "create": "Tạo mới",
    "search": "Tìm kiếm",
    "loading": "Đang tải...",
    "confirm": "Xác nhận",
    "back": "Quay lại",
    "next": "Tiếp theo"
  },
  "auth": {
    "login": "Đăng nhập",
    "logout": "Đăng xuất",
    "register": "Đăng ký",
    "email": "Email",
    "password": "Mật khẩu",
    "forgotPassword": "Quên mật khẩu?"
  },
  "animals": {
    "title": "Quản lý vật nuôi",
    "list": "Danh sách vật nuôi",
    "add": "Thêm vật nuôi",
    "species": "Loài",
    "status": "Tình trạng"
  },
  "farms": {
    "title": "Trang trại",
    "list": "Danh sách trang trại",
    "name": "Tên trang trại"
  },
  "zones": {
    "title": "Khu vực",
    "list": "Danh sách khu vực"
  },
  "pens": {
    "title": "Chuồng",
    "list": "Danh sách chuồng"
  },
  "health": {
    "title": "Sức khỏe",
    "vaccination": "Tiêm phòng",
    "treatment": "Điều trị"
  }
}
```

### 2. Create `packages/shared/locales/en.json`

Identical key tree, English values:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "loading": "Loading...",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next"
  },
  "auth": {
    "login": "Log in",
    "logout": "Log out",
    "register": "Sign up",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?"
  },
  "animals": {
    "title": "Animals",
    "list": "Animal list",
    "add": "Add animal",
    "species": "Species",
    "status": "Status"
  },
  "farms": {
    "title": "Farms",
    "list": "Farm list",
    "name": "Farm name"
  },
  "zones": {
    "title": "Zones",
    "list": "Zone list"
  },
  "pens": {
    "title": "Pens",
    "list": "Pen list"
  },
  "health": {
    "title": "Health",
    "vaccination": "Vaccination",
    "treatment": "Treatment"
  }
}
```

### 3. Create `packages/shared/locales/index.ts`

```ts
import en from './en.json';
import vi from './vi.json';

export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

export const MESSAGES = { vi, en } as const;
export type Messages = typeof en;

export { en, vi };
```

### 4. Update `packages/shared/package.json` exports

Add to the existing `exports` block:

```json
"exports": {
  ".": "./src/index.ts",
  "./types": "./src/types/index.ts",
  "./validators": "./src/validators/index.ts",
  "./constants": "./src/constants/index.ts",
  "./locales": "./locales/index.ts",
  "./locales/en": "./locales/en.json",
  "./locales/vi": "./locales/vi.json"
}
```

### 5. Verify build
```bash
pnpm -C packages/shared type-check
```

## Todo List
- [ ] Create `packages/shared/locales/vi.json` with skeleton keys
- [ ] Create `packages/shared/locales/en.json` with matching keys
- [ ] Create `packages/shared/locales/index.ts` barrel export
- [ ] Update `packages/shared/package.json` exports map
- [ ] Run `pnpm -C packages/shared type-check` to verify
- [ ] Confirm JSON files validate (no trailing commas, matching keys)

## Success Criteria
- `@hd-farm/shared/locales/en` and `@hd-farm/shared/locales/vi` resolve in TypeScript
- `Locale`, `DEFAULT_LOCALE`, `MESSAGES`, `Messages` types exported
- All namespaces (`common`, `auth`, `animals`, `farms`, `zones`, `pens`, `health`) present in both files with identical keys
- `pnpm type-check` passes

## Risk Assessment
- **Key drift** between `en` and `vi`: mitigate by using shared `Messages` type derived from one file — compile-time error if they diverge
- **JSON import resolver in Next.js**: handled natively by Next 15, no config change needed
- **Expo/Metro JSON imports**: supported out of the box for static imports

## Security Considerations
- Locale JSON is public content (ships in app bundle); MUST NOT contain secrets, PII placeholders, or internal IDs
- No user input flows through translation keys in this phase

## Next Steps
- Phase 2 imports these JSON files in `apps/web/i18n/request.ts`
- Phase 4 imports them in `apps/mobile/i18n/config.ts`
