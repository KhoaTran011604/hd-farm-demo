import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { AnimalTable } from '@/components/animals/animal-table';
import { api } from '@/lib/api';
import type { AnimalListResponse } from '@/lib/animal-types';

export default async function AnimalsPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('animals');
  let initialData: AnimalListResponse | undefined;

  try {
    initialData = await api.get<AnimalListResponse>('/animals?limit=20');
  } catch {
    // client-side fallback if SSR fetch fails
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button asChild>
          <Link href="/animals/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('add')}
          </Link>
        </Button>
      </div>

      <AnimalTable initialData={initialData} />
    </div>
  );
}
