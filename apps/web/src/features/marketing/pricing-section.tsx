'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type PublicPricingResponse } from '@/lib/billing-pricing';
import { publicApiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

const signIn = (plan: 'MONTHLY' | 'YEARLY') =>
  `/sign-in?next=${encodeURIComponent(`/app/billing?plan=${plan}`)}`;
const signUp = (plan: 'MONTHLY' | 'YEARLY') =>
  `/sign-up?next=${encodeURIComponent(`/app/billing?plan=${plan}`)}`;

const features = [
  'Last five Stableford scores (1–45)',
  'One monthly draw entry path per rules',
  'Choose a charity + minimum 10% of your fee',
  'Manage or cancel in the Stripe customer portal',
] as const;

export function PricingSection() {
  const [data, setData] = useState<PublicPricingResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const d = await publicApiFetch<PublicPricingResponse>('/billing/pricing', {
          method: 'GET',
        });
        setData(d);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Could not load prices');
      }
    })();
  }, []);

  const monthly = data?.plans.find((p) => p.plan === 'MONTHLY');
  const yearly = data?.plans.find((p) => p.plan === 'YEARLY');
  const savePct = data?.yearlySavingsPercent;

  if (err) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {err}
      </p>
    );
  }

  return (
    <div className="not-prose grid gap-6 lg:grid-cols-2">
      <Card
        className={cn(
          'border-border/60 relative flex flex-col overflow-hidden',
          'shadow-sm dark:shadow-lg dark:shadow-black/20',
        )}
      >
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="font-heading text-xl">Monthly</CardTitle>
            {monthly ? (
              <p className="text-foreground text-2xl font-semibold tabular-nums sm:text-3xl">
                {monthly.formatted}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">Loading…</p>
            )}
          </div>
          <CardDescription>
            Flexible — renews every month. Full access to scores, charity, and draws.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {features.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-link mt-0.5 shrink-0" aria-hidden>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="mt-auto flex flex-wrap gap-2 border-t border-border/50 pt-4">
          <Link className={cn(buttonVariants(), 'inline-flex')} href={signUp('MONTHLY')}>
            Create account
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex')}
            href={signIn('MONTHLY')}
          >
            Sign in
          </Link>
        </CardFooter>
      </Card>

      <Card
        className={cn(
          'border-border/60 from-mint/5 dark:from-mint/8 relative flex flex-col overflow-hidden bg-linear-to-b to-transparent ring-1 ring-ring/15',
          'shadow-sm dark:shadow-lg dark:shadow-black/20',
        )}
      >
        {savePct != null && savePct > 0 ? (
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                'text-link border-mint/30 bg-mint/10 dark:text-mint inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
              )}
            >
              Save ~{savePct}% vs 12× monthly
            </span>
          </div>
        ) : null}
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="font-heading text-xl">Yearly</CardTitle>
            {yearly ? (
              <p className="text-foreground text-2xl font-semibold tabular-nums sm:text-3xl">
                {yearly.formatted}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">Loading…</p>
            )}
          </div>
          <CardDescription>
            Best value for committed players. Same benefits — one annual charge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {features.map((f) => (
              <li key={`y-${f}`} className="flex gap-2">
                <span className="text-link mt-0.5 shrink-0" aria-hidden>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="mt-auto flex flex-wrap gap-2 border-t border-border/50 pt-4">
          <Link className={cn(buttonVariants(), 'inline-flex')} href={signUp('YEARLY')}>
            Create account
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex')}
            href={signIn('YEARLY')}
          >
            Sign in
          </Link>
        </CardFooter>
      </Card>

      {data?.source === 'fallback' ? (
        <p className="text-muted-foreground lg:col-span-2 text-sm">
          Shown amounts are <strong>development defaults</strong> when Stripe is not configured.
          With <code className="text-foreground/90">STRIPE_SECRET_KEY</code> and price IDs set, live
          prices load automatically.
        </p>
      ) : null}
    </div>
  );
}
