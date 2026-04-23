import { useTranslations } from 'next-intl';
import type { HealthStatus } from '@hd-farm/shared';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<HealthStatus, string> = {
  healthy: 'text-green-600 bg-green-100',
  monitoring: 'text-amber-600 bg-amber-100',
  sick: 'text-red-600 bg-red-100',
  quarantine: 'text-orange-600 bg-orange-100',
  recovered: 'text-blue-600 bg-blue-100',
  dead: 'text-gray-500 bg-gray-100',
  sold: 'text-gray-400 bg-gray-50',
};

interface StatusBadgeProps {
  status: HealthStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps): React.JSX.Element {
  const t = useTranslations('animals.status');
  const colorClass = STATUS_CLASSES[status] ?? 'text-gray-500 bg-gray-100';
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', colorClass, className)}>
      {t(status)}
    </span>
  );
}

export { STATUS_CLASSES };
