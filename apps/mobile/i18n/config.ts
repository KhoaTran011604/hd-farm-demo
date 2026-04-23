import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from '@hd-farm/shared/locales/en';
import vi from '@hd-farm/shared/locales/vi';
import { LOCALES, DEFAULT_LOCALE, type Locale } from './supported-locales';

function resolveInitialLocale(): Locale {
  const device = getLocales()[0]?.languageCode;
  return (LOCALES as readonly string[]).includes(device ?? '')
    ? (device as Locale)
    : DEFAULT_LOCALE;
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: resolveInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  ns: ['translation'],
  defaultNS: 'translation',
  interpolation: { escapeValue: false, prefix: '{', suffix: '}' }, // single-brace matches shared JSON format
  react: { useSuspense: false }, // mandatory for React Native
});

export default i18next;
