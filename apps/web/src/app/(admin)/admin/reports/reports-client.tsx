'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

type Stats = {
  users: { total: number };
  subscribers: { active: number };
  charities: { active: number };
  donations: { totalCents: number; currency: string };
  draws: { published: number; draft: number };
  winners: { pendingVerification: number };
};

type Audit = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  actor: { email: string } | null;
};

type AuditRes = { items: Audit[] };

function fmtDonation(cents: number, currency: string) {
  const code = currency.toUpperCase() === 'INR' ? 'INR' : currency.toUpperCase();
  return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function ReportsClient() {
  const [s, setS] = useState<Stats | null>(null);
  const [audit, setAudit] = useState<Audit[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setErr(null);
      try {
        const [a, b] = await Promise.all([
          apiFetch<Stats>('/admin/stats', { method: 'GET' }) as Promise<Stats>,
          apiFetch<AuditRes>('/admin/audit-logs?limit=30&page=1', {
            method: 'GET',
          }) as Promise<AuditRes>,
        ]);
        setS(a);
        setAudit(b.items);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Failed');
      }
    })();
  }, []);

  if (err) {
    return <p className="text-destructive text-sm">{err}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Reports</h1>
        <p className="text-muted-foreground mt-2 text-sm">Summary numbers and recent audit log.</p>
      </div>
      {s ? (
        <ul className="text-muted-foreground list-inside list-disc text-sm">
          <li>Total users: {s.users.total}</li>
          <li>Active subscribers: {s.subscribers.active}</li>
          <li>Active charities: {s.charities.active}</li>
          <li>
            Sum of one-off donations: {fmtDonation(s.donations.totalCents, s.donations.currency)}
          </li>
          <li>Published draws: {s.draws.published}</li>
          <li>Draft draws: {s.draws.draft}</li>
          <li>Winners pending verification: {s.winners.pendingVerification}</li>
        </ul>
      ) : (
        <p className="text-sm">Loading…</p>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Recent audit log</CardTitle>
        </CardHeader>
        <CardContent>
          {audit === null ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : audit.length === 0 ? (
            <p className="text-muted-foreground text-sm">No entries.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {audit.map((a) => (
                <li key={a.id} className="border-b border-dashed pb-2 last:border-0">
                  <span className="text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()} —{' '}
                  </span>
                  {a.actor ? <span className="text-foreground/90">{a.actor.email} — </span> : null}
                  <span className="font-mono">
                    {a.action} {a.entity} {a.entityId ? `(${a.entityId})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
