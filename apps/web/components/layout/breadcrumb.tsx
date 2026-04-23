'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';

const KNOWN_SEGMENTS = new Set([
  'animals',
  'batches',
  'zones',
  'users',
  'config',
  'reports',
  'new',
  'qr',
]);

export function AppBreadcrumb(): React.JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('breadcrumb');
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return <span className="text-sm font-medium">{t('home')}</span>;
  }

  const getLabel = (seg: string): string => (KNOWN_SEGMENTS.has(seg) ? t(seg) : seg);

  const crumbs = segments.map((seg, idx) => ({
    label: getLabel(seg),
    href: '/' + segments.slice(0, idx + 1).join('/'),
    isLast: idx === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
        {t('home')}
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
