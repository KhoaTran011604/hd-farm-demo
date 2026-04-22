import type { HealthStatus } from '@hd-farm/shared';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<HealthStatus, { label: string; className: string }> = {
  healthy:    { label: 'Khỏe mạnh',    className: 'text-green-600 bg-green-100' },
  monitoring: { label: 'Theo dõi',     className: 'text-amber-600 bg-amber-100' },
  sick:       { label: 'Bệnh',         className: 'text-red-600 bg-red-100' },
  quarantine: { label: 'Cách ly',      className: 'text-orange-600 bg-orange-100' },
  recovered:  { label: 'Đã hồi phục',  className: 'text-blue-600 bg-blue-100' },
  dead:       { label: 'Chết',         className: 'text-gray-500 bg-gray-100' },
  sold:       { label: 'Đã bán',       className: 'text-gray-400 bg-gray-50' },
};

interface StatusBadgeProps {
  status: HealthStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps): React.JSX.Element {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'text-gray-500 bg-gray-100' };
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', config.className, className)}>
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
