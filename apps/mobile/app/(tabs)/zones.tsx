import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AnimalCard } from '../../components/animal-card';
import { Card } from '../../components/ui/card';
import type { Farm, Zone, Pen, Animal } from '../../lib/types';

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return <Text style={{ fontSize: 14, color: '#6b7280' }}>{expanded ? '▲' : '▼'}</Text>;
}

function PenSection({ pen, zoneName }: { pen: Pen; zoneName: string }) {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery<{ items: Animal[] }>({
    queryKey: ['animals', 'pen', pen.id],
    queryFn: () => api.get('/animals', { params: { penId: pen.id } }).then((r) => r.data),
    enabled: expanded,
  });

  return (
    <View style={styles.penSection}>
      <TouchableOpacity style={styles.penHeader} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <Text style={styles.penName}>{pen.name}</Text>
        <View style={styles.penMeta}>
          {pen.capacity ? <Text style={styles.penCapacity}>Cap: {pen.capacity}</Text> : null}
          <ChevronIcon expanded={expanded} />
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.penContent}>
          {isLoading ? (
            <ActivityIndicator color="#1a7f37" style={{ marginVertical: 12 }} />
          ) : (data?.items?.length ?? 0) === 0 ? (
            <Text style={styles.emptyText}>No animals in this pen.</Text>
          ) : (
            data?.items.map((a) => (
              <AnimalCard
                key={a.id}
                animal={{ ...a, penName: pen.name, zoneName }}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

function ZoneSection({ zone }: { zone: Zone }) {
  const [expanded, setExpanded] = useState(false);

  const { data: pens, isLoading } = useQuery<Pen[]>({
    queryKey: ['pens', zone.id],
    queryFn: () => api.get('/pens', { params: { zoneId: zone.id } }).then((r) => r.data),
    enabled: expanded,
  });

  return (
    <Card style={styles.zoneCard}>
      <TouchableOpacity style={styles.zoneHeader} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <View>
          <Text style={styles.zoneName}>{zone.name}</Text>
          {zone.type ? <Text style={styles.zoneType}>{zone.type}</Text> : null}
        </View>
        <ChevronIcon expanded={expanded} />
      </TouchableOpacity>

      {expanded ? (
        isLoading ? (
          <ActivityIndicator color="#1a7f37" style={{ marginVertical: 12 }} />
        ) : (pens?.length ?? 0) === 0 ? (
          <Text style={styles.emptyText}>No pens in this zone.</Text>
        ) : (
          pens?.map((pen) => <PenSection key={pen.id} pen={pen} zoneName={zone.name} />)
        )
      ) : null}
    </Card>
  );
}

export default function ZonesScreen() {
  const farmsQuery = useQuery<Farm[]>({
    queryKey: ['farms'],
    queryFn: () => api.get('/farms').then((r) => r.data),
  });

  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  const farmId = selectedFarmId ?? farmsQuery.data?.[0]?.id ?? null;

  const zonesQuery = useQuery<Zone[]>({
    queryKey: ['zones', farmId],
    queryFn: () => api.get('/zones', { params: { farmId } }).then((r) => r.data),
    enabled: !!farmId,
  });

  if (farmsQuery.isLoading) {
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
      refreshControl={
        <RefreshControl refreshing={zonesQuery.isFetching} onRefresh={() => zonesQuery.refetch()} tintColor="#1a7f37" />
      }
    >
      <Text style={styles.heading}>Zones</Text>

      {(farmsQuery.data?.length ?? 0) > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.farmTabs} contentContainerStyle={{ gap: 8 }}>
          {farmsQuery.data?.map((farm) => (
            <TouchableOpacity
              key={farm.id}
              style={[styles.farmTab, farmId === farm.id && styles.farmTabActive]}
              onPress={() => setSelectedFarmId(farm.id)}
            >
              <Text style={[styles.farmTabText, farmId === farm.id && styles.farmTabTextActive]}>
                {farm.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {zonesQuery.isLoading ? (
        <ActivityIndicator color="#1a7f37" style={{ marginTop: 24 }} />
      ) : (zonesQuery.data?.length ?? 0) === 0 ? (
        <Card><Text style={styles.emptyText}>No zones found for this farm.</Text></Card>
      ) : (
        zonesQuery.data?.map((zone) => (
          <ZoneSection key={zone.id} zone={zone} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },
  farmTabs: { marginBottom: 16 },
  farmTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#f3f4f6',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  farmTabActive: { backgroundColor: '#1a7f37', borderColor: '#1a7f37' },
  farmTabText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  farmTabTextActive: { color: '#fff' },
  zoneCard: { marginBottom: 12 },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  zoneType: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  penSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  penHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  penName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  penMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  penCapacity: { fontSize: 12, color: '#9ca3af' },
  penContent: { marginTop: 8 },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
});
