'use client';

import { useTranslations } from 'next-intl';

export function PrintButton(): React.JSX.Element {
  const t = useTranslations('animals');
  return (
    <button
      onClick={() => window.print()}
      className="no-print mt-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors"
    >
      {t('printQr')}
    </button>
  );
}
