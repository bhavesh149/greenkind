'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

type Row = {
  id: string;
  tier: number;
  matchCount: number;
  payoutAmountCents: number;
  verificationStatus: string;
  payoutStatus: string;
  proofImageKey: string | null;
  adminNotes: string | null;
  user: { email: string; name: string };
  draw: { month: string };
};

type ListRes = { total: number; items: Row[] };

function fmtMoney(c: number) {
  return (c / 100).toFixed(2);
}

export function WinnersAdminClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const q = filter === 'ALL' ? '' : `&verificationStatus=${encodeURIComponent(filter)}`;
      const data = (await apiFetch<ListRes>(`/admin/winners?limit=100&page=1${q}`, {
        method: 'GET',
      })) as ListRes;
      setRows(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function verify(id: string, status: 'APPROVED' | 'REJECTED') {
    setBusy(id + status);
    setError(null);
    try {
      await apiFetch(`/admin/winners/${id}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          adminNotes: note[id]?.trim() || undefined,
        }),
      });
      await load();
    } catch (er) {
      setError(er instanceof Error ? er.message : 'Update failed');
    } finally {
      setBusy(null);
    }
  }

  async function markPaid(id: string) {
    setBusy(id + 'pay');
    setError(null);
    try {
      await apiFetch(`/admin/winners/${id}/payout/mark-paid`, { method: 'POST' });
      await load();
    } catch (er) {
      setError(er instanceof Error ? er.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Winners & verification</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Approve or reject proof, then mark paid after you complete off-platform transfer.
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="flex items-center gap-2">
        <label htmlFor="f" className="text-muted-foreground text-sm">
          Status
        </label>
        <select
          id="f"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border-input bg-background rounded-md border px-2 py-1 text-sm"
        >
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="ALL">ALL</option>
        </select>
        <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      {loading || rows === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No rows.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((w) => (
            <li key={w.id}>
              <Card>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <p className="font-medium">
                      {w.user.name} — {w.user.email}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {w.draw.month?.slice(0, 7)} — tier {w.tier} — {fmtMoney(w.payoutAmountCents)}{' '}
                      (local currency units)
                    </p>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Verification: </span>
                    {w.verificationStatus}
                    {' · '}
                    <span className="text-muted-foreground">Payout: </span>
                    {w.payoutStatus}
                  </p>
                  {w.proofImageKey ? (
                    <p className="text-xs break-all">
                      <span className="text-muted-foreground">Proof: </span>
                      {w.proofImageKey}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs">No proof yet.</p>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="text-muted-foreground text-xs" htmlFor={`n-${w.id}`}>
                        Admin note (optional)
                      </label>
                      <input
                        id={`n-${w.id}`}
                        value={note[w.id] ?? ''}
                        onChange={(e) => setNote((m) => ({ ...m, [w.id]: e.target.value }))}
                        className="border-input bg-background focus-visible:ring-ring w-full max-w-md rounded border px-2 py-1 text-sm"
                      />
                    </div>
                    {w.verificationStatus === 'PENDING' && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => void verify(w.id, 'APPROVED')}
                          disabled={busy !== null}
                        >
                          {busy === w.id + 'APPROVED' ? '…' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void verify(w.id, 'REJECTED')}
                          disabled={busy !== null}
                        >
                          {busy === w.id + 'REJECTED' ? '…' : 'Reject'}
                        </Button>
                      </div>
                    )}
                    {w.verificationStatus === 'APPROVED' && w.payoutStatus === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void markPaid(w.id)}
                        disabled={busy !== null}
                      >
                        {busy === w.id + 'pay' ? '…' : 'Mark paid'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
