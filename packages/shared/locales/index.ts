import en from './en.json';
import vi from './vi.json';

export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

export const MESSAGES = { vi, en } as const;
export type Messages = typeof en;

export { en, vi };
