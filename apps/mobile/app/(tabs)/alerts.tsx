import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUpcomingVaccinationsQuery } from '@/queries/alerts/queries';
import { VaccinationForm } from '@/components/quick-forms/vaccination-form';
import { Card } from '@/components/ui/card';
import type { UpcomingVaccination } from '@/queries/alerts/queries';

interface AlertGroup {
  label: string;
  items: UpcomingVaccination[];
}

function groupByDueDate(items: UpcomingVaccination[]): AlertGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const groups: AlertGroup[] = [
    { label: 'Hôm nay', items: [] },
    { label: 'Ngày mai', items: [] },
    { label: 'Tuần này', items: [] },
  ];

  for (const item of items) {
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

    if (diffDays <= 0) groups[0].items.push(item);
    else if (diffDays === 1) groups[1].items.push(item);
    else groups[2].items.push(item);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function AlertsScreen() {
  const { t } = useTranslation();
  const { data = [], isLoading, isFetching, refetch } = useUpcomingVaccinationsQuery(7);
  const [selected, setSelected] = useState<UpcomingVaccination | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a7f37" size="large" />
      </View>
    );
  }

  const groups = groupByDueDate(data);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#1a7f37" />}
      >
        <Text style={styles.heading}>{t('alerts.upcomingVaccinations')}</Text>

        {groups.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>{t('alerts.noUpcomingVaccinations')}</Text>
          </Card>
        ) : (
          groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.items.map((item, i) => (
                <TouchableOpacity
                  key={`${item.animalId}-${item.vaccineTypeId}-${i}`}
                  style={styles.alertCard}
                  onPress={() => setSelected(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.alertDot} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertAnimal}>{item.animalName}</Text>
                    <Text style={styles.alertVaccine}>{item.vaccineName}</Text>
                  </View>
                  <Text style={styles.alertChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelected(null)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {selected?.animalName} — {selected?.vaccineName}
          </Text>

          {selected && (
            <VaccinationForm
              animalId={selected.animalId}
              prefilledVaccineTypeId={selected.vaccineTypeId}
              prefilledVaccineName={selected.vaccineName}
              onSuccess={() => {
                setSelected(null);
                void refetch();
              }}
              onError={(msg) => console.warn('Vaccination error:', msg)}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  emptyText: { color: '#6b7280', textAlign: 'center', paddingVertical: 8 },
  group: { marginBottom: 20 },
  groupLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  alertDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a7f37' },
  alertContent: { flex: 1 },
  alertAnimal: { fontSize: 15, fontWeight: '600', color: '#111827' },
  alertVaccine: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  alertChevron: { fontSize: 20, color: '#9ca3af' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 12,
    maxHeight: '80%',
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 16 },
});
