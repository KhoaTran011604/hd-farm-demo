import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#1A3009'} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#1A3009' },
  secondary: { backgroundColor: '#f0faf3', borderWidth: 1, borderColor: '#1A3009' },
  danger: { backgroundColor: '#d1242f' },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  label: { fontSize: 15, fontWeight: '600' },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: '#1A3009' },
  dangerLabel: { color: '#fff' },
  ghostLabel: { color: '#1A3009' },
});
