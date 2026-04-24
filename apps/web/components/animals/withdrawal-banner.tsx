'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { useAnimalWithdrawalsQuery } from '@/queries/diseases/queries';
import { formatDate } from '@/lib/utils';

interface WithdrawalBannerProps {
  animalId: string;
}

export function WithdrawalBanner({ animalId }: WithdrawalBannerProps): React.JSX.Element | null {
  const tW = useTranslations('disease.withdrawal');
  const { data } = useAnimalWithdrawalsQuery(animalId);

  if (!data || data.length === 0) return null;

  const latest = data.reduce((acc, cur) =>
    new Date(cur.withdrawalEndAt) > new Date(acc.withdrawalEndAt) ? cur : acc,
  );

  return (
    <div className="flex items-start gap-3 rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[#991B1B]">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">{tW('bannerTitle')}</p>
        <p className="text-xs">
          {tW('bannerDesc')} {tW('until')}: <strong>{formatDate(latest.withdrawalEndAt)}</strong>
          {data.length > 1 ? ` (+${data.length - 1})` : ''}
        </p>
      </div>
    </div>
  );
}
