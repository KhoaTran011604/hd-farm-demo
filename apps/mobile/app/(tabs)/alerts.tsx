import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, TouchableWithoutFeedback, FlatList, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';
import { VaccinationForm } from '@/components/quick-forms/vaccination-form';
import type { UpcomingVaccination } from '@/queries/alerts/queries';

const HDR = '#1A3009', ACCENT = '#7CB518';
const BG = '#F8FAF5', CARD = '#fff', TXT = '#1A2E0A', MUTED = '#9CA3AF';
const PAGE_SIZE = 5;

const GROUPS_CONFIG = {
  overdue: { color: '#DC2626', bg: '#FEE2E2', cardBorder: '#FECACA' },
  today: { color: '#D97706', bg: '#FEF3C7', cardBorder: '#E5E7EB' },
  tomorrow: { color: '#2563EB', bg: '#DBEAFE', cardBorder: '#E5E7EB' },
  week: { color: '#6B7280', bg: '#F3F4F6', cardBorder: '#E5E7EB' },
} as const;

type GroupKey = keyof typeof GROUPS_CONFIG;

function calcDiff(dueDate: string) {
  try {
    const d = new Date(dueDate); d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - t.getTime()) / 86_400_000);
  } catch {
    return Infinity;
  }
}

function classify(diff: number): GroupKey {
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'week';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return '—';
  }
}

function AlertCard({ item, groupKey, onView }: { item: UpcomingVaccination; groupKey: GroupKey; onView: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const config = GROUPS_CONFIG[groupKey];
  const diff = calcDiff(item.dueDate);
  const dueFmt = formatDate(item.dueDate);

  const descText = diff < 0
    ? t('alerts.card.overdueDays', { days: Math.abs(diff) })
    : diff === 0
      ? t('alerts.card.dueToday')
      : t('alerts.card.dueDate', { date: dueFmt });

  const badgeLabel = groupKey === 'overdue' ? t('alerts.badge.overdue')
    : groupKey === 'today' ? t('alerts.badge.today')
    : groupKey === 'tomorrow' ? t('alerts.badge.tomorrow')
    : t('alerts.badge.upcoming');

  return (
    <View style={[s.card, { borderColor: config.cardBorder }]}>
      <View style={s.cardInner}>
        <View style={[s.cardIcon, { backgroundColor: config.bg }]}>
          <Ionicons name="medical-outline" size={18} color={config.color} />
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardTitle}>{item.vaccineName} — {item.animalName}</Text>
          <Text style={s.cardDesc}>{descText}</Text>
          <View style={s.cardMeta}>
            <View style={[s.badge, { backgroundColor: config.bg }]}>
              <View style={[s.badgeDot, { backgroundColor: config.color }]} />
              <Text style={[s.badgeTxt, { color: config.color }]}>{badgeLabel}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={s.cardActions}>
        <TouchableOpacity style={[s.actionBtn, s.actionPrimary]} onPress={() => router.push('/(tabs)/scan')}>
          <Ionicons name="qr-code-outline" size={15} color="#1A3009" />
          <Text style={[s.actionTxt, { color: '#1A3009' }]}>{t('alerts.card.scanQr')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.actionSecondary]} onPress={onView}>
          <Ionicons name="eye-outline" size={15} color={MUTED} />
          <Text style={[s.actionTxt, { color: MUTED }]}>{t('alerts.card.view')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface PaginatedResponse {
  items: UpcomingVaccination[];
  total: number;
  nextOffset?: number;
}

export default function AlertsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<UpcomingVaccination | null>(null);
  const [tab, setTab] = useState<'today' | 'week'>('today');

  const days = tab === 'today' ? 1 : 7;

  // Main query: total count (always full data, no limit)
  const { data: totalData, isLoading: totalLoading, refetch: refetchTotal } = useQuery({
    queryKey: queryKeys.alerts.upcomingVaccinations(days),
    queryFn: () => api.get<PaginatedResponse>('/alerts/upcoming-vaccinations', { params: { days, limit: 9999 } }).then((r) => r.data),
  });

  const totalCount = totalData?.total ?? 0;
  const todayCount = useMemo(() => {
    if (!totalData?.items) return 0;
    return totalData.items.filter((i) => calcDiff(i.dueDate) <= 0).length;
  }, [totalData?.items]);

  // Paginated query: fetch page by page
  const {
    data,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.alerts.upcomingVaccinationsPagination(days),
    queryFn: ({ pageParam = 0 }: { pageParam: number }) =>
      api.get<PaginatedResponse>('/alerts/upcoming-vaccinations', {
        params: { days, offset: pageParam, limit: PAGE_SIZE },
      }).then((r) => r.data),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !totalLoading,
  });

  const allItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.items);
  }, [data?.pages]);

  const filteredItems = useMemo(() => {
    if (tab === 'today') return allItems.filter((item) => calcDiff(item.dueDate) <= 0);
    return allItems;
  }, [allItems, tab]);

  const handleView = useCallback((item: UpcomingVaccination) => {
    setSelected(item);
  }, []);

  const handleFetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderHeader = () => (
    <View style={[s.hdr, { paddingTop: insets.top + 8 }]}>
      <View style={s.hdrRow}>
        <View style={s.hdrLeft}>
          <Text style={s.hdrTitle}>{t('alerts.title')}</Text>
          {todayCount > 0 && (
            <View style={s.hdrBadge}>
              <Text style={s.hdrBadgeTxt}>{todayCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={s.filterBtn}>
          <Ionicons name="options-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={s.tabStrip}>
        <TouchableOpacity style={[s.stripTab, tab === 'today' && s.stripActive]} onPress={() => setTab('today')}>
          <Text style={[s.stripTxt, tab === 'today' && s.stripActiveTxt]}>
            {t('alerts.tabs.today', { count: todayCount })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.stripTab, tab === 'week' && s.stripActive]} onPress={() => setTab('week')}>
          <Text style={[s.stripTxt, tab === 'week' && s.stripActiveTxt]}>
            {t('alerts.tabs.week', { count: totalCount })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: UpcomingVaccination }) => {
    const g = classify(calcDiff(item.dueDate));
    return <AlertCard item={item} groupKey={g} onView={() => handleView(item)} />;
  };

  const keyExtractor = (item: UpcomingVaccination, index: number) => `${item.animalId}-${index}`;

  if (totalLoading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#1A3009" size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={s.screen}>
        {renderHeader()}
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="checkmark-circle-outline" size={56} color={ACCENT} />
              </View>
              <Text style={s.emptyTitle}>{t('alerts.emptyTitle')}</Text>
              <Text style={s.emptyTxt}>{t('alerts.emptyDesc')}</Text>
            </View>
          }
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#1A3009" style={s.footer} /> : null}
          onEndReached={handleFetchMore}
          onEndReachedThreshold={0.3}
          onRefresh={() => { void refetch(); void refetchTotal(); }}
          refreshing={isFetching}
          contentContainerStyle={s.cnt}
        />
      </View>

      <Modal visible={!!selected} animationType="fade" transparent onRequestClose={() => setSelected(null)}>
        <TouchableWithoutFeedback onPress={() => setSelected(null)}>
          <View style={s.modalBackdrop} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{selected?.animalName} — {selected?.vaccineName}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={s.modalBody}>
              {selected && (
                <VaccinationForm
                  animalId={selected.animalId}
                  prefilledVaccineTypeId={selected.vaccineTypeId}
                  prefilledVaccineName={selected.vaccineName}
                  onSuccess={() => { setSelected(null); void refetch(); void refetchTotal(); }}
                  onError={(msg) => console.warn('Vaccination error:', msg)}
                />
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  hdr: { backgroundColor: HDR, paddingHorizontal: 20, paddingBottom: 0 },
  hdrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  hdrLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hdrTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  hdrBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center' },
  hdrBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  tabStrip: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  stripTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  stripActive: { borderBottomColor: ACCENT },
  stripTxt: { fontSize: 13.5, fontWeight: '600', color: 'rgba(197,224,155,0.6)' },
  stripActiveTxt: { color: '#fff' },
  cnt: { padding: 12, paddingHorizontal: 16, paddingBottom: 90, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyIconWrap: { marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 6, textAlign: 'center' },
  emptyTxt: { fontSize: 13, color: MUTED, textAlign: 'center' },
  footer: { paddingVertical: 16 },
  card: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  cardInner: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: TXT, lineHeight: 18 },
  cardDesc: { fontSize: 12, color: MUTED, marginTop: 3, lineHeight: 16 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeDot: { width: 5, height: 5, borderRadius: 2.5 },
  badgeTxt: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionBtn: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionPrimary: { borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  actionSecondary: {},
  actionTxt: { fontSize: 13, fontWeight: '600' },
  // Modal (bottom sheet — same pattern as animal detail quick actions)
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: TXT, flex: 1 },
  modalClose: { fontSize: 18, color: MUTED, fontWeight: '500' },
  modalBody: { padding: 16 },
});
