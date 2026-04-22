# Expo SDK 52/53 QR Code & Navigation Research
**Date**: 2026-04-22 | **Status**: SDK 52+ patterns validated

## 1. QR Code Scanning

**Decision: Use expo-camera (not deprecated expo-barcode-scanner)**

- `expo-barcode-scanner` was deprecated in SDK 50, removed in SDK 51
- `expo-camera` now provides all barcode scanning via `CameraView` component
- Supports iOS 16+ DataScannerViewController for native performance

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

export function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission?.granted) {
    return <Button onPress={requestPermission} title="Grant camera access" />;
  }

  return (
    <CameraView
      onBarcodeScanned={({ data }) => {
        console.log('QR Code:', data);
      }}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
    />
  );
}
```

**Key Props**: `barcodeScannerSettings` for format config; `onBarcodeScanned` callback returns `{ data, type, bounds }`

---

## 2. Expo Router v3 Bottom Tabs + FAB Center Button

**Pattern: Headless custom tab bar with centered action button**

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { height: 64, paddingBottom: 8 },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      {/* hidden from tab bar */}
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

function CustomTabBar({ state, navigation }) {
  const tabs = ['home', 'search', 'profile'];
  
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
      {tabs.slice(0, 1).map((route) => (
        <TabItem key={route} route={route} />
      ))}
      <Pressable
        onPress={() => navigation.navigate('scan')}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#007AFF',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: -20,
        }}
      >
        {/* FAB center button */}
      </Pressable>
      {tabs.slice(1).map((route) => (
        <TabItem key={route} route={route} />
      ))}
    </View>
  );
}
```

**Key**: Use custom `tabBar` prop with headless component; set `href: null` to hide scan route from tab bar

---

## 3. react-native-bottom-sheet

**Latest**: v5 (uses Reanimated v3 + Gesture Handler v2)

```typescript
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export function ScanResultSheet() {
  const snapPoints = useMemo(() => ['25%', '50%'], []);
  const bottomSheetModalRef = useRef(null);

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <BottomSheetModal ref={bottomSheetModalRef} snapPoints={snapPoints}>
          <Text>Scan Result: {scannedData}</Text>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

**Install**: `npm i @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler`

---

## 4. expo-camera Permissions (iOS + Android)

**Unified API via `useCameraPermissions` hook**

```typescript
import { useCameraPermissions } from 'expo-camera';

function CameraScreen() {
  const [status, requestPermission] = useCameraPermissions();

  useEffect(() => {
    // Auto-request on iOS; manual on Android
    if (!status?.granted && status?.canAskAgain) {
      requestPermission();
    }
  }, [status]);

  // iOS: requires Info.plist key
  // Android: auto-added to AndroidManifest.xml
  // Both: system prompt on first CameraView mount
}
```

**Platform Notes**:
- **iOS**: Add `NSCameraUsageDescription` to Info.plist
- **Android**: Permission auto-added; use `tools:node="remove"` in manifest to exclude
- **Known Issue (2025)**: Permission state not always updated after iOS prompt—re-mount CameraView if needed

---

## 5. Turborepo + pnpm + Expo Metro Config

**Metro auto-detects pnpm; configure symlinks for React Native ≥0.72**

```typescript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
  // Pnpm symlink support
  resolver: {
    useSourceMaps: false,
    enablePackageExports: true,
    nodeModulesPaths: [
      require.resolve('pnpm').replace('/index.js', '/node_modules'),
    ],
  },
  watchFolders: [
    // Watch monorepo packages
    require('path').resolve(__dirname, '../../packages'),
    // Pnpm virtual store
    require('path').resolve(__dirname, '../../node_modules/.pnpm'),
  ],
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        if (req.url.includes('__debuggerWorker')) {
          res.end('OK');
        } else {
          middleware(req, res, next);
        }
      };
    },
  },
});
```

**Monorepo Structure**:
```
root/
├── pnpm-workspace.yaml
├── turbo.json
├── apps/
│   └── mobile/          # Expo app
├── packages/
│   └── shared/          # Shared code
└── metro.config.js
```

**EAS Build Note**: EAS internally assumes Yarn; pnpm requires workaround config.

---

## Unresolved Questions

1. **Bottom sheet modal dismissal** on barcode scan—gesture handler priority in tab-based navigation?
2. **EAS build** pnpm workspace handling—does SDK 52+ improve support or still Yarn-first?
3. **iOS 16+ DataScanner** activation—automatic or explicit opt-in in expo-camera v14+?

## Sources

- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Deprecation: barcode-scanner→expo-camera](https://github.com/expo/fyi/blob/main/barcode-scanner-to-expo-camera.md)
- [Expo Router Custom Tabs](https://docs.expo.dev/router/advanced/custom-tabs/)
- [react-native-bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/)
- [Expo Permissions Guide](https://docs.expo.dev/guides/permissions/)
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/)
- [Turborepo+pnpm+Expo Setup](https://medium.com/code-sense/how-i-finally-got-a-react-native-monorepo-working-with-turbo-pnpm-and-an-expo-shell-after-c8afd85522ea)
- [React Native Bottom Sheet](https://github.com/gorhom/react-native-bottom-sheet)
- [expo-monorepo-example](https://github.com/byCedric/expo-monorepo-example)
