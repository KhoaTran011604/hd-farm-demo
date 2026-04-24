import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  delta?: { text: string; direction: 'up' | 'down' | 'neutral' };
}

export function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  delta,
}: KpiCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <div className="mb-3 flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[10px]"
          style={{ background: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        {delta ? (
          <span
            className={cn(
              'rounded-xl px-[7px] py-0.5 text-[11px] font-semibold',
              delta.direction === 'up' && 'bg-[#DCFCE7] text-[#16A34A]',
              delta.direction === 'down' && 'bg-[#FEE2E2] text-[#DC2626]',
              delta.direction === 'neutral' && 'bg-[#F3F4F6] text-[#4B5563]',
            )}
          >
            {delta.text}
          </span>
        ) : null}
      </div>
      <div className="text-[28px] font-extrabold leading-none text-[#1A2E0A]">{value}</div>
      <div className="mt-1 text-xs font-medium text-[#9CA3AF]">{label}</div>
    </div>
  );
}
