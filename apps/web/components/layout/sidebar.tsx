'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  BarChart3,
  Bird,
  Boxes,
  Calendar,
  Heart,
  LayoutDashboard,
  Settings,
  Sprout,
  Syringe,
  Users,
  Wheat,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './dashboard-shell';

type NavItem = {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'overview',
    items: [{ key: 'dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'management',
    items: [
      { key: 'animals', href: '/animals', icon: Bird },
      { key: 'batches', href: '/batches', icon: Boxes },
      { key: 'zones', href: '/zones', icon: Wheat },
    ],
  },
  {
    label: 'health',
    items: [
      { key: 'health', href: '/health', icon: Heart },
      { key: 'vaccine', href: '/vaccine', icon: Syringe },
      { key: 'feed', href: '/feed', icon: Calendar },
      { key: 'reproduction', href: '/reproduction', icon: Sprout },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { key: 'reports', href: '/reports', icon: BarChart3 },
  { key: 'users', href: '/users', icon: Users },
  { key: 'config', href: '/config', icon: Settings },
];

export function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const { open, setOpen } = useSidebar();

  function isActive(href: string): boolean {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  function renderItem(item: NavItem): React.JSX.Element {
    const { key, href, icon: Icon } = item;
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'flex h-10 items-center gap-2.5 rounded-lg px-3 text-[13.5px] font-medium transition-colors mb-0.5',
          active
            ? 'bg-sidebar-active text-white'
            : 'text-sidebar-text hover:bg-white/10',
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
        {t(key)}
      </Link>
    );
  }

  return (
    <>
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          'no-print fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cn(
          'no-print fixed inset-y-0 left-0 z-50 flex h-screen w-60 shrink-0 flex-col bg-sidebar transition-transform duration-200',
          'md:sticky md:top-0 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Sprout className="h-[22px] w-[22px] text-white" />
          </div>
          <div className="leading-tight flex-1">
            <div className="text-base font-bold tracking-tight text-white">HD-FARM</div>
            <div className="text-[10px] text-sidebar-text">{t('tagline')}</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-text hover:bg-white/10 md:hidden"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-text/60">
                {t(`groups.${group.label}`)}
              </div>
              {group.items.map(renderItem)}
            </div>
          ))}
          <hr className="my-2 border-white/10" />
          {BOTTOM_ITEMS.map(renderItem)}
        </nav>
      </aside>
    </>
  );
}
