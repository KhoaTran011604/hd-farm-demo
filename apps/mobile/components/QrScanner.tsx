import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface QrScannerProps {
  onScanned: (data: string) => void;
  active: boolean;
}

export function QrScanner({ onScanned, active }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const lastScan = useRef<string | null>(null);

  useEffect(() => {
    if (!active) {
      lastScan.current = null;
    }
  }, [active]);

  if (!permission) return <View style={styles.fill} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionView}>
        <Text style={styles.permissionText}>Camera access is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!active) return <View style={styles.fill} />;

  return (
    <CameraView
      style={styles.fill}
      facing="back"
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  permissionText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  permissionBtn: {
    backgroundColor: '#1a7f37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
