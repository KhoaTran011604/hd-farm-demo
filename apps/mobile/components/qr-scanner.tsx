import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';

interface QrScannerProps {
  onScanned: (data: string) => void;
  active: boolean;
  torch?: boolean;
}

export function QrScanner({ onScanned, active, torch = false }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const lastScan = useRef<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!active) lastScan.current = null;
  }, [active]);

  if (!permission) return <View style={styles.fill} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionView}>
        <Text style={styles.permissionText}>{t('scan.permissionRequired')}</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>{t('scan.grantPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!active) return <View style={styles.fill} />;

  return (
    <CameraView
      style={styles.fill}
      facing="back"
      enableTorch={torch}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={({ data }) => {
        if (lastScan.current === data) return;
        lastScan.current = data;
        onScanned(data);
      }}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  permissionView: {
    flex: 1,
    backgroundColor: '#0D1A06',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  permissionText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  permissionBtn: {
    backgroundColor: '#1A3009',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
