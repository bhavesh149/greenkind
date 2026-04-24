'use client';

import { useCallback, useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

type Row = {
  id: string;
  name: string;
  slug: string;
  category: string;
  active: boolean;
  featured: boolean;
};

type ListRes = { total: number; items: Row[] };

export function CharitiesAdminClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = (await apiFetch<ListRes>('/admin/charities?limit=100&page=1', {
        method: 'GET',
      })) as ListRes;
      setRows(data.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Charities</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Directory (use API or direct DB to create; UI list is read-only for now).
        </p>
      </div>
      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      {loading || rows === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id}>
              <Card>
                <CardContent className="pt-4 text-sm">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-muted-foreground">
                    {c.slug} · {c.category} · {c.active ? 'active' : 'inactive'}
                    {c.featured ? ' · featured' : ''}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
