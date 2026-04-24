import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <div className="bg-muted/20 border-border/40 border-b">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-brand-600 dark:text-brand-300 font-heading text-sm font-medium tracking-wide uppercase">
          Legal
        </p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">Terms of use</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Last updated: review before launch in your jurisdiction.
        </p>
        <div className="text-foreground/90 mt-8 space-y-4 text-sm leading-relaxed sm:text-base">
          <p>
            GreenKind is a subscription service. By creating an account and paying through our
            payment provider, you agree to the subscription terms shown at checkout and in your
            billing portal.
          </p>
          <p>
            <strong className="text-foreground">Draws and prizes.</strong> Monthly draws are subject
            to the rules published in-app at the time a draw is published. Prize pools are allocated
            across tiers; unclaimed top-tier amounts may roll forward as described there. Nothing on
            this page overrides the in-app draw rules for a specific month.
          </p>
          <p>
            <strong className="text-foreground">Scores.</strong> You are responsible for entering
            accurate Stableford values and dates. The platform enforces a rolling set of up to five
            scores per your account, as described in How it works.
          </p>
          <p>
            <strong className="text-foreground">Charity.</strong> A minimum share of your
            subscription can be directed to a listed partner as configured in the app. One-time
            donations, where offered, are processed separately and do not change draw eligibility
            rules unless explicitly stated in-app.
          </p>
          <p>
            <strong className="text-foreground">Contact.</strong> For questions, email{' '}
            <a
              href="mailto:hello@greenkind.app"
              className="text-brand-600 dark:text-brand-300 font-medium underline-offset-2 hover:underline"
            >
              hello@greenkind.app
            </a>
            . Replace with your production support address.
          </p>
        </div>
        <p className="mt-10">
          <Link href="/" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
