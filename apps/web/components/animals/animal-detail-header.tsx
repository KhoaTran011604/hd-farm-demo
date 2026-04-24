'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Activity, Pencil, QrCode } from 'lucide-react';
import { StatusBadge } from '@/components/animals/status-badge';
import { AnimalQrBadge } from '@/components/animals/animal-qr-badge';
import { AnimalEditDialog } from '@/components/animals/animal-edit-dialog';
import { printAnimalQr } from '@/lib/print-qr';
import type { AnimalRow } from '@/lib/animal-types';
import { formatDate } from '@/lib/utils';

interface AnimalDetailHeaderProps {
  animal: AnimalRow;
  onUpdateStatus?: () => void;
}

export function AnimalDetailHeader({
  animal,
  onUpdateStatus,
}: AnimalDetailHeaderProps): React.JSX.Element {
  const [editOpen, setEditOpen] = React.useState(false);
  const t = useTranslations('animals.detail');
  const tMeta = useTranslations('animals.detail.meta');
  const tQr = useTranslations('animals.qr');
  const tSpecies = useTranslations('animals.species');

  const ageDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(animal.createdAt).getTime()) / 86_400_000),
  );

  function handlePrintQr(): void {
    printAnimalQr({
      code: animal.qrCode,
      name: animal.name,
      species: tSpecies(animal.species),
      penName: animal.pen?.name ?? null,
      penLabel: tQr('penShort'),
    });
  }

  return (
    <>
    <div className="flex flex-wrap items-start gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6">
      <AnimalQrBadge animal={animal} />

      <div className="flex-1 min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-3">
          <div className="text-[22px] font-extrabold text-[#1A2E0A]">{animal.name}</div>
          <StatusBadge status={animal.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-6">
          <MetaItem label={tMeta('id')} value={animal.qrCode} mono />
          <MetaItem label={tMeta('species')} value={tSpecies(animal.species)} />
          <MetaItem
            label={tMeta('zone')}
            value={`${animal.zone?.name ?? '—'}${animal.pen?.name ? ` — ${animal.pen.name}` : ''}`}
          />
          <MetaItem label={tMeta('registeredAt')} value={formatDate(animal.createdAt)} />
          <MetaItem
            label={tMeta('age')}
            value={`${ageDays} ${tMeta('ageUnit')}`}
          />
        </div>
      </div>

      <div className="ml-auto flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handlePrintQr}
          className="flex h-[38px] items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563] hover:bg-background"
        >
          <QrCode className="h-[15px] w-[15px]" />
          {tQr('printHeader')}
        </button>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex h-[38px] items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563] hover:bg-background"
        >
          <Pencil className="h-[15px] w-[15px]" />
          {t('editBtn')}
        </button>
        <button
          type="button"
          onClick={onUpdateStatus}
          className="flex h-[38px] items-center gap-1.5 rounded-lg bg-[#FEE2E2] px-3.5 text-[13px] font-semibold text-[#DC2626] hover:bg-[#FCA5A5]"
        >
          <Activity className="h-[15px] w-[15px]" />
          {t('updateStatus')}
        </button>
      </div>
    </div>

    <AnimalEditDialog animal={animal} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

function MetaItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): React.JSX.Element {
  return (
    <div>
      <div className="mb-0.5 text-xs text-[#9CA3AF]">{label}</div>
      <div
        className={`text-[13px] font-semibold text-[#1A2E0A] ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}
