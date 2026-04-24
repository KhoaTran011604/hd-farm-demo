import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Animal, HealthStatus } from '../lib/types';

interface ScanResultSheetProps {
  animal: Pick<Animal, 'id' | 'name' | 'species' | 'status' | 'qrCode'> & {
    penName?: string;
    zoneName?: string;
  } | null;
  onDismiss: () => void;
}

type QuickActionKey = 'weigh' | 'vaccinate' | 'status' | 'feed' | null;

const STATUS_COLOR: Record<HealthStatus, { bg: string; text: string }> = {
  healthy: { bg: '#DCFCE7', text: '#16A34A' },
  monitoring: { bg: '#FEF3C7', text: '#D97706' },
  sick: { bg: '#FEE2E2', text: '#DC2626' },
  quarantine: { bg: '#FCE7F3', text: '#DB2777' },
  recovered: { bg: '#DBEAFE', text: '#2563EB' },
  dead: { bg: '#F3F4F6', text: '#6B7280' },
  sold: { bg: '#EDE9FE', text: '#7C3AED' },
};

function animalInitials(name: string) {
  const parts = name.replace(/[#-]/g, ' ').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function ScanResultSheet({ animal, onDismiss }: ScanResultSheetProps) {
  const router = useRouter();
  const { t } = useTranslation();

  if (!animal) return null;

  const statusColor = STATUS_COLOR[animal.status] ?? { bg: '#F3F4F6', text: '#6B7280' };
  const statusLabel = t(`animals.status.${animal.status}`, { defaultValue: animal.status });
  const initials = animalInitials(animal.name);
  const locationParts = [animal.zoneName, animal.penName].filter(Boolean);

  const QUICK_ACTIONS: Array<{
    icon: React.ComponentProps<typeof Ionicons>['name'];
    labelKey: string;
    bg: string;
    color: string;
    action: QuickActionKey;
  }> = [
    { icon: 'scale-outline', labelKey: 'scan.quickActions.weigh', bg: '#FEF3C7', color: '#D97706', action: 'weigh' },
    { icon: 'medical-outline', labelKey: 'scan.quickActions.vaccine', bg: '#DBEAFE', color: '#2563EB', action: 'vaccinate' },
    { icon: 'pulse-outline', labelKey: 'scan.quickActions.health', bg: '#DCFCE7', color: '#16A34A', action: 'status' },
    { icon: 'restaurant-outline', labelKey: 'scan.quickActions.feed', bg: '#FFF7ED', color: '#EA580C', action: 'feed' },
    { icon: 'document-text-outline', labelKey: 'scan.quickActions.profile', bg: '#F3F4F6', color: '#6B7280', action: null },
  ];

  function navToDetail(action?: QuickActionKey) {
    onDismiss();
    const path = action
      ? `/animals/${animal!.id}?action=${action}`
      : `/animals/${animal!.id}`;
    router.push(path as never);
  }

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={s.backdrop} />
      </TouchableWithoutFeedback>

      <View style={s.sheet}>
        <View style={s.handle} />

        {/* ANIMAL INFO */}
        <View style={s.animalRow}>
          <View style={s.animalIcon}>
            <Text style={s.animalIconTxt}>{initials}</Text>
          </View>
          <View style={s.animalInfo}>
            <Text style={s.animalQr}>{animal.qrCode}</Text>
            <Text style={s.animalName}>{animal.name}</Text>
            <View style={s.metaRow}>
              <View style={[s.statusBadge, { backgroundColor: statusColor.bg }]}>
                <View style={[s.statusDot, { backgroundColor: statusColor.text }]} />
                <Text style={[s.statusTxt, { color: statusColor.text }]}>{statusLabel}</Text>
              </View>
            </View>
            {locationParts.length > 0 && (
              <Text style={s.location}>{locationParts.join(' — ')}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => navToDetail()} style={s.chevronBtn}>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* QUICK ACTIONS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickActions}>
          {QUICK_ACTIONS.map(({ icon, labelKey, bg, color, action }) => (
            <TouchableOpacity
              key={labelKey}
              style={s.qaBtn}
              onPress={() => navToDetail(action)}
              activeOpacity={0.75}
            >
              <View style={[s.qaIcon, { backgroundColor: bg }]}>
                <Ionicons name={icon} size={24} color={color} />
              </View>
              <Text style={s.qaLabel}>{t(labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CTA */}
        <View style={s.ctaWrap}>
          <TouchableOpacity style={s.ctaBtn} onPress={() => navToDetail()} activeOpacity={0.85}>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
            <Text style={s.ctaTxt}>{t('scan.viewDetail')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', margin: 10, alignSelf: 'center', marginBottom: 16 },
  animalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  animalIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#F0FDF4', borderWidth: 2, borderColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  animalIconTxt: { fontSize: 18, fontWeight: '800', color: '#16A34A' },
  animalInfo: { flex: 1 },
  animalQr: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', fontFamily: 'monospace' },
  animalName: { fontSize: 18, fontWeight: '800', color: '#1A2E0A', marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusTxt: { fontSize: 11.5, fontWeight: '600' },
  location: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  chevronBtn: { padding: 4 },
  quickActions: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  qaBtn: { alignItems: 'center', gap: 6, minWidth: 64 },
  qaIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  qaLabel: { fontSize: 11, fontWeight: '700', color: '#4B5563', textAlign: 'center' },
  ctaWrap: { paddingHorizontal: 16, paddingTop: 4 },
  ctaBtn: { backgroundColor: '#1A3009', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
