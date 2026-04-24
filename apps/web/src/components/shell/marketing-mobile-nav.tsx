'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuthSession } from '@/components/providers/auth-session-provider';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { SignOutButton } from './sign-out-button';
import { ThemeToggle } from './theme-toggle';

const nav = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/charities', label: 'Charities' },
  { href: '/pricing', label: 'Pricing' },
] as const;

export function MarketingMobileNav() {
  const [open, setOpen] = useState(false);
  const { me, role } = useAuthSession();

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
      {open ? (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="border-border/80 relative ml-auto flex h-full max-h-dvh w-full max-w-[min(100%,20rem)] flex-col overflow-hidden border-l bg-card text-card-foreground shadow-2xl"
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-3 py-3 dark:bg-card">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Menu
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
            <nav className="gk-scrollbar-hidden flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain bg-card p-3 dark:bg-card">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => setOpen(false)}
                  className="text-foreground hover:bg-muted/80 dark:hover:bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="shrink-0 space-y-2 border-t border-border bg-card p-3 dark:bg-card">
              {me === undefined ? null : me ? (
                <>
                  {role === 'ADMIN' ? (
                    <Link
                      href="/admin"
                      prefetch
                      onClick={() => setOpen(false)}
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'w-full justify-center',
                      )}
                    >
                      Admin
                    </Link>
                  ) : null}
                  <Link
                    href="/app"
                    prefetch
                    onClick={() => setOpen(false)}
                    className={cn(
                      buttonVariants({ variant: 'secondary' }),
                      'w-full justify-center',
                    )}
                  >
                    App
                  </Link>
                  <div className="w-full" onClick={() => setOpen(false)}>
                    <SignOutButton
                      triggerVariant="outline"
                      className="w-full max-w-full justify-center"
                    />
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    prefetch
                    onClick={() => setOpen(false)}
                    className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/pricing"
                    prefetch
                    onClick={() => setOpen(false)}
                    className={cn(buttonVariants(), 'w-full justify-center')}
                  >
                    Subscribe
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
