import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { QrCode } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { AnimalTabs } from '@/components/animals/animal-tabs';
import { api } from '@/lib/api';
import type { AnimalRow } from '@/lib/animal-types';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AnimalDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  const t = await getTranslations('animals');

  let animal: AnimalRow;
  try {
    animal = await api.get<AnimalRow>(`/animals/${id}`);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{animal.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('id')}: {animal.id}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/animals/${id}/qr`} target="_blank">
            <QrCode className="mr-2 h-4 w-4" />
            {t('printQr')}
          </Link>
        </Button>
      </div>

      <AnimalTabs animal={animal} />
    </div>
  );
}
