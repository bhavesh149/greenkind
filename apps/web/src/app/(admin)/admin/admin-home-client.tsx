'use client';

import { Award, CreditCard, FileEdit, Gift, HeartHandshake, PiggyBank, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

type Stats = {
  users: { total: number };
  subscribers: { active: number };
  charities: { active: number };
  donations: { totalCents: number; currency: string };
  draws: { published: number; draft: number };
  winners: { pendingVerification: number };
  recentSignups: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  }>;
};

function fmtDonation(cents: number, currency: string) {
  const code = currency.toUpperCase() === 'INR' ? 'INR' : currency.toUpperCase();
  const major = cents / 100;
  return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 2,
  }).format(major);
}

const metric = (t: string, value: string, hint: string, icon: ReactNode, className?: string) => (
  <Card className={cn('overflow-hidden', className)}>
    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
      <div>
        <CardDescription>{t}</CardDescription>
        <CardTitle className="font-heading text-2xl font-semibold tabular-nums sm:text-3xl">
          {value}
        </CardTitle>
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      </div>
      <div className="text-muted-foreground bg-muted/50 dark:bg-muted/30 rounded-lg p-2">
        {icon}
      </div>
    </CardHeader>
  </Card>
);

export function AdminHomeClient() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const d = (await apiFetch<Stats>('/admin/stats', { method: 'GET' })) as Stats;
        setS(d);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
  }, []);

  if (err) {
    return <p className="text-destructive text-sm">{err}</p>;
  }
  if (!s) {
    return <p className="text-muted-foreground text-sm">Loading overview…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metric('Total users', String(s.users.total), 'All roles', <Users className="size-5" />)}
        {metric(
          'Active subscribers',
          String(s.subscribers.active),
          'Subscription status active',
          <CreditCard className="size-5" />,
        )}
        {metric(
          'Donations (recorded)',
          fmtDonation(s.donations.totalCents, s.donations.currency),
          'Sum of donation ledger',
          <PiggyBank className="size-5" />,
        )}
        {metric(
          'Draws published',
          String(s.draws.published),
          'Visible to members',
          <Gift className="size-5" />,
        )}
        {metric(
          'Draws in draft',
          String(s.draws.draft),
          'Awaiting publish or simulation',
          <FileEdit className="size-5" />,
          'sm:col-span-1',
        )}
        {metric(
          'Wins to verify',
          String(s.winners.pendingVerification),
          'Proofs pending',
          <Award className="size-5" />,
        )}
        {metric(
          'Active charities',
          String(s.charities.active),
          'Listed & discoverable',
          <HeartHandshake className="size-5" />,
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
            <CardDescription>Jump to common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              href="/admin/users"
            >
              Manage users
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              href="/admin/draws"
            >
              Draws
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              href="/admin/winners"
            >
              Winners
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              href="/admin/charities"
            >
              Charities
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              href="/admin/reports"
            >
              Reports
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent signups</CardTitle>
            <CardDescription>Newest accounts (up to 5)</CardDescription>
          </CardHeader>
          <CardContent>
            {s.recentSignups.length === 0 ? (
              <p className="text-muted-foreground text-sm">No users yet.</p>
            ) : (
              <ul className="divide-border/60 divide-y">
                {s.recentSignups.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm font-medium">
                        {u.name || u.email}
                      </p>
                      {u.name ? (
                        <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                      ) : null}
                    </div>
                    <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
                      <span className="bg-muted/60 rounded px-1.5 py-0.5 font-mono uppercase">
                        {u.role}
                      </span>
                      <time dateTime={u.createdAt}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link
                className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0 text-sm')}
                href="/admin/users"
              >
                View all users →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
