import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { QrScanner } from '../../components/qr-scanner';
import { ScanResultSheet } from '../../components/scan-result-sheet';
import type { Animal } from '../../lib/types';

type ScannedAnimal = Pick<Animal, 'id' | 'name' | 'species' | 'status' | 'qrCode'> & {
  penName?: string;
  zoneName?: string;
};

export default function ScanScreen() {
  const router = useRouter();
  const [scannedUuid, setScannedUuid] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: animal, isLoading, isError } = useQuery<ScannedAnimal>({
    queryKey: ['animal-by-qr', scannedUuid],
    queryFn: () => api.get(`/animals/by-qr/${scannedUuid}`).then((r) => r.data),
    enabled: !!scannedUuid,
    retry: false,
  });

  const handleScanned = useCallback((data: string) => {
    setScannedUuid(data);
    setSheetOpen(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setSheetOpen(false);
    setScannedUuid(null);
  }, []);

  const cameraActive = !sheetOpen;

  return (
    <View style={styles.screen}>
      <QrScanner onScanned={handleScanned} active={cameraActive} />

      {cameraActive ? (
        <>
          <View style={styles.overlay}>
            <View style={styles.viewfinder} />
          </View>
          <View style={styles.hint}>
            <Text style={styles.hintText}>Point camera at an animal QR code</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {isLoading && scannedUuid ? (
        <View style={styles.fetchOverlay}>
          <Text style={styles.fetchText}>Looking up animal…</Text>
        </View>
      ) : null}

      {isError && scannedUuid ? (
        <View style={styles.fetchOverlay}>
          <Text style={styles.fetchError}>Animal not found for this QR code.</Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {sheetOpen && animal ? (
        <ScanResultSheet animal={animal} onDismiss={handleDismiss} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hint: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: { color: '#fff', fontSize: 14, opacity: 0.85 },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16 },
  fetchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  fetchText: { color: '#fff', fontSize: 16 },
  fetchError: { color: '#fca5a5', fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: '#1a7f37', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
