import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { Animal } from '@hd-farm/shared';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface AnimalCardProps {
  animal: Pick<Animal, 'id' | 'name' | 'species' | 'status' | 'qrCode'> & {
    penName?: string;
    zoneName?: string;
  };
  onPress?: () => void;
}

export function AnimalCard({ animal, onPress }: AnimalCardProps) {
  const router = useRouter();

  function handlePress() {
    if (onPress) {
      onPress();
    } else {
      router.push(`/animals/${animal.id}`);
    }
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{animal.name}</Text>
            <Text style={styles.meta}>
              {animal.species}
              {animal.penName ? ` · ${animal.penName}` : ''}
              {animal.zoneName ? ` · ${animal.zoneName}` : ''}
            </Text>
          </View>
          <Badge status={animal.status} />
        </View>
        <Text style={styles.qr}>QR: {animal.qrCode}</Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  qr: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' },
});
