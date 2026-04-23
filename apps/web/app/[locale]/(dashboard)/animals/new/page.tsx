import { getTranslations } from 'next-intl/server';
import { AnimalForm } from '@/components/animals/animal-form';

export default async function AnimalNewPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('animals');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('add')}</h1>
      <AnimalForm />
    </div>
  );
}
