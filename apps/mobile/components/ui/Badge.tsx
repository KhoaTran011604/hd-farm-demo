import { View, Text, StyleSheet } from 'react-native';
import type { HealthStatus } from '@hd-farm/shared';

const STATUS_COLOR: Record<HealthStatus, { bg: string; text: string }> = {
  healthy: { bg: '#dcfce7', text: '#166534' },
  monitoring: { bg: '#fef9c3', text: '#854d0e' },
  sick: { bg: '#fee2e2', text: '#991b1b' },
  quarantine: { bg: '#fce7f3', text: '#9d174d' },
  recovered: { bg: '#dbeafe', text: '#1e40af' },
  dead: { bg: '#f3f4f6', text: '#6b7280' },
  sold: { bg: '#ede9fe', text: '#5b21b6' },
};

interface BadgeProps {
  status: HealthStatus;
  label?: string;
}

export function Badge({ status, label }: BadgeProps) {
  const color = STATUS_COLOR[status] ?? { bg: '#f3f4f6', text: '#6b7280' };
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{label ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});
