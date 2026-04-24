'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { printAnimalQr } from '@/lib/print-qr';
import type { AnimalRow } from '@/lib/animal-types';

interface AnimalQrBadgeProps {
  animal: AnimalRow;
}

export function AnimalQrBadge({ animal }: AnimalQrBadgeProps): React.JSX.Element {
  const tQr = useTranslations('animals.qr');
  const tSpecies = useTranslations('animals.species');
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toString(animal.qrCode, {
      type: 'svg',
      width: 60,
      margin: 0,
      color: { dark: '#1A2E0A', light: '#00000000' },
    })
      .then((s) => {
        if (active) setSvg(s);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [animal.qrCode]);

  function handlePrint(): void {
    printAnimalQr({
      code: animal.qrCode,
      name: animal.name,
      species: tSpecies(animal.species),
      penName: animal.pen?.name ?? null,
      penLabel: tQr('penShort'),
    });
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      aria-label={tQr('print')}
      className="flex h-[100px] w-[100px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-[#E5E7EB] bg-[#FAFAFA] hover:border-primary-light"
    >
      <div
        aria-hidden
        className="flex h-[60px] w-[60px] items-center justify-center [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <span className="text-[10px] font-medium text-[#9CA3AF]">{tQr('print')}</span>
    </button>
  );
}
