import { useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import type { Animal } from '@hd-farm/shared';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface ScanResultSheetProps {
  animal: Pick<Animal, 'id' | 'name' | 'species' | 'status' | 'qrCode'> & {
    penName?: string;
    zoneName?: string;
  } | null;
  onDismiss: () => void;
}

export function ScanResultSheet({ animal, onDismiss }: ScanResultSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const router = useRouter();

  const snapPoints = ['40%'];

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
    onDismiss();
  }, [onDismiss]);

  if (!animal) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
      index={0}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{animal.name}</Text>
            <Badge status={animal.status} />
          </View>
          <Text style={styles.meta}>
            {animal.species}
            {animal.penName ? ` · ${animal.penName}` : ''}
            {animal.zoneName ? ` · ${animal.zoneName}` : ''}
          </Text>
          <Text style={styles.qr}>QR: {animal.qrCode}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="Weigh"
            variant="secondary"
            onPress={() => {
              handleClose();
              router.push(`/animals/${animal.id}`);
            }}
            style={styles.actionBtn}
          />
          <Button
            label="Status"
            variant="secondary"
            onPress={() => {
              handleClose();
              router.push(`/animals/${animal.id}`);
            }}
            style={styles.actionBtn}
          />
          <Button
            label="View Detail"
            variant="primary"
            onPress={() => {
              handleClose();
              router.push(`/animals/${animal.id}`);
            }}
            style={styles.actionBtn}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: '#fff', borderRadius: 20 },
  handle: { backgroundColor: '#d1d5db', width: 40 },
  content: { flex: 1, padding: 20 },
  header: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 14, color: '#6b7280' },
  qr: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1 },
});
