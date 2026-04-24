import { notFound } from 'next/navigation';
import { AnimalDetailHeader } from '@/components/animals/animal-detail-header';
import { AnimalStatCards } from '@/components/animals/animal-stat-cards';
import { AnimalTabs } from '@/components/animals/animal-tabs';
import { api } from '@/lib/api';
import type { AnimalRow } from '@/lib/animal-types';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AnimalDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;

  let animal: AnimalRow;
  try {
    animal = await api.get<AnimalRow>(`/animals/${id}`);
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-col gap-5">
      <AnimalDetailHeader animal={animal} />
      <AnimalStatCards />
      <AnimalTabs animal={animal} />
    </div>
  );
}
