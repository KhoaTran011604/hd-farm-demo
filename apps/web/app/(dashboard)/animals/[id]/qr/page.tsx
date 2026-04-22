import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { api } from '@/lib/api';
import type { AnimalRow } from '@/lib/animal-types';
import { SPECIES_LABELS } from '@/lib/animal-types';
import { StatusBadge } from '@/components/animals/status-badge';
import { PrintButton } from '@/components/animals/print-button';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnimalQrPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;

  let animal: AnimalRow;
  try {
    animal = await api.get<AnimalRow>(`/animals/${id}`);
  } catch {
    notFound();
  }

  const svgString = await QRCode.toString(animal.qrCode, {
    type: 'svg',
    width: 280,
    margin: 2,
    color: { dark: '#1A3009', light: '#FFFFFF' },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 print:min-h-screen print:justify-start print:pt-8">
      <div className="text-center space-y-1 print:hidden">
        <h1 className="text-xl font-bold">{animal.name}</h1>
        <p className="text-sm text-muted-foreground">Mã QR vật nuôi — nhấn &quot;In mã QR&quot; hoặc Ctrl+P để in</p>
      </div>

      <div className="rounded-2xl border-4 border-primary p-6 bg-white shadow-lg print:border-2 print:shadow-none">
        <div dangerouslySetInnerHTML={{ __html: svgString }} className="block" />
      </div>

      <div className="text-center space-y-2">
        <p className="text-2xl font-bold tracking-widest font-mono">{animal.qrCode}</p>
        <p className="text-base font-semibold">{animal.name}</p>
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <span>{SPECIES_LABELS[animal.species] ?? animal.species}</span>
          {animal.pen && <><span>·</span><span>Ô: {animal.pen.name}</span></>}
        </div>
        <StatusBadge status={animal.status} className="mt-1" />
      </div>

      <PrintButton />
    </div>
  );
}
