import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { clearToken } from '../../lib/auth';
import { queryClient } from '../../lib/query-client';
import { Card } from '../../components/ui/card';
import { LanguageSwitcher } from '@/components/language-switcher';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuRowProps {
  label: string;
  icon: IoniconsName;
  onPress: () => void;
  danger?: boolean;
}

function MenuRow({ label, icon, onPress, danger }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
        <Ionicons name={icon} size={18} color={danger ? '#d1242f' : '#1A3009'} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  function handleLogout() {
    Alert.alert(t('common.signOutConfirmTitle'), t('common.signOutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await clearToken();
          queryClient.clear();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>{t('tabs.more')}</Text>
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>{t('common.language')}</Text>
        <LanguageSwitcher />
      </Card>

      <Card style={styles.section}>
        <MenuRow label={t('animals.title')} icon="paw" onPress={() => router.push('/(tabs)/zones')} />
        <View style={styles.divider} />
        <MenuRow label={t('zones.title')} icon="layers-outline" onPress={() => router.push('/(tabs)/zones')} />
      </Card>


      <Card style={styles.section}>
        <MenuRow label={t('auth.logout')} icon="log-out-outline" onPress={handleLogout} danger />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  section: { marginBottom: 16, padding: 0, overflow: 'hidden' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', paddingHorizontal: 16, paddingTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapDanger: { backgroundColor: '#fff1f2' },
  rowLabel: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 60 },
  danger: { color: '#d1242f' },
});
