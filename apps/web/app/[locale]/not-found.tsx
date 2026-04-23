import { useTranslations } from 'next-intl';

export default function LocaleNotFound(): React.JSX.Element {
  const t = useTranslations('notFound');
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
