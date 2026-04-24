'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

type ScoreRow = {
  id: string;
  scoreDate: string;
  scoreValue: number;
  createdAt: string;
  updatedAt: string;
};

type ListRes = { scores: ScoreRow[] };

export function ScoresClient() {
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ scoreDate: '', scoreValue: '' });

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = (await apiFetch<ListRes>('/scores', { method: 'GET' })) as ListRes;
      setRows(data.scores);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scores');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = new Date();
  const defaultDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const scoreDate = form.scoreDate || defaultDate;
    const scoreValue = parseInt(form.scoreValue, 10);
    if (Number.isNaN(scoreValue) || scoreValue < 1 || scoreValue > 45) {
      setError('Score must be between 1 and 45 (Stableford).');
      setSaving(false);
      return;
    }
    try {
      await apiFetch('/scores', {
        method: 'POST',
        body: JSON.stringify({ scoreDate, scoreValue }),
      });
      setForm({ scoreDate: '', scoreValue: '' });
      await load();
    } catch (er) {
      setError(er instanceof Error ? er.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    setError(null);
    try {
      await apiFetch(`/scores/${id}`, { method: 'DELETE' });
      await load();
    } catch (er) {
      setError(er instanceof Error ? er.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Scores</h1>
        <p className="text-muted-foreground mt-2 text-base max-w-2xl">
          Your last <strong>five</strong> unique round dates. Adding a new date when you already
          have five drops the <strong>oldest</strong> by date. You can change the value for a date
          by saving again for that day.
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Add or update a score</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={submit}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="sd" className="text-sm font-medium">
                Round date
              </label>
              <input
                id="sd"
                type="date"
                className="border-border bg-card ring-ring/40 h-10 rounded-md border px-3 text-sm outline-none focus:ring-2"
                value={form.scoreDate || defaultDate}
                onChange={(e) => setForm((f) => ({ ...f, scoreDate: e.target.value }))}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="sv" className="text-sm font-medium">
                Stableford (1–45)
              </label>
              <input
                id="sv"
                type="number"
                min={1}
                max={45}
                inputMode="numeric"
                className="border-border bg-card ring-ring/40 h-10 w-28 rounded-md border px-3 text-sm outline-none focus:ring-2"
                placeholder="e.g. 36"
                value={form.scoreValue}
                onChange={(e) => setForm((f) => ({ ...f, scoreValue: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your last five (newest first)</CardTitle>
        </CardHeader>
        <CardContent>
          {rows === null ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No scores yet — add your first above.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <span>
                    <span className="font-medium tabular-nums">{r.scoreValue}</span>
                    <span className="text-muted-foreground"> pts — {r.scoreDate}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn('text-destructive h-8', deleting === r.id && 'opacity-50')}
                    disabled={deleting !== null}
                    onClick={() => void remove(r.id)}
                  >
                    {deleting === r.id ? '…' : 'Remove'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
