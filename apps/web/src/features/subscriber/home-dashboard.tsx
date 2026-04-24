'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, publicApiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

type BillSummary = {
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hasStripeCustomer: boolean;
  } | null;
};

type LatestDraw = { draw: { id: string; month: string; status: string } | null };

function formatMonthLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function SubscriberHomeDashboard() {
  const [bill, setBill] = useState<BillSummary | null>(null);
  const [draw, setDraw] = useState<LatestDraw['draw'] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        const [b, d] = await Promise.all([
          apiFetch<BillSummary>('/billing', { method: 'GET' }),
          publicApiFetch<LatestDraw>('/draws/latest', { method: 'GET' }),
        ]);
        if (!cancelled) {
          setBill(b);
          setDraw(d.draw);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading your dashboard…</p>;
  }
  if (err) {
    return <p className="text-destructive text-sm">{err}</p>;
  }

  const sub = bill?.subscription;
  const active = sub?.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              {sub ? (
                <>
                  <span className="text-foreground font-medium">
                    {sub.plan} · {sub.status}
                  </span>
                  {sub.currentPeriodEnd ? (
                    <span className="text-muted-foreground block text-sm">
                      {sub.cancelAtPeriodEnd ? 'Cancels' : 'Renews or ends'} after{' '}
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  ) : null}
                </>
              ) : (
                'No active plan yet — open billing to subscribe.'
              )}
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link className={cn(buttonVariants({ size: 'sm' }), 'w-fit')} href="/app/billing">
                {active ? 'Manage billing' : 'Open billing'}
              </Link>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Latest published draw</CardTitle>
            <CardDescription>
              {draw ? (
                <>
                  <span className="text-foreground block font-medium">
                    {formatMonthLabel(draw.month)}
                  </span>
                  <span className="text-muted-foreground text-sm">{draw.status}</span>
                </>
              ) : (
                'No draw published yet — check back after the first monthly run.'
              )}
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
                href="/app/winnings"
              >
                Winnings
              </Link>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/app/scores" className="block">
          <Card className="hover:bg-muted/30 h-full border-dashed transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Scores</CardTitle>
              <CardDescription>Log your last five rounds</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/app/charity" className="block">
          <Card className="hover:bg-muted/30 h-full border-dashed transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Charity</CardTitle>
              <CardDescription>Your recipient & split</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/app/settings" className="block sm:col-span-2 lg:col-span-1">
          <Card className="hover:bg-muted/30 h-full border-dashed transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Settings</CardTitle>
              <CardDescription>Account & preferences</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
