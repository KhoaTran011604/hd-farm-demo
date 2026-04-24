import { useTranslations } from 'next-intl';
import type { HealthStatus } from '@hd-farm/shared';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<HealthStatus, { bg: string; text: string; dot: string }> = {
  healthy: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', dot: 'bg-[#16A34A]' },
  monitoring: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', dot: 'bg-[#D97706]' },
  sick: { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', dot: 'bg-[#DC2626]' },
  quarantine: { bg: 'bg-[#FFEDD5]', text: 'text-[#EA580C]', dot: 'bg-[#EA580C]' },
  recovered: { bg: 'bg-[#DBEAFE]', text: 'text-[#2563EB]', dot: 'bg-[#2563EB]' },
  dead: { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', dot: 'bg-[#6B7280]' },
  sold: { bg: 'bg-[#F9FAFB]', text: 'text-[#9CA3AF]', dot: 'bg-[#9CA3AF]' },
};

interface StatusBadgeProps {
  status: HealthStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps): React.JSX.Element {
  const t = useTranslations('animals.status');
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.healthy;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11.5px] font-semibold',
        style.bg,
        style.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {t(status)}
    </span>
  );
}

export { STATUS_STYLES };
