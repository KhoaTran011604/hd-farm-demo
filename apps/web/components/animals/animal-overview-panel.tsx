import { useTranslations } from 'next-intl';
import { Activity, Calendar, Scale, Syringe, type LucideIcon } from 'lucide-react';
import { StatusBadge } from '@/components/animals/status-badge';
import type { AnimalRow } from '@/lib/animal-types';
import { formatDate } from '@/lib/utils';

interface HistoryEntry {
  id: string;
  kind: 'disease' | 'weight' | 'vaccine' | 'feeding' | 'statusChange';
  title: string;
  desc: string;
  date: string;
}

const HISTORY_ICON_STYLES: Record<HistoryEntry['kind'], { bg: string; color: string }> = {
  disease: { bg: '#FEE2E2', color: '#DC2626' },
  weight: { bg: '#FEF3C7', color: '#D97706' },
  vaccine: { bg: '#DBEAFE', color: '#2563EB' },
  feeding: { bg: '#DCFCE7', color: '#16A34A' },
  statusChange: { bg: '#F3F4F6', color: '#6B7280' },
};

const HISTORY_ICONS: Record<HistoryEntry['kind'], LucideIcon> = {
  disease: Activity,
  weight: Scale,
  vaccine: Syringe,
  feeding: Calendar,
  statusChange: Activity,
};

const FAKE_HISTORY: HistoryEntry[] = [
  {
    id: '1',
    kind: 'disease',
    title: 'Phát hiện bệnh — Sốt 40.2°C',
    desc: 'Bỏ ăn, ủ rũ. Ghi nhận bởi Trần Văn Minh',
    date: 'Hôm nay 08:15',
  },
  {
    id: '2',
    kind: 'weight',
    title: 'Cân nặng: 72.1 kg',
    desc: 'Cân định kỳ tuần 14',
    date: '20/04 07:30',
  },
  {
    id: '3',
    kind: 'vaccine',
    title: 'Tiêm vaccine PRRS lần 2',
    desc: 'Liều 2ml — Ghi nhận bởi Bác sĩ Hương',
    date: '14/04 09:00',
  },
  {
    id: '4',
    kind: 'feeding',
    title: 'Cho ăn: 2.4 kg cám tổng hợp',
    desc: 'Buổi chiều — Ăn bình thường',
    date: '19/04 16:00',
  },
  {
    id: '5',
    kind: 'weight',
    title: 'Cân nặng: 72.9 kg',
    desc: 'Cân định kỳ tuần 13',
    date: '13/04 07:45',
  },
];

interface AnimalOverviewPanelProps {
  animal: AnimalRow;
  onChangeStatus?: () => void;
}

export function AnimalOverviewPanel({
  animal,
  onChangeStatus,
}: AnimalOverviewPanelProps): React.JSX.Element {
  const t = useTranslations('animals.detail');
  const tInfo = useTranslations('animals.detail.info');
  const tSpecies = useTranslations('animals.species');

  const ageDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(animal.createdAt).getTime()) / 86_400_000),
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-3 text-[13px] font-bold text-[#1A2E0A]">{t('sectionInfo')}</div>
        <table className="w-full border-collapse text-[13px]">
          <tbody>
            <InfoRow label={tInfo('id')} value={animal.qrCode} mono bold />
            <InfoRow label={tInfo('breed')} value={tSpecies(animal.species)} />
            <tr className="border-b border-[#F9FAFB]">
              <td className="w-[140px] py-2 font-medium text-[#9CA3AF]">{tInfo('status')}</td>
              <td className="py-2 text-[#1A2E0A]">
                <div className="flex items-center justify-start gap-4">
                  <StatusBadge status={animal.status} />
                  {onChangeStatus ? (
                    <button
                      type="button"
                      onClick={onChangeStatus}
                      className="flex h-7 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-[11.5px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB]"
                    >
                      <Activity className="h-3 w-3" />
                      {tInfo('changeStatus')}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
            <InfoRow
              label={tInfo('birthDate')}
              value={`${formatDate(animal.createdAt)} (${ageDays} ngày)`}
            />
            <InfoRow label={tInfo('sex')} value={tInfo('unknown')} />
            <InfoRow label={tInfo('rfid')} value={`RFID-${animal.qrCode}`} mono />
            <InfoRow
              label={tInfo('zone')}
              value={`${animal.zone?.name ?? '—'}${animal.pen?.name ? ` — ${animal.pen.name}` : ''}`}
            />
            <InfoRow label={tInfo('caretaker')} value={tInfo('unknown')} />
          </tbody>
        </table>

        <div className="mt-5 mb-3 text-[13px] font-bold text-[#1A2E0A]">
          {t('sectionWeightTrend')}
        </div>
        <svg viewBox="0 0 400 100" className="h-[120px] w-full" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="400" y2="0" stroke="#F3F4F6" strokeWidth="1" />
          <line x1="0" y1="33" x2="400" y2="33" stroke="#F3F4F6" strokeWidth="1" />
          <line x1="0" y1="66" x2="400" y2="66" stroke="#F3F4F6" strokeWidth="1" />
          <line x1="0" y1="99" x2="400" y2="99" stroke="#E5E7EB" strokeWidth="1" />
          <path
            d="M0,40 C30,38 60,35 90,32 C120,29 150,27 180,30 C210,33 240,38 270,42 C300,46 330,50 370,55 L400,58"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="8 3"
          />
          <path
            d="M0,60 C30,55 60,50 90,44 C120,38 150,32 180,28 C210,24 240,22 270,24 C300,26 330,28 370,32 L400,34"
            fill="none"
            stroke="#2D5016"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
        <div className="mt-1.5 flex gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-[#DC2626]">
            <span className="h-[2px] w-4 rounded bg-[#DC2626]" />
            {t('thisAnimal')}
          </span>
          <span className="flex items-center gap-1.5 text-[#9CA3AF]">
            <span className="h-[2px] w-4 rounded bg-primary opacity-40" />
            {t('batchAverage')}
          </span>
        </div>
      </div>

      <div>
        <div className="mb-3 text-[13px] font-bold text-[#1A2E0A]">{t('sectionHistory')}</div>
        <ul>
          {FAKE_HISTORY.map((h, idx) => {
            const Icon = HISTORY_ICONS[h.kind];
            const style = HISTORY_ICON_STYLES[h.kind];
            return (
              <li
                key={h.id}
                className={`flex gap-3 py-2.5 ${idx !== FAKE_HISTORY.length - 1 ? 'border-b border-[#F9FAFB]' : ''}`}
              >
                <div
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
                  style={{ background: style.bg }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#1A2E0A]">{h.title}</div>
                  <div className="mt-0.5 text-xs text-[#9CA3AF]">{h.desc}</div>
                </div>
                <div className="text-[11px] text-[#9CA3AF]">{h.date}</div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 text-center">
          <button
            type="button"
            className="text-[12.5px] font-semibold text-primary hover:text-primary-light"
          >
            {t('viewAllHistory')}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}): React.JSX.Element {
  return (
    <tr className="border-b border-[#F9FAFB] last:border-b-0">
      <td className="w-[140px] py-2 font-medium text-[#9CA3AF]">{label}</td>
      <td
        className={`py-2 text-[#1A2E0A] ${mono ? 'font-mono' : ''} ${bold ? 'font-bold' : 'font-medium'}`}
      >
        {value}
      </td>
    </tr>
  );
}
