import type en from '@hd-farm/shared/locales/en';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NextIntl {
    interface AppConfig {
      Messages: typeof en;
      Locale: 'vi' | 'en';
    }
  }
}

export {};
