import { useTranslations } from 'next-intl';
import { Activity, Scale, Syringe } from 'lucide-react';

export function AnimalStatCards(): React.JSX.Element {
  const t = useTranslations('animals.detail.stats');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-3.5 rounded-xl border border-[#E5E7EB] bg-white p-[18px]">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: '#FEF3C7' }}
        >
          <Scale className="h-[22px] w-[22px]" style={{ color: '#D97706' }} />
        </div>
        <div>
          <div className="text-xs font-medium text-[#9CA3AF]">{t('lastWeight')}</div>
          <div className="mt-0.5 text-[20px] font-extrabold text-[#1A2E0A]">72.1 kg</div>
          <div className="mt-0.5 text-[11px] text-[#DC2626]">-0.8 kg</div>
        </div>
      </div>

      <div className="flex items-center gap-3.5 rounded-xl border border-[#E5E7EB] bg-white p-[18px]">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: '#DBEAFE' }}
        >
          <Syringe className="h-[22px] w-[22px]" style={{ color: '#2563EB' }} />
        </div>
        <div>
          <div className="text-xs font-medium text-[#9CA3AF]">{t('nextVaccine')}</div>
          <div className="mt-0.5 text-[20px] font-extrabold text-[#1A2E0A]">FMD</div>
          <div className="mt-0.5 text-[11px] text-[#D97706]">{t('overdue')}</div>
        </div>
      </div>

      <div className="flex items-center gap-3.5 rounded-xl border border-[#E5E7EB] bg-white p-[18px]">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: '#FEE2E2' }}
        >
          <Activity className="h-[22px] w-[22px]" style={{ color: '#DC2626' }} />
        </div>
        <div>
          <div className="text-xs font-medium text-[#9CA3AF]">{t('treatment')}</div>
          <div className="mt-0.5 text-[20px] font-extrabold text-[#1A2E0A]">
            {t('inTreatment')}
          </div>
          <div className="mt-0.5 text-[11px] text-[#9CA3AF]">Ngày 3/7</div>
        </div>
      </div>
    </div>
  );
}
