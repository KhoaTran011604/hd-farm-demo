import { Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { AnimalCard } from '@/components/animal-card';
import { useWorkerDashboardQuery, useManagerDashboardQuery } from '@/queries/dashboard/queries';
import { getUser } from '@/lib/auth';
import type { Animal, UserRole } from '@/lib/types';

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    getUser<{ role: UserRole }>().then((u) => setRole(u?.role ?? null));
  }, []);

  const isManager = role === 'admin' || role === 'manager';

  const workerQuery = useWorkerDashboardQuery(role !== null && !isManager);
  const managerQuery = useManagerDashboardQuery(role !== null && isManager);

  const isLoading = workerQuery.isLoading || managerQuery.isLoading;
  const isRefreshing = workerQuery.isFetching || managerQuery.isFetching;

  function refetch() {
    if (isManager) void managerQuery.refetch();
    else void workerQuery.refetch();
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
      <Text style={styles.heading}>{isManager ? t('dashboard.managerTitle') : t('dashboard.workerTitle')}</Text>

      {isManager && managerQuery.data ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard label={t('dashboard.stats.total')} value={managerQuery.data.totalAnimals} />
            <StatCard label={t('animals.status.healthy')} value={managerQuery.data.healthyAnimals} color="#166534" />
            <StatCard label={t('animals.status.sick')} value={managerQuery.data.sickAnimals} color="#991b1b" />
            <StatCard label={t('animals.status.monitoring')} value={managerQuery.data.monitoringAnimals} color="#d97706" />
            <StatCard label={t('dashboard.stats.alertsCount')} value={managerQuery.data.alertsCount} color="#b45309" />
          </View>
          <Text style={styles.sectionTitle}>{t('dashboard.recentActivity')}</Text>
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
          <Text style={styles.subheading}>{t('dashboard.workerSubtitle', { count: workerQuery.data.tasks.length })}</Text>
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
              <Text style={styles.emptyText}>{t('dashboard.allClear')}</Text>
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
