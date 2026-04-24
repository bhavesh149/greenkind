'use client';

import Link from 'next/link';

import { useAuthSession } from '@/components/providers/auth-session-provider';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { MarketingMobileNav } from './marketing-mobile-nav';
import { SignOutButton } from './sign-out-button';
import { ThemeToggle } from './theme-toggle';

function AuthPlaceholder() {
  return (
    <div className="bg-muted/50 h-8 w-[11rem] flex-none animate-pulse rounded-md" aria-hidden />
  );
}

/**
 * Right side of the marketing header: theme (desktop), auth-aware actions, mobile menu.
 */
export function MarketingHeaderEnd() {
  const { me } = useAuthSession();

  return (
    <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 md:gap-3">
      <div className="hidden md:block">
        <ThemeToggle />
      </div>
      {me === undefined ? (
        <div className="hidden items-center gap-2 sm:flex">
          <AuthPlaceholder />
        </div>
      ) : me ? (
        <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
          {me.role === 'ADMIN' ? (
            <Link
              href="/admin"
              prefetch
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs')}
            >
              Admin
            </Link>
          ) : null}
          <Link
            href="/app"
            prefetch
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs')}
          >
            App
          </Link>
          <SignOutButton />
        </div>
      ) : (
        <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
          <Link
            href="/sign-in"
            prefetch
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Sign in
          </Link>
          <Link href="/pricing" prefetch className={cn(buttonVariants({ size: 'sm' }))}>
            Subscribe
          </Link>
        </div>
      )}
      <MarketingMobileNav />
    </div>
  );
}
