'use client';

import { Award, BarChart3, Gift, HeartHandshake, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { buttonVariants } from '@/components/ui/button';
import { SHELL_HEADER_BAR, SHELL_HEADER_INNER_MAX_6 } from '@/lib/shell-header-classes';
import { cn } from '@/lib/utils';

import { GreenKindMark } from './greenkind-mark';
import { SignOutButton } from './sign-out-button';
import { ThemeToggle } from './theme-toggle';

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draws', icon: Gift },
  { href: '/admin/winners', label: 'Winners', icon: Award },
  { href: '/admin/charities', label: 'Charities', icon: HeartHandshake },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
] as const;

function AdminNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {nav.map((item) => {
        const active =
          pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'w-full justify-start gap-2',
              active
                ? 'bg-accent/80 text-accent-foreground border border-ring/25'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AdminHeaderBar() {
  return (
    <header className={SHELL_HEADER_BAR}>
      <div className={cn(SHELL_HEADER_INNER_MAX_6, 'w-full')}>
        <GreenKindMark href="/admin" prefetch />
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <ThemeToggle />
          <Link
            href="/app"
            prefetch
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs')}
          >
            App
          </Link>
          <Link
            href="/"
            prefetch
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs')}
          >
            Site
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <AdminHeaderBar />
      <div className="flex min-h-0 flex-1">
        <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-56 shrink-0 border-r md:block">
          <div className="p-2">
            <p className="text-muted-foreground px-2 pb-2 text-xs font-medium tracking-wide uppercase">
              Admin
            </p>
            <AdminNavLinks />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="bg-sidebar/50 text-sidebar-foreground border-border/50 border-b p-2 md:hidden">
            <AdminNavLinks />
          </div>
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
