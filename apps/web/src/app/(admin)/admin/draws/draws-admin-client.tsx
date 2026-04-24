'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

type Draw = {
  id: string;
  month: string;
  mode: 'RANDOM' | 'ALGORITHMIC';
  status: 'DRAFT' | 'SIMULATED' | 'PUBLISHED' | 'ARCHIVED';
  generatedNumbers: number[];
  seed: string | null;
  resultSummary: unknown;
  publishedAt: string | null;
};

type ListRes = { total: number; page: number; limit: number; items: Draw[] };

export function DrawsAdminClient() {
  const [rows, setRows] = useState<Draw[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [mode, setMode] = useState<'RANDOM' | 'ALGORITHMIC'>('RANDOM');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = (await apiFetch<ListRes>('/admin/draws?limit=50&page=1', {
        method: 'GET',
      })) as ListRes;
      setRows(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    setBusy('create');
    setError(null);
    try {
      const iso = `${month}-01T00:00:00.000Z`;
      await apiFetch('/admin/draws', {
        method: 'POST',
        body: JSON.stringify({ month: iso, mode }),
      });
      await load();
    } catch (er) {
      setError(er instanceof Error ? er.message : 'Create failed');
    } finally {
      setBusy(null);
    }
  }

  async function simulate(id: string) {
    setBusy(id + 's');
    setError(null);
    try {
      await apiFetch(`/admin/draws/${id}/simulate`, { method: 'POST' });
      await load();
    } catch (er) {
      setError(er instanceof Error ? er.message : 'Simulate failed');
    } finally {
      setBusy(null);
    }
  }

  async function publish(id: string) {
    if (
      !window.confirm(
        'Publish: creates winner rows, sends notifications, and is irreversible. Continue?',
      )
    ) {
      return;
    }
    setBusy(id + 'p');
    setError(null);
    try {
      await apiFetch(`/admin/draws/${id}/publish`, { method: 'POST' });
      await load();
    } catch (er) {
      setError(er instanceof Error ? er.message : 'Publish failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Draws</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          Create a month draft, run simulate (dry run), then publish. Prize pool and rollover use
          env: <code className="text-xs">PRIZE_POOL_REVPCT</code>,{' '}
          <code className="text-xs">PRIZE_ESTIMATED_MRR_CENTS</code>.
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">New draft</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createDraft} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label htmlFor="m" className="text-muted-foreground text-xs font-medium">
                Month (1st of month)
              </label>
              <input
                id="m"
                type="month"
                value={month.length >= 7 ? month.slice(0, 7) : month}
                onChange={(e) => setMonth(e.target.value)}
                className="border-input bg-background focus-visible:ring-ring mt-1 block rounded-md border px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="mode" className="text-muted-foreground text-xs font-medium">
                Mode
              </label>
              <select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as 'RANDOM' | 'ALGORITHMIC')}
                className="border-input bg-background focus-visible:ring-ring mt-1 block rounded-md border px-2 py-1.5 text-sm"
              >
                <option value="RANDOM">Random (uniform)</option>
                <option value="ALGORITHMIC">Algorithmic (biased to rarer numbers)</option>
              </select>
            </div>
            <Button type="submit" disabled={busy === 'create'}>
              {busy === 'create' ? 'Creating…' : 'Create draft'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-heading mb-3 text-lg">All draws</h2>
        {loading || rows === null ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No draws yet.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((d) => (
              <li key={d.id}>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">
                          {d.month?.slice(0, 7)} — {d.mode}
                        </p>
                        <p
                          className={cn(
                            'text-sm',
                            d.status === 'PUBLISHED' && 'text-brand-600 font-medium',
                          )}
                        >
                          {d.status}
                        </p>
                        {d.generatedNumbers?.length > 0 ? (
                          <p className="text-muted-foreground mt-1 font-mono text-xs">
                            Numbers: {d.generatedNumbers.join(', ')}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {d.status !== 'PUBLISHED' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void simulate(d.id)}
                              disabled={busy?.startsWith(d.id) ?? false}
                            >
                              {busy === d.id + 's' ? '…' : 'Simulate'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => void publish(d.id)}
                              disabled={
                                d.status !== 'SIMULATED' || (busy?.startsWith(d.id) ?? false)
                              }
                            >
                              {busy === d.id + 'p' ? '…' : 'Publish'}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
