'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

type Res = { unread: number };

/**
 * Shown in the app shell: links to /app/notifications with an unread count when &gt; 0.
 */
export function NotificationBell() {
  const [unread, setUnread] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = (await apiFetch<Res>('/notifications?limit=1&page=1', { method: 'GET' })) as Res;
      setUnread(r.unread);
    } catch {
      setUnread(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Link
      href="/app/notifications"
      className={cn(
        'hover:text-foreground focus-visible:ring-ring/40 relative shrink-0 rounded-md px-1.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-sm',
        (unread ?? 0) > 0
          ? 'text-brand-600 dark:text-brand-300 font-medium'
          : 'text-muted-foreground',
      )}
    >
      Alerts
      {(unread ?? 0) > 0 ? (
        <span className="bg-brand-600 absolute -top-0.5 -right-0.5 min-w-[1rem] rounded-full px-1 text-center text-[0.65rem] leading-4 text-white">
          {unread! > 9 ? '9+' : unread}
        </span>
      ) : null}
    </Link>
  );
}
