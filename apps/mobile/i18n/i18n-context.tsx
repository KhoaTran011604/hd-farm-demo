import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, LOCALES, LOCALE_STORAGE_KEY, type Locale } from './supported-locales';

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => Promise<void>;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    (i18next.language as Locale) ?? DEFAULT_LOCALE,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (!cancelled && saved && (LOCALES as readonly string[]).includes(saved)) {
          await i18next.changeLanguage(saved);
          setLocaleState(saved as Locale);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    await i18next.changeLanguage(next);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
