'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { BarChart3, Bird, Boxes, LayoutDashboard, Settings, Users, Wheat } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'animals', href: '/animals', icon: Bird },
  { key: 'batches', href: '/batches', icon: Boxes },
  { key: 'zones', href: '/zones', icon: Wheat },
  { key: 'users', href: '/users', icon: Users },
  { key: 'config', href: '/config', icon: Settings },
  { key: 'reports', href: '/reports', icon: BarChart3 },
] as const;

export function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <aside className="no-print flex h-screen w-60 flex-col bg-sidebar text-sidebar-text shrink-0">
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <span className="text-lg font-bold text-white tracking-wide">HD-FARM</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
