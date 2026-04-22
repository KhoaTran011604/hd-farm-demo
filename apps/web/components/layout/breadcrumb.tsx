'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  animals: 'Vật nuôi',
  new: 'Thêm mới',
  batches: 'Lô chăn nuôi',
  zones: 'Khu vực',
  users: 'Người dùng',
  config: 'Cấu hình',
  reports: 'Báo cáo',
  qr: 'Mã QR',
};

function getLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment;
}

export function AppBreadcrumb(): React.JSX.Element {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return <span className="text-sm font-medium">Dashboard</span>;
  }

  const crumbs = segments.map((seg, idx) => ({
    label: getLabel(seg),
    href: '/' + segments.slice(0, idx + 1).join('/'),
    isLast: idx === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
        Dashboard
      </Link>
      {crumbs.map(({ label, href, isLast }) => (
        <span key={href} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          {isLast ? (
            <span className="font-medium">{label}</span>
          ) : (
            <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
