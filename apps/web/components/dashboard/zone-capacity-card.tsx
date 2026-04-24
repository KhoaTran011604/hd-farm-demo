import { useTranslations } from 'next-intl';

export interface ZoneCapacityRow {
  id: string;
  name: string;
  typeLabel: string;
  current: number;
  capacity: number;
  sick?: number;
  monitoring?: number;
  quarantine?: number;
}

interface ZoneCapacityCardProps {
  zone: ZoneCapacityRow;
}

function pickFillColor(pct: number, hasQuarantine: boolean): string {
  if (hasQuarantine) return '#EA580C';
  if (pct >= 95) return '#D97706';
  if (pct >= 80) return '#16A34A';
  return '#16A34A';
}

export function ZoneCapacityCard({ zone }: ZoneCapacityCardProps): React.JSX.Element {
  const t = useTranslations('dashboard.zoneCapacity');
  const pct = zone.capacity > 0 ? Math.round((zone.current / zone.capacity) * 100) : 0;
  const fill = pickFillColor(pct, (zone.quarantine ?? 0) > 0);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-[18px] shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-[#1A2E0A]">{zone.name}</div>
          <div className="mt-0.5 text-[11px] text-[#9CA3AF]">{zone.typeLabel}</div>
        </div>
        <div className="text-[11px] font-medium text-[#9CA3AF]">
          {zone.current} / {zone.capacity}
        </div>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded bg-[#F3F4F6]">
        <div
          className="h-full rounded transition-all"
          style={{ width: `${Math.min(100, pct)}%`, background: fill }}
        />
      </div>
      <div className="flex gap-3 text-xs text-[#4B5563]">
        <span>
          <strong className="font-bold text-[#1A2E0A]">{zone.current}</strong> {t('animals')}
        </span>
        <span>
          <strong className="font-bold text-[#1A2E0A]">{pct}%</strong> {t('full')}
        </span>
        {zone.sick ? (
          <span className="text-[#DC2626]">
            <strong className="font-bold">{zone.sick}</strong> {t('sick')}
          </span>
        ) : null}
        {zone.monitoring ? (
          <span className="text-[#D97706]">
            <strong className="font-bold">{zone.monitoring}</strong> {t('monitoring')}
          </span>
        ) : null}
        {zone.quarantine ? (
          <span className="text-[#EA580C]">
            <strong className="font-bold">{zone.quarantine}</strong> {t('quarantine')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
