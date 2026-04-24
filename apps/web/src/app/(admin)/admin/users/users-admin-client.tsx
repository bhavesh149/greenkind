'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  subscription: { plan: string; status: string; currentPeriodEnd: string | null } | null;
};

type ListRes = { total: number; items: User[] };

export function UsersAdminClient() {
  const [rows, setRows] = useState<User[] | null>(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async (query: string) => {
    setErr(null);
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '50', page: '1' });
      if (query.trim()) {
        qs.set('q', query.trim());
      }
      const data = (await apiFetch<ListRes>(`/admin/users?${qs}`, { method: 'GET' })) as ListRes;
      setRows(data.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers('');
  }, [fetchUsers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Users</h1>
        <p className="text-muted-foreground mt-2 text-sm">Search by email or name (read-only).</p>
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void fetchUsers(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="border-input bg-background max-w-sm flex-1 rounded-md border px-2 py-1.5 text-sm"
        />
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      </form>
      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      {loading || rows === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((u) => (
            <li key={u.id}>
              <Card>
                <CardContent className="pt-4 text-sm">
                  <p className="font-medium">
                    {u.name} <span className="text-muted-foreground font-normal">— {u.email}</span>
                  </p>
                  <p className="text-muted-foreground">
                    {u.role} / {u.status}
                    {u.subscription ? (
                      <>
                        {' '}
                        · sub: {u.subscription.status} ({u.subscription.plan})
                      </>
                    ) : (
                      ' · no subscription record'
                    )}
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
