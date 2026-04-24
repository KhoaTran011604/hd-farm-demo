import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/card';

export type TimelineAction = 'weigh' | 'status' | 'vaccinate' | 'disease';
type TabKey = 'weight' | 'status' | 'vaccine';

interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  meta?: string;
  accent: string;
}

interface TabConfig {
  key: TabKey;
  label: string;
  icon: string;
  action: TimelineAction;
  ctaLabel: string;
  emptyHint: string;
  accent: string;
}

const TABS: TabConfig[] = [
  { key: 'weight',  label: 'Cân nặng',   icon: '⚖️', action: 'weigh',     ctaLabel: 'Ghi nhận cân nặng',   emptyHint: 'Chưa có dữ liệu cân nặng', accent: '#16a34a' },
  { key: 'status',  label: 'Trạng thái', icon: '🩺', action: 'status',    ctaLabel: 'Cập nhật trạng thái', emptyHint: 'Chưa có thay đổi trạng thái', accent: '#ca8a04' },
  { key: 'vaccine', label: 'Tiêm',       icon: '💉', action: 'vaccinate', ctaLabel: 'Ghi nhận tiêm vaccine', emptyHint: 'Chưa có mũi tiêm nào', accent: '#2563eb' },
];

function buildWeightFake(animalId: string): TimelineEntry[] {
  const seed = animalId.charCodeAt(0) || 1;
  const base = 20 + (seed % 15);
  return [
    { id: 'w1', date: '2026-04-20', title: `${(base + 8.2).toFixed(1)} kg`, subtitle: 'Tăng 0.8 kg', meta: 'Nguyễn Văn A', accent: '#16a34a' },
    { id: 'w2', date: '2026-04-13', title: `${(base + 7.4).toFixed(1)} kg`, subtitle: 'Tăng 1.1 kg', meta: 'Trần Thị B', accent: '#16a34a' },
    { id: 'w3', date: '2026-04-06', title: `${(base + 6.3).toFixed(1)} kg`, subtitle: 'Tăng 0.6 kg', meta: 'Nguyễn Văn A', accent: '#16a34a' },
    { id: 'w4', date: '2026-03-30', title: `${(base + 5.7).toFixed(1)} kg`, subtitle: 'Tăng 0.9 kg', meta: 'Lê Văn C', accent: '#16a34a' },
    { id: 'w5', date: '2026-03-23', title: `${(base + 4.8).toFixed(1)} kg`, subtitle: 'Cân khởi đầu', meta: 'Nguyễn Văn A', accent: '#6b7280' },
  ];
}

function buildStatusFake(): TimelineEntry[] {
  return [
    { id: 's1', date: '2026-04-18', title: 'Khỏe mạnh', subtitle: 'Hồi phục sau theo dõi', meta: 'Bác sĩ thú y', accent: '#16a34a' },
    { id: 's2', date: '2026-04-10', title: 'Theo dõi',  subtitle: 'Có dấu hiệu bỏ ăn',     meta: 'Trần Thị B',    accent: '#ca8a04' },
    { id: 's3', date: '2026-04-05', title: 'Ốm',        subtitle: 'Sốt nhẹ, tiêu chảy',     meta: 'Bác sĩ thú y', accent: '#dc2626' },
    { id: 's4', date: '2026-03-28', title: 'Khỏe mạnh', subtitle: 'Khám định kỳ',           meta: 'Nguyễn Văn A', accent: '#16a34a' },
    { id: 's5', date: '2026-03-15', title: 'Khỏe mạnh', subtitle: 'Nhập đàn',               meta: 'Lê Văn C',     accent: '#2563eb' },
  ];
}

function buildVaccineFake(): TimelineEntry[] {
  return [
    { id: 'v1', date: '2026-04-15', title: 'Vaccine Lở mồm long móng', subtitle: 'Mũi nhắc lại', meta: 'Bác sĩ thú y · 2ml',   accent: '#2563eb' },
    { id: 'v2', date: '2026-03-20', title: 'Vaccine Tụ huyết trùng',   subtitle: 'Mũi 2',        meta: 'Bác sĩ thú y · 1.5ml', accent: '#2563eb' },
    { id: 'v3', date: '2026-02-25', title: 'Vaccine Dịch tả',          subtitle: 'Mũi 1',        meta: 'Bác sĩ thú y · 2ml',   accent: '#2563eb' },
    { id: 'v4', date: '2026-01-30', title: 'Tẩy giun sán',             subtitle: 'Định kỳ quý 1', meta: 'Trần Thị B',          accent: '#7c3aed' },
  ];
}

interface Props {
  animalId: string;
  onAction: (action: TimelineAction) => void;
}

export function AnimalTimeline({ animalId, onAction }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('weight');
  const active = TABS.find((t) => t.key === activeTab)!;

  const entries = useMemo(() => {
    if (activeTab === 'weight') return buildWeightFake(animalId);
    if (activeTab === 'status') return buildStatusFake();
    return buildVaccineFake();
  }, [activeTab, animalId]);

  const lastEntryLabel = entries[0] ? `Gần nhất: ${formatDate(entries[0].date)}` : null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Theo dõi & Lịch sử</Text>
        {lastEntryLabel ? <Text style={styles.headerMeta}>{lastEntryLabel}</Text> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map((t) => {
          const isActive = t.key === activeTab;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tab, isActive && styles.tabActive]}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{t.label}</Text>
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                  {countFor(t.key, animalId)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.cta, { backgroundColor: active.accent }]}
        activeOpacity={0.85}
        onPress={() => onAction(active.action)}
      >
        <Text style={styles.ctaPlus}>＋</Text>
        <Text style={styles.ctaLabel}>{active.ctaLabel}</Text>
      </TouchableOpacity>

      {entries.length === 0 ? (
        <Text style={styles.empty}>{active.emptyHint}</Text>
      ) : (
        <View style={styles.timeline}>
          {entries.map((e, idx) => (
            <View key={e.id} style={styles.entry}>
              <View style={styles.railCol}>
                <View style={[styles.dot, { backgroundColor: e.accent }]} />
                {idx < entries.length - 1 ? <View style={styles.rail} /> : null}
              </View>
              <View style={styles.entryBody}>
                <Text style={styles.entryDate}>{formatDate(e.date)}</Text>
                <Text style={styles.entryTitle}>{e.title}</Text>
                {e.subtitle ? <Text style={styles.entrySubtitle}>{e.subtitle}</Text> : null}
                {e.meta ? <Text style={styles.entryMeta}>{e.meta}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function countFor(key: TabKey, animalId: string): number {
  if (key === 'weight')  return buildWeightFake(animalId).length;
  if (key === 'status')  return buildStatusFake().length;
  return buildVaccineFake().length;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  headerMeta: { fontSize: 12, color: '#9ca3af' },
  tabsRow: { gap: 8, paddingBottom: 12 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  tabActive: { backgroundColor: '#1A3009' },
  tabIcon: { fontSize: 14 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabLabelActive: { color: '#fff' },
  tabBadge: {
    minWidth: 20, height: 18, paddingHorizontal: 6,
    borderRadius: 9, backgroundColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  tabBadgeTextActive: { color: '#fff' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  ctaPlus: { fontSize: 18, color: '#fff', fontWeight: '700', lineHeight: 20 },
  ctaLabel: { fontSize: 14, color: '#fff', fontWeight: '600' },
  empty: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 24 },
  timeline: { paddingTop: 4 },
  entry: { flexDirection: 'row', gap: 12 },
  railCol: { alignItems: 'center', width: 16, paddingTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  rail: { flex: 1, width: 2, backgroundColor: '#e5e7eb', marginTop: 2 },
  entryBody: { flex: 1, paddingBottom: 16 },
  entryDate: { fontSize: 11, color: '#9ca3af', fontWeight: '500', marginBottom: 2 },
  entryTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  entrySubtitle: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  entryMeta: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
