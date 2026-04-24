'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

type WinnerRow = {
  id: string;
  tier: number;
  matchCount: number;
  payoutAmountCents: number;
  verificationStatus: string;
  payoutStatus: string;
  proofImageKey: string | null;
  draw: { month: string; status: string; publishedAt: string | null };
};

type Res = { winners: WinnerRow[] };

function fmtMoney(c: number) {
  return (c / 100).toFixed(2);
}

export function WinningsClient() {
  const [rows, setRows] = useState<WinnerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proof, setProof] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = (await apiFetch<Res>('/winners/me', { method: 'GET' })) as Res;
      setRows(data.winners);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProof(id: string) {
    const v = proof[id]?.trim();
    if (!v || v.length < 8) {
      setError('Enter a proof link or storage key (8+ characters).');
      return;
    }
    setSaving(id);
    setError(null);
    try {
      await apiFetch(`/winners/${id}/proof`, {
        method: 'PATCH',
        body: JSON.stringify({ proofImageKey: v }),
      });
      await load();
    } catch (er) {
      setError(er instanceof Error ? er.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Winnings</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          When you win a tier, add a proof reference (URL to an image in your storage, or a key your
          team agreed on). An admin will verify before marking paid.
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {rows === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No wins yet. Good luck in the next draw.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((w) => (
            <li key={w.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-base">
                    {w.draw.month?.slice(0, 7)} — tier {w.tier} match —{' '}
                    {fmtMoney(w.payoutAmountCents)} (local currency units)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Verification: <strong>{w.verificationStatus}</strong> — Payout:{' '}
                    <strong>{w.payoutStatus}</strong>
                  </p>
                  {w.proofImageKey ? (
                    <p className="text-muted-foreground break-all">
                      Saved proof: {w.proofImageKey}
                    </p>
                  ) : null}
                  {w.verificationStatus === 'PENDING' && w.payoutStatus === 'PENDING' && (
                    <div className="mt-2 flex max-w-lg flex-col gap-2 sm:flex-row">
                      <input
                        value={proof[w.id] ?? ''}
                        onChange={(e) => setProof((m) => ({ ...m, [w.id]: e.target.value }))}
                        placeholder="https://… or storage key"
                        className="border-input bg-background focus-visible:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1.5"
                      />
                      <Button
                        type="button"
                        onClick={() => void saveProof(w.id)}
                        disabled={saving === w.id}
                      >
                        {saving === w.id ? 'Saving…' : 'Save proof'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
