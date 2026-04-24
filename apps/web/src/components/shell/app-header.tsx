'use client';

import Link from 'next/link';

import { NotificationBell } from '@/features/notifications/notification-bell';

import { useAuthSession } from '@/components/providers/auth-session-provider';
import { buttonVariants } from '@/components/ui/button';
import { SHELL_HEADER_BAR, SHELL_HEADER_INNER_MAX_5 } from '@/lib/shell-header-classes';
import { cn } from '@/lib/utils';

import { AppMobileNav } from './app-mobile-nav';
import { GreenKindMark } from './greenkind-mark';
import { SignOutButton } from './sign-out-button';
import { ThemeToggle } from './theme-toggle';

const links = [
  { href: '/app', label: 'Home' },
  { href: '/app/billing', label: 'Billing' },
  { href: '/app/scores', label: 'Scores' },
  { href: '/app/charity', label: 'Charity' },
  { href: '/app/winnings', label: 'Winnings' },
  { href: '/app/settings', label: 'Settings' },
] as const;

export function AppHeader() {
  const { role } = useAuthSession();
  const showAdminLink = role === 'ADMIN';

  return (
    <header className={SHELL_HEADER_BAR}>
      <div
        className={cn(
          SHELL_HEADER_INNER_MAX_5,
          'min-w-0 max-w-full items-center gap-2 overflow-x-hidden sm:gap-3',
        )}
      >
        <GreenKindMark href="/app" className="shrink-0" prefetch />
        <nav
          className="text-muted-foreground hidden h-14 min-w-0 flex-1 items-center md:flex md:h-16"
          aria-label="App"
        >
          <div className="gk-scrollbar-hidden flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-x-0.5 overflow-x-auto pr-1 sm:gap-x-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 dark:hover:text-accent-foreground shrink-0 whitespace-nowrap rounded-md px-1.5 py-2 text-sm font-medium transition-colors underline-offset-4 decoration-transparent hover:underline hover:decoration-mint focus-visible:ring-2 focus-visible:outline-none sm:px-2"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <span className="inline-flex shrink-0 items-center pl-1">
            <NotificationBell />
          </span>
        </nav>
        <div className="hidden shrink-0 items-center gap-0.5 md:flex md:gap-1.5">
          {showAdminLink ? (
            <Link
              href="/admin"
              prefetch
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs')}
            >
              Admin
            </Link>
          ) : null}
          <ThemeToggle />
          <Link
            href="/"
            prefetch
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs')}
          >
            Site
          </Link>
          <SignOutButton />
        </div>
        <div className="flex items-center gap-0.5 md:hidden">
          <NotificationBell />
          <AppMobileNav />
        </div>
      </div>
    </header>
  );
}
