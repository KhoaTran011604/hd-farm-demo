import { getTranslations } from 'next-intl/server';
import { Plus, Upload } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { AnimalTable } from '@/components/animals/animal-table';
import { api } from '@/lib/api';
import type { AnimalListResponse } from '@/lib/animal-types';

export default async function AnimalsPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('animals');
  const tMeta = await getTranslations('animals.tableMeta');
  const tFilters = await getTranslations('animals.filters');
  let initialData: AnimalListResponse | undefined;

  try {
    initialData = await api.get<AnimalListResponse>('/animals?limit=20');
  } catch {
    // client-side fallback if SSR fetch fails
  }

  const total = initialData?.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A2E0A]">{t('title')}</h1>
          <p className="mt-0.5 text-[13px] text-[#9CA3AF]">
            {tMeta('subtitle', { total, zones: 6 })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex h-10 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13.5px] font-semibold text-[#4B5563] hover:bg-background"
          >
            <Upload className="h-4 w-4" />
            {tFilters('importExcel')}
          </button>
          <Link
            href="/animals/new"
            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13.5px] font-semibold text-white hover:bg-primary-light"
          >
            <Plus className="h-4 w-4" />
            {t('add')}
          </Link>
        </div>
      </div>

      <AnimalTable initialData={initialData} />
    </div>
  );
}
