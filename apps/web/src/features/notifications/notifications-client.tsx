'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

type Item = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

type ListRes = { total: number; unread: number; items: Item[] };

export function NotificationsClient() {
  const [data, setData] = useState<ListRes | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = (await apiFetch<ListRes>('/notifications?limit=50&page=1', {
        method: 'GET',
      })) as ListRes;
      setData(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    setBusy(id);
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  async function markAll() {
    setBusy('all');
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  if (err) {
    return <p className="text-destructive text-sm">{err}</p>;
  }
  if (!data) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {data.unread > 0 ? (
            <span>
              {data.unread} unread of {data.total}
            </span>
          ) : (
            <span>All caught up{data.total > 0 ? ` (${data.total} total)` : ''}.</span>
          )}
        </p>
        {data.unread > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void markAll()}
            disabled={busy !== null}
          >
            {busy === 'all' ? '…' : 'Mark all read'}
          </Button>
        ) : null}
      </div>
      {data.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No notifications yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.items.map((n) => (
            <li key={n.id}>
              <Card
                className={cn(
                  n.readAt
                    ? 'border-border/60 opacity-80'
                    : 'border-brand-500/20 bg-brand-50/30 dark:bg-brand-950/20',
                )}
              >
                <CardContent className="space-y-2 pt-4 text-sm">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted-foreground">{n.body}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                  {!n.readAt ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void markRead(n.id)}
                      disabled={busy !== null}
                    >
                      {busy === n.id ? '…' : 'Mark read'}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
