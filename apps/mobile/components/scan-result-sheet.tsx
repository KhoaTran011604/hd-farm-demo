import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import type { Animal } from '../lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ScanResultSheetProps {
  animal: Pick<Animal, 'id' | 'name' | 'species' | 'status' | 'qrCode'> & {
    penName?: string;
    zoneName?: string;
  } | null;
  onDismiss: () => void;
}

export function ScanResultSheet({ animal, onDismiss }: ScanResultSheetProps) {
  const router = useRouter();

  if (!animal) return null;

  const handleNav = (path: string) => {
    onDismiss();
    router.push(path as never);
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

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
          <Button label="Weigh" variant="secondary" onPress={() => handleNav(`/animals/${animal.id}`)} style={styles.actionBtn} />
          <Button label="Status" variant="secondary" onPress={() => handleNav(`/animals/${animal.id}`)} style={styles.actionBtn} />
          <Button label="View Detail" variant="primary" onPress={() => handleNav(`/animals/${animal.id}`)} style={styles.actionBtn} />
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 12,
    minHeight: '40%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 14, color: '#6b7280' },
  qr: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1 },
  closeBtn: { position: 'absolute', top: 12, right: 16, padding: 4 },
  closeBtnText: { fontSize: 16, color: '#6b7280' },
});
