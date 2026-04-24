import Link from 'next/link';

type Props = {
  className?: string;
  href?: string;
  variant?: 'default' | 'onDark';
  prefetch?: boolean;
};

/**
 * Logotype mark — “Green / Kind” without golf cliché imagery.
 */
export function GreenKindMark({
  className = '',
  href = '/',
  variant = 'default',
  prefetch = true,
}: Props) {
  const green = variant === 'onDark' ? 'text-mint' : 'text-brand-600 dark:text-mint';
  const kind = variant === 'onDark' ? 'text-white/95' : 'text-foreground/90';
  const inner = (
    <span
      className={`font-heading text-xl font-semibold tracking-tight sm:text-2xl ${className}`.trim()}
    >
      <span className={green}>Green</span>
      <span className={kind}>Kind</span>
    </span>
  );
  if (href) {
    return (
      <Link
        href={href}
        prefetch={prefetch}
        className="focus-visible:ring-ring/40 rounded-sm outline-none focus-visible:ring-2"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
