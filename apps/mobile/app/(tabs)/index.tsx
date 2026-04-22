import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getUser } from '../../lib/auth';
import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { AnimalCard } from '../../components/AnimalCard';
import type { Animal, UserRole } from '@hd-farm/shared';

interface WorkerTask {
  animalId: string;
  animalName: string;
  species: string;
  status: string;
  qrCode: string;
  penName?: string;
  zoneName?: string;
  action: string;
}

interface WorkerData {
  tasks: WorkerTask[];
  totalAnimals: number;
}

interface RecentEvent {
  animalId: string;
  animalName: string;
  species: string;
  status: string;
  updatedAt: string;
  penName?: string;
  zoneName?: string;
}

interface ManagerData {
  totalAnimals: number;
  healthyAnimals: number;
  sickAnimals: number;
  monitoringAnimals: number;
  alertsCount: number;
  recentEvents: RecentEvent[];
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export default function HomeScreen() {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    getUser<{ role: UserRole }>().then((u) => setRole(u?.role ?? null));
  }, []);

  const isManager = role === 'admin' || role === 'manager';

  const workerQuery = useQuery<WorkerData>({
    queryKey: ['dashboard', 'tasks'],
    queryFn: () => api.get('/dashboard/my-tasks').then((r) => r.data),
    enabled: role !== null && !isManager,
  });

  const managerQuery = useQuery<ManagerData>({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.get('/dashboard/overview').then((r) => r.data),
    enabled: role !== null && isManager,
  });

  const isLoading = workerQuery.isLoading || managerQuery.isLoading;
  const isRefreshing = workerQuery.isFetching || managerQuery.isFetching;

  function refetch() {
    if (isManager) managerQuery.refetch();
    else workerQuery.refetch();
  }

  if (!role || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a7f37" size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#1a7f37" />}
    >
      <Text style={styles.heading}>{isManager ? 'Farm Overview' : 'My Tasks'}</Text>

      {isManager && managerQuery.data ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard label="Total" value={managerQuery.data.totalAnimals} />
            <StatCard label="Healthy" value={managerQuery.data.healthyAnimals} color="#166534" />
            <StatCard label="Sick" value={managerQuery.data.sickAnimals} color="#991b1b" />
            <StatCard label="Alerts" value={managerQuery.data.alertsCount} color="#d97706" />
          </View>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {managerQuery.data.recentEvents.map((a) => (
            <AnimalCard
              key={a.animalId}
              animal={{
                id: a.animalId,
                name: a.animalName,
                species: a.species as Animal['species'],
                status: a.status as Animal['status'],
                qrCode: a.animalId,
                penName: a.penName,
                zoneName: a.zoneName,
              }}
            />
          ))}
        </>
      ) : null}

      {!isManager && workerQuery.data ? (
        <>
          <Text style={styles.subheading}>{workerQuery.data.tasks.length} animals need attention</Text>
          {workerQuery.data.tasks.map((t) => (
            <AnimalCard
              key={t.animalId}
              animal={{
                id: t.animalId,
                name: t.animalName,
                species: t.species as Animal['species'],
                status: t.status as Animal['status'],
                qrCode: t.qrCode,
                penName: t.penName,
                zoneName: t.zoneName,
              }}
            />
          ))}
          {workerQuery.data.tasks.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>All clear — no animals need attention today.</Text>
            </Card>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  statCard: { flex: 1, minWidth: '44%', alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 28, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  emptyText: { color: '#6b7280', textAlign: 'center' },
});
