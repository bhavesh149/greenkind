'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

type Me = {
  id: string;
  charityContribution: number;
  selectedCharity: { id: string; name: string; slug: string } | null;
  subscription: { status: string } | null;
  role: string;
};

type CharitiesRes = {
  items: { id: string; name: string; slug: string; category: string }[];
};

function isActiveSubscriber(m: Me): boolean {
  if (m.role === 'ADMIN') {
    return true;
  }
  return m.subscription?.status === 'ACTIVE';
}

export function CharitySelectionClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<CharitiesRes['items']>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charityId, setCharityId] = useState('');
  const [pct, setPct] = useState(10);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [u, list] = await Promise.all([
        apiFetch<Me>('/auth/me'),
        apiFetch<CharitiesRes>('/charities?limit=100&page=1'),
      ]);
      setMe(u);
      setItems(list.items);
      setCharityId(u.selectedCharity?.id ?? '');
      setPct(
        u.charityContribution >= 10 && u.charityContribution <= 100 ? u.charityContribution : 10,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: {
        charityContribution: number;
        selectedCharityId?: string | null;
      } = { charityContribution: pct };
      if (charityId) {
        body.selectedCharityId = charityId;
      } else {
        body.selectedCharityId = null;
      }
      await apiFetch('/charities/me/selection', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      await load();
    } catch (er) {
      setError(er instanceof Error ? er.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !me) {
    return (
      <p className="text-muted-foreground text-sm">
        {loading ? 'Loading…' : (error ?? 'Sign in to manage your charity selection.')}
      </p>
    );
  }

  if (!isActiveSubscriber(me)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Active subscription required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Choose a charity and set what share of your subscription supports them (minimum 10%)
            once you have an active plan.
          </p>
          <Link
            href="/app/billing"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Go to billing
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div>
        <label htmlFor="charity" className="text-muted-foreground mb-1 block text-sm font-medium">
          Charity
        </label>
        <select
          id="charity"
          value={charityId}
          onChange={(e) => setCharityId(e.target.value)}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full max-w-md rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="">None (clears selection)</option>
          {items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pct" className="text-muted-foreground mb-1 block text-sm font-medium">
          Contribution (% of subscription)
        </label>
        <input
          id="pct"
          type="number"
          min={10}
          max={100}
          step={1}
          value={pct}
          onChange={(e) => setPct(parseInt(e.target.value, 10) || 10)}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full max-w-xs rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <p className="text-muted-foreground mt-1 text-xs">Minimum 10%, maximum 100%.</p>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>

      <p className="text-muted-foreground text-sm">
        Browse all partners on the{' '}
        <Link
          href="/charities"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          public charities directory
        </Link>
        .
      </p>
    </form>
  );
}
