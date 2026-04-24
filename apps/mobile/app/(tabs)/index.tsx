import { Text, StyleSheet, ScrollView, RefreshControl, View, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useWorkerDashboardQuery, useManagerDashboardQuery } from '@/queries/dashboard/queries';
import { getUser } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

const HDR = '#1A3009', ACCENT = '#7CB518', LIGHT = '#C5E09B';
const BG = '#F8FAF5', CARD = '#fff', BORDER = '#E5E7EB', TXT = '#1A2E0A', MUTED = '#9CA3AF';

function initials(name: string) {
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function MiniStat({ label, value, valueColor, sub, subColor }: { label: string; value: string | number; valueColor?: string; sub?: string; subColor?: string }) {
  return (
    <View style={ms.card}>
      <Text style={ms.label}>{label}</Text>
      <Text style={[ms.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
      {sub ? <Text style={[ms.sub, { color: subColor ?? MUTED }]}>{sub}</Text> : null}
    </View>
  );
}
const ms = StyleSheet.create({
  card: { flex: 1, minWidth: '44%', backgroundColor: CARD, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: BORDER },
  label: { fontSize: 11, color: MUTED, fontWeight: '500' },
  value: { fontSize: 20, fontWeight: '800', color: TXT, marginTop: 2 },
  sub: { fontSize: 11, marginTop: 2, fontWeight: '500' },
});

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    getUser<{ role: UserRole; name: string }>().then((u) => {
      setRole(u?.role ?? null);
      setUserName(u?.name ?? '');
    });
  }, []);

  const isManager = role === 'admin' || role === 'manager';
  const wq = useWorkerDashboardQuery(role !== null && !isManager);
  const mq = useManagerDashboardQuery(role !== null && isManager);

  function refetch() { if (isManager) void mq.refetch(); else void wq.refetch(); }

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? t('dashboard.home.greeting.morning') : h < 18 ? t('dashboard.home.greeting.afternoon') : t('dashboard.home.greeting.evening');
  })();

  const todayDateStr = (() => {
    const d = new Date();
    const dayNames = i18n.language === 'vi'
      ? ['CN', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${dayNames[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  })();

  const name = userName || t('dashboard.home.userDefault');
  const alertsCount = mq.data?.alertsCount ?? 0;

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <View style={[s.hdr, { paddingTop: insets.top + 8 }]}>
        <View style={s.greetRow}>
          <View>
            <Text style={s.greetSub}>{greeting}</Text>
            <Text style={s.greetName}>{name}</Text>
            <Text style={s.greetDate}>{todayDateStr}</Text>
          </View>
          <View style={s.hdrRight}>
            <TouchableOpacity style={s.notifBtn} onPress={() => router.push('/(tabs)/alerts')}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {alertsCount > 0 && <View style={s.notifDot} />}
            </TouchableOpacity>
            <View style={s.avatar}><Text style={s.avatarTxt}>{initials(name)}</Text></View>
          </View>
        </View>
        <View style={s.zonePill}>
          <Ionicons name="home-outline" size={13} color={ACCENT} />
          <Text style={s.zoneTxt}>{isManager ? t('dashboard.home.zoneManager') : t('dashboard.home.zoneWorker')}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.cnt}
        refreshControl={<RefreshControl refreshing={wq.isFetching || mq.isFetching} onRefresh={refetch} tintColor={ACCENT} />}>

        {!isManager && wq.data && (
          <View style={s.sec}>
            <View style={s.secRow}>
              <Text style={s.secTitle}>{t('dashboard.home.tasksToday')}</Text>
              <Text style={s.secAction}>{t('dashboard.home.viewAll')}</Text>
            </View>
            {wq.data.tasks.length === 0
              ? <View style={s.taskCard}><Text style={{ color: MUTED }}>{t('dashboard.home.noTasks')}</Text></View>
              : wq.data.tasks.map((task) => (
                <TouchableOpacity key={task.animalId} style={s.taskCard} onPress={() => router.push(`/animals/${task.animalId}` as never)} activeOpacity={0.75}>
                  <View style={[s.taskIcon, { backgroundColor: '#DCFCE7' }]}><Ionicons name="medical-outline" size={20} color="#16A34A" /></View>
                  <View style={s.taskBody}>
                    <Text style={s.taskTitle}>{task.animalName}</Text>
                    <Text style={s.taskDesc}>{[task.zoneName, task.penName].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: '#DCFCE7' }]}><Text style={[s.badgeTxt, { color: '#16A34A' }]}>{t('dashboard.home.statusNormal')}</Text></View>
                  <Ionicons name="chevron-forward" size={16} color={MUTED} />
                </TouchableOpacity>
              ))}
          </View>
        )}

        <View style={s.sec}>
          <Text style={[s.secTitle, { marginBottom: 10 }]}>{t('dashboard.home.quickActions')}</Text>
          <View style={s.quickRow}>
            {([
              { icon: 'scale-outline', label: t('dashboard.home.quickWeigh'), bg: '#FEF3C7', color: '#D97706' },
              { icon: 'medical-outline', label: t('dashboard.home.quickVaccine'), bg: '#DBEAFE', color: '#2563EB' },
              { icon: 'restaurant-outline', label: t('dashboard.home.quickFeed'), bg: '#DCFCE7', color: '#16A34A' },
            ] as const).map(({ icon, label, bg, color }) => (
              <TouchableOpacity key={label} style={s.quickBtn} onPress={() => router.push('/(tabs)/scan')} activeOpacity={0.75}>
                <View style={[s.quickIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={22} color={color} /></View>
                <Text style={s.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isManager && mq.data && (
          <View style={s.sec}>
            <View style={s.secRow}>
              <Text style={s.secTitle}>{t('dashboard.home.farmOverview')}</Text>
              <Text style={s.secAction}>{t('dashboard.home.viewDetails')}</Text>
            </View>
            <View style={s.statsGrid}>
              <MiniStat label={t('dashboard.home.statsTotal')} value={mq.data.totalAnimals.toLocaleString()} sub={t('dashboard.home.statsHealthySubGood')} subColor="#16A34A" />
              <MiniStat label={t('dashboard.home.statsSick')} value={mq.data.sickAnimals} valueColor="#DC2626" sub={t('dashboard.home.statsSickSub', { count: mq.data.monitoringAnimals })} subColor="#D97706" />
              <MiniStat label={t('dashboard.home.statsNeedVaccine')} value={mq.data.alertsCount} valueColor="#D97706" sub={t('dashboard.home.statsNeedVaccineSub')} subColor="#D97706" />
              <MiniStat label={t('dashboard.home.statsHealthy')} value={mq.data.healthyAnimals} valueColor="#166534" sub={t('dashboard.home.statsGood')} subColor="#16A34A" />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  hdr: { backgroundColor: HDR, paddingHorizontal: 20, paddingBottom: 20 },
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greetSub: { color: LIGHT, fontSize: 12, fontWeight: '500' },
  greetName: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  greetDate: { color: LIGHT, fontSize: 12, marginTop: 2, opacity: 0.8 },
  hdrRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifBtn: { position: 'relative' },
  notifDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626', borderWidth: 1.5, borderColor: HDR },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#4A7C2F', borderWidth: 2, borderColor: ACCENT, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  zonePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10, alignSelf: 'flex-start' },
  zoneTxt: { color: LIGHT, fontSize: 12, fontWeight: '600' },
  scroll: { flex: 1 },
  cnt: { padding: 16, paddingBottom: 90 },
  sec: { marginBottom: 20 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  secTitle: { fontSize: 14, fontWeight: '700', color: TXT },
  secAction: { fontSize: 12, color: '#4A7C2F', fontWeight: '600' },
  taskCard: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  taskIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 13.5, fontWeight: '700', color: TXT },
  taskDesc: { fontSize: 12, color: MUTED, marginTop: 2 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, alignItems: 'center', gap: 8, minHeight: 80 },
  quickIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '700', color: TXT },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
