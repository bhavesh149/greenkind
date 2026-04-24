import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-border/50 bg-card/25 supports-[backdrop-filter]:bg-card/20 border-t backdrop-blur-sm">
      <div className="text-muted-foreground mx-auto max-w-6xl px-4 py-10 text-sm sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} GreenKind. Play with purpose.</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="hover:text-link-hover focus-visible:ring-ring/40 transition-colors focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-link-hover focus-visible:ring-ring/40 transition-colors focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              Terms
            </Link>
            <a
              className="hover:text-link-hover focus-visible:ring-ring/40 transition-colors focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
              href="mailto:hello@greenkind.app"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
