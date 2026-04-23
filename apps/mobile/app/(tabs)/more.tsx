import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { clearToken } from '../../lib/auth';
import { queryClient } from '../../lib/query-client';
import { Card } from '../../components/ui/card';

interface MenuRowProps {
  label: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuRow({ label, icon, onPress, danger }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
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
        <MenuRow label="Animals" icon="🐄" onPress={() => router.push('/(tabs)/zones')} />
        <View style={styles.divider} />
        <MenuRow label="Zones & Pens" icon="🗺" onPress={() => router.push('/(tabs)/zones')} />
      </Card>

      <Card style={styles.section}>
        <MenuRow label="Sign Out" icon="↩" onPress={handleLogout} danger />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  section: { marginBottom: 16, padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowIcon: { fontSize: 20, width: 32 },
  rowLabel: { flex: 1, fontSize: 15, color: '#111827' },
  chevron: { fontSize: 20, color: '#9ca3af' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 48 },
  danger: { color: '#d1242f' },
});
