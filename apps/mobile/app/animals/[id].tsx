import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Animal } from '@hd-farm/shared';

interface AnimalDetail extends Animal {
  penName?: string;
  zoneName?: string;
  farmName?: string;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: animal, isLoading, isError } = useQuery<AnimalDetail>({
    queryKey: ['animal', id],
    queryFn: () => api.get(`/animals/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a7f37" size="large" />
      </View>
    );
  }

  if (isError || !animal) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Animal not found.</Text>
      </View>
    );
  }

  const updatedAt = new Date(animal.updatedAt).toLocaleDateString();
  const createdAt = new Date(animal.createdAt).toLocaleDateString();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{animal.name}</Text>
          <Badge status={animal.status} />
        </View>
        <Text style={styles.species}>{animal.species}</Text>
        {animal.zoneName || animal.penName ? (
          <Text style={styles.location}>
            {[animal.farmName, animal.zoneName, animal.penName].filter(Boolean).join(' › ')}
          </Text>
        ) : null}
      </Card>

      {/* Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <FieldRow label="QR Code" value={animal.qrCode} />
        <FieldRow label="Species" value={animal.species} />
        <FieldRow label="Status" value={animal.status} />
        <FieldRow label="Created" value={createdAt} />
        <FieldRow label="Updated" value={updatedAt} />
      </Card>

      {/* Metadata */}
      {animal.typeMetadata && Object.keys(animal.typeMetadata).length > 0 ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Info</Text>
          {Object.entries(animal.typeMetadata).map(([k, v]) => (
            <FieldRow
              key={k}
              label={k}
              value={typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
            />
          ))}
        </Card>
      ) : null}

      {/* Quick actions */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Text style={styles.comingSoon}>Weigh, status change, and vaccination actions coming in Phase 6.</Text>
        <View style={styles.actionRow}>
          <Button label="Weigh" variant="secondary" onPress={() => {}} style={styles.actionBtn} disabled />
          <Button label="Status" variant="secondary" onPress={() => {}} style={styles.actionBtn} disabled />
          <Button label="Vaccinate" variant="secondary" onPress={() => {}} style={styles.actionBtn} disabled />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6b7280' },
  headerCard: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  species: { fontSize: 14, color: '#6b7280', textTransform: 'capitalize' },
  location: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  fieldLabel: { fontSize: 14, color: '#6b7280' },
  fieldValue: { fontSize: 14, color: '#111827', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  comingSoon: { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1 },
});
