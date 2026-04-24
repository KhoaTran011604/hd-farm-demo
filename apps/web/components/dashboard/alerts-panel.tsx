import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type AlertDotColor = 'red' | 'amber' | 'blue';

export interface DashboardAlertItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  dot: AlertDotColor;
}

const DOT_CLASSES: Record<AlertDotColor, string> = {
  red: 'bg-[#DC2626]',
  amber: 'bg-[#D97706]',
  blue: 'bg-[#2563EB]',
};

interface AlertsPanelProps {
  items: DashboardAlertItem[];
}

export function AlertsPanel({ items }: AlertsPanelProps): React.JSX.Element {
  const t = useTranslations('dashboard.alerts');

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
        <div className="text-sm font-bold text-[#1A2E0A]">{t('title')}</div>
        <button
          type="button"
          className="text-xs font-semibold text-primary-light hover:text-primary"
        >
          {t('viewAll')}
        </button>
      </div>
      <ul>
        {items.map((item, idx) => (
          <li
            key={item.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 px-5 py-3 hover:bg-background',
              idx !== items.length - 1 && 'border-b border-[#F9FAFB]',
            )}
          >
            <span
              className={cn(
                'mt-[5px] h-2 w-2 shrink-0 rounded-full',
                DOT_CLASSES[item.dot],
              )}
            />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-[#1A2E0A]">{item.title}</div>
              <div className="mt-0.5 text-xs text-[#9CA3AF]">{item.desc}</div>
            </div>
            <div className="whitespace-nowrap text-[11px] text-[#9CA3AF]">{item.time}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
