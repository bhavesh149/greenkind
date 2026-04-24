import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="bg-muted/20 border-border/40 border-b">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-brand-600 dark:text-brand-300 font-heading text-sm font-medium tracking-wide uppercase">
          Trust
        </p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Summary — expand with your DPA and counsel before production.
        </p>
        <div className="text-foreground/90 mt-8 space-y-4 text-sm leading-relaxed sm:text-base">
          <p>
            We process account data (e.g. name, email) and product usage (scores, draw results,
            charity preferences) to run GreenKind. Payment data is handled by our payment provider;
            we store references needed for subscription state and support.
          </p>
          <p>
            <strong className="text-foreground">Cookies.</strong> We use httpOnly cookies for
            session security on the app origin. A theme preference may be stored in local storage
            for dark mode.
          </p>
          <p>
            <strong className="text-foreground">Access.</strong> You can update profile fields in
            Settings where available. You may request account deletion or data export in line with
            applicable law; contact the email below.
          </p>
          <p>
            <strong className="text-foreground">Contact.</strong>{' '}
            <a
              href="mailto:hello@greenkind.app"
              className="text-brand-600 dark:text-brand-300 font-medium underline-offset-2 hover:underline"
            >
              hello@greenkind.app
            </a>
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
