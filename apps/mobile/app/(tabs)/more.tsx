import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { clearToken } from '../../lib/auth';
import { queryClient } from '../../lib/query-client';
import { Card } from '../../components/ui/card';

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
        <Ionicons name={icon} size={18} color={danger ? '#d1242f' : '#1a7f37'} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const router = useRouter();

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
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
      <Text style={styles.heading}>More</Text>

      <Card style={styles.section}>
        <MenuRow label="Animals" icon="paw" onPress={() => router.push('/(tabs)/zones')} />
        <View style={styles.divider} />
        <MenuRow label="Zones & Pens" icon="layers-outline" onPress={() => router.push('/(tabs)/zones')} />
      </Card>

      <Card style={styles.section}>
        <MenuRow label="Sign Out" icon="log-out-outline" onPress={handleLogout} danger />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  section: { marginBottom: 16, padding: 0, overflow: 'hidden' },
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
  chevron: { fontSize: 20, color: '#9ca3af' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 60 },
  danger: { color: '#d1242f' },
});
