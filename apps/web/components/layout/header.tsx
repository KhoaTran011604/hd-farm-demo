'use client';

import { Bell, LogOut, Menu, Moon, Search, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/language-switcher';
import { AppBreadcrumb } from './breadcrumb';
import { useSidebar } from './dashboard-shell';

export function Header(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const tAuth = useTranslations('auth');
  const { toggle } = useSidebar();

  async function handleLogout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-[#E5E7EB] bg-white px-4 md:gap-4 md:px-6">
      <button
        type="button"
        onClick={toggle}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] transition-colors hover:bg-background md:hidden"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>
      <div className="hidden flex-1 min-w-0 md:block">
        <AppBreadcrumb />
      </div>
      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white transition-colors hover:bg-background"
        >
          <Search className="h-[18px] w-[18px] text-[#4B5563]" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white transition-colors hover:bg-background"
        >
          <Bell className="h-[18px] w-[18px] text-[#4B5563]" />
          <span className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-[#DC2626]" />
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="h-9 w-9"
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white"
            >
              <User className="h-[18px] w-[18px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <LanguageSwitcher />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {tAuth('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
