'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import type { Locale } from '@hd-farm/shared/locales';

export function LanguageSwitcher(): React.JSX.Element {
  const t = useTranslations('common');
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (next: Locale): void => {
    if (next === currentLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <nav aria-label={t('switchLanguage')} className="flex items-center gap-1">
      <Button
        type="button"
        variant={currentLocale === 'vi' ? 'default' : 'ghost'}
        size="sm"
        disabled={isPending || currentLocale === 'vi'}
        onClick={() => handleSwitch('vi')}
      >
        {t('vietnamese')}
      </Button>
      <Button
        type="button"
        variant={currentLocale === 'en' ? 'default' : 'ghost'}
        size="sm"
        disabled={isPending || currentLocale === 'en'}
        onClick={() => handleSwitch('en')}
      >
        {t('english')}
      </Button>
    </nav>
  );
}
