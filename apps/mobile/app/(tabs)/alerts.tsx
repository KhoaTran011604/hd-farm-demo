import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AnimalCard } from '../../components/animal-card';
import { Card } from '../../components/ui/card';
import type { AnimalSpecies, HealthStatus } from '../../lib/types';

interface AlertAnimal {
  id: string;
  name: string;
  species: string;
  status: HealthStatus;
  qrCode: string;
  penName?: string;
  zoneName?: string;
}

export default function AlertsScreen() {
  const { data, isLoading, isFetching, refetch } = useQuery<{ items: AlertAnimal[] }>({
    queryKey: ['alerts'],
    queryFn: () =>
      api.get('/animals', { params: { status: 'sick,quarantine,monitoring', limit: 50 } }).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a7f37" size="large" />
      </View>
    );
  }

  const alerts = data?.items ?? [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#1a7f37" />}
    >
      <Text style={styles.heading}>Alerts</Text>
      {alerts.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No active alerts — all animals are healthy.</Text>
        </Card>
      ) : (
        <>
          <Text style={styles.subheading}>{alerts.length} animal(s) need attention</Text>
          {alerts.map((a) => (
            <AnimalCard
              key={a.id}
              animal={{
                id: a.id,
                name: a.name,
                species: a.species as AnimalSpecies,
                status: a.status,
                qrCode: a.qrCode,
                penName: a.penName,
                zoneName: a.zoneName,
              }}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  emptyText: { color: '#6b7280', textAlign: 'center', paddingVertical: 8 },
});
