'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAuthSession } from '@/components/providers/auth-session-provider';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export function AppMobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { role } = useAuthSession();

  const showAdminLink = role === 'ADMIN';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const panel =
    !open || !mounted
      ? null
      : createPortal(
          <div
            className="fixed inset-0 z-200 flex md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="App menu"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm dark:bg-black/60"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <div
              className={cn(
                'relative ml-auto flex h-dvh w-full max-w-[min(100%,20rem)] flex-col overflow-hidden',
                'border-l border-border/80 bg-card text-card-foreground shadow-2xl',
              )}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-3 py-3">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  App
                </span>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 inline-flex h-9 w-9 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>
              <nav
                className="gk-scrollbar-hidden flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain bg-card p-2"
                aria-label="App navigation"
              >
                {links.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== '/app' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch
                      onClick={() => setOpen(false)}
                      className={cn(
                        'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'border border-ring/30 bg-primary/10 text-foreground'
                          : 'text-foreground hover:bg-muted/80 dark:hover:bg-muted/50',
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="shrink-0 space-y-2 border-t border-border bg-card p-3">
                {showAdminLink ? (
                  <Link
                    href="/admin"
                    prefetch
                    onClick={() => setOpen(false)}
                    className={cn(
                      buttonVariants({ variant: 'secondary', size: 'sm' }),
                      'w-full justify-center',
                    )}
                  >
                    Admin
                  </Link>
                ) : null}
                <Link
                  href="/"
                  prefetch
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'w-full justify-center',
                  )}
                >
                  Site
                </Link>
                <div className="w-full" onClick={() => setOpen(false)}>
                  <SignOutButton
                    triggerVariant="outline"
                    className="w-full max-w-full justify-center"
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        );

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent focus-visible:ring-2 focus-visible:outline-none"
        aria-expanded={open}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>
      {panel}
    </div>
  );
}
