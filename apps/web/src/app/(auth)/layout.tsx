import Link from 'next/link';

import { AuthCanvas } from '@/components/shell/auth-canvas';
import { GreenKindMark } from '@/components/shell/greenkind-mark';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { SHELL_HEADER_INNER_MAX_6 } from '@/lib/shell-header-classes';
import { cn } from '@/lib/utils';

function AuthLayoutHeader() {
  return (
    <header className="relative z-20 w-full border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div
        className={cn(
          SHELL_HEADER_INNER_MAX_6,
          'text-foreground/95 flex min-h-14 items-center justify-between py-3 sm:min-h-16 sm:py-0',
        )}
      >
        <GreenKindMark href="/" variant="onDark" prefetch />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            prefetch
            className={cn(
              buttonVariants({ size: 'sm', variant: 'secondary' }),
              'border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10',
            )}
          >
            Home
          </Link>
          <ThemeToggle className="text-slate-300 hover:bg-white/10 hover:text-white" />
        </div>
      </div>
    </header>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthCanvas>
      <div className="flex min-h-dvh flex-col">
        <AuthLayoutHeader />
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </AuthCanvas>
  );
}
