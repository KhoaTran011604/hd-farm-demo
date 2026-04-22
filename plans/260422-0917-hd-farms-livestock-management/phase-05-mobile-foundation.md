# Phase 05 — Mobile App Foundation + QR Scanner

## Context Links
- Mobile UX: `../reports/brainstorm-260421-1711-mobile-app-ui-ux-flow.md`
- Research: `../reports/researcher-expo-qr-260422.md`

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 4 days
- **Description**: Expo (React Native) bottom-tab app. Auth flow with SecureStore. Home (role-based), Zones list, QR Scanner (FAB), Animal Detail.

## Key Insights
- **Use `expo-camera` CameraView** — `expo-barcode-scanner` is DEPRECATED
- `react-native-bottom-sheet` v5 for scan result sheet
- Expo Router v3 file-based routing; groups `(auth)`, `(tabs)`
- SecureStore (iOS Keychain / Android Keystore) for JWT — NEVER AsyncStorage for tokens
- React Query + Axios (or `ky`) for data fetching
- QR scan debounce: unmount camera on sheet show to prevent re-scan storm

## Requirements

### Functional
- `/login` — email + password → SecureStore token
- `(tabs)` bottom nav: Home, Zones, [QR FAB center], Alerts, More
- **Home**:
  - Worker: today's tasks list (weigh X, vaccinate Y)
  - Manager: farm overview (total animals, alerts count, recent events)
- **Zones**: list zones → pens → animals drill-down
- **QR Scanner**: full-screen camera; on detect → `GET /animals/by-qr/:uuid` → bottom sheet with quick actions
- **Animal Detail**: all fields + quick actions (weigh, status change, record vaccination/disease — full in later phases)

### Non-Functional
- Offline-tolerant: cache last list via React Query persist (stretch goal, phase 2)
- Animations via `react-native-reanimated`
- Theming: light/dark auto

## Architecture
```
apps/mobile/
├── app/
│   ├── _layout.tsx                 (root + SecureStore token check)
│   ├── (auth)/login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx             (bottom tabs + center FAB)
│   │   ├── index.tsx               (Home)
│   │   ├── zones.tsx
│   │   ├── scan.tsx                (modal route, full-screen camera)
│   │   ├── alerts.tsx
│   │   └── more.tsx
│   └── animals/
│       └── [id].tsx
├── components/
│   ├── QrScanner.tsx               (CameraView wrapper)
│   ├── ScanResultSheet.tsx         (react-native-bottom-sheet)
│   ├── AnimalCard.tsx
│   └── ui/                         (shared primitives)
├── lib/
│   ├── api.ts                      (axios/ky with token interceptor)
│   ├── auth.ts                     (SecureStore wrapper)
│   └── query-client.ts
└── app.json                        (permissions: camera)
```

## Related Code Files

### Create
- All app/ routes
- `components/{QrScanner,ScanResultSheet,AnimalCard}.tsx`
- `components/ui/*` (Button, Input, Card, Badge — simple primitives)
- `lib/{api,auth,query-client}.ts`
- `app.json` permissions

## Implementation Steps

1. **Expo init**: `pnpm create expo-app` with TypeScript template; add `expo-router`
2. **Install**: `expo-camera`, `expo-secure-store`, `@gorhom/bottom-sheet@5`, `react-native-reanimated`, `@tanstack/react-query`, `axios`, `yup`
3. **app.json**: add camera permission (iOS `NSCameraUsageDescription`, Android `CAMERA`)
4. **SecureStore wrapper**: `saveToken`, `getToken`, `clearToken`
5. **API client**: axios interceptor attaches Bearer token from SecureStore
6. **Root `_layout.tsx`**: check token → redirect `(auth)/login` OR `(tabs)`
7. **Login screen**: form + POST → save token → router.replace `(tabs)`
8. **Tabs layout**: 5 tabs with center FAB opening `/scan` modal route
9. **Home screen**: fetch `/dashboard/my-tasks` OR `/dashboard/overview` based on role (new endpoint — add to api in this phase)
10. **Zones screen**: list zones → pens (nested sections) → animals
11. **Scan screen** (modal):
    - `useCameraPermissions()`, request on mount
    - `<CameraView onBarcodeScanned={...} barcodeScannerSettings={{barcodeTypes:['qr']}} />`
    - On scan: setDetectedCode, fetch animal, show BottomSheet
    - On sheet dismiss: reset, allow re-scan
12. **ScanResultSheet**: animal card + 3 quick action buttons (Weigh, Status, Go to detail)
13. **Animal detail**: scrollable with sections; quick actions at bottom
14. **Add API**: `GET /dashboard/my-tasks` (worker), `GET /dashboard/overview` (manager)
15. **Manual test on device + compile check**

## Todo List
- [ ] Expo scaffold + router v3
- [ ] Install camera + bottom-sheet + reanimated
- [ ] SecureStore auth flow
- [ ] Login screen
- [ ] Tabs layout with center FAB
- [ ] Home (role-based)
- [ ] Zones drill-down list
- [ ] QR Scanner with CameraView
- [ ] ScanResultSheet + quick actions
- [ ] Animal detail screen
- [ ] API: /dashboard/my-tasks + /overview
- [ ] Test on iOS + Android

## Success Criteria
- Login persists across app restart
- QR scan resolves to animal in <2s
- Bottom sheet dismisses cleanly; camera re-enables for next scan
- Worker sees tasks; manager sees overview — role-aware

## Risk Assessment
- **expo-camera API drift**: pin SDK version; `CameraView` API from SDK 50+
- **Scan storm**: freeze camera on first detection until sheet closed
- **SecureStore size limits**: tokens only (< 4KB); no large payloads

## Security Considerations
- JWT in SecureStore (iOS Keychain / Android EncryptedSharedPrefs)
- HTTPS enforced in production; `NSAppTransportSecurity` strict
- Camera permission denied → clear explanation + retry CTA

## Next Steps
- Phase 06 adds Weight + Status quick forms
- Phase 07 adds Alerts screen + vaccination quick form
- Later phases add Disease, Feeding, Reproduction quick forms
