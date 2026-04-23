import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n/i18n-context';
import type { Locale } from '@/i18n/supported-locales';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18n();

  const options: Array<{ value: Locale; label: string }> = [
    { value: 'vi', label: t('common.vietnamese') },
    { value: 'en', label: t('common.english') },
  ];

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('common.switchLanguage')}
      style={styles.row}
    >
      {options.map(({ value, label }) => {
        const active = value === locale;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled: active }}
            disabled={active}
            onPress={() => void setLocale(value)}
            style={[styles.btn, active && styles.btnActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, padding: 16 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#e5e5e5' },
  btnActive: { backgroundColor: '#111' },
  label: { color: '#111' },
  labelActive: { color: '#fff' },
});
