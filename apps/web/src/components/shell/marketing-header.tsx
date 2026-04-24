import Link from 'next/link';

import { SHELL_HEADER_BAR, SHELL_HEADER_INNER_MAX_6 } from '@/lib/shell-header-classes';

import { GreenKindMark } from './greenkind-mark';
import { MarketingHeaderEnd } from './marketing-header-end';

const nav = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/charities', label: 'Charities' },
  { href: '/pricing', label: 'Pricing' },
] as const;

export function MarketingHeader() {
  return (
    <header className={SHELL_HEADER_BAR}>
      <div className={SHELL_HEADER_INNER_MAX_6}>
        <div className="flex min-w-0 items-center gap-2">
          <GreenKindMark href="/" prefetch />
        </div>
        <nav className="text-muted-foreground hidden flex-1 items-center justify-center gap-8 text-sm font-medium md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 underline-offset-4 decoration-transparent transition-colors hover:underline hover:decoration-mint focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <MarketingHeaderEnd />
      </div>
    </header>
  );
}
