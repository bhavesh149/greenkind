'use client';

import { type Permission, type Role, can, Role as R } from '@greenkind/rbac';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiFetch } from '@/lib/api';

export type AuthMe = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUBSCRIBER';
  subscription: unknown;
} | null;

type Ctx = {
  me: AuthMe | undefined;
  /** Settled session role: `undefined` = still loading /auth/me. */
  role: 'ADMIN' | 'SUBSCRIBER' | null | undefined;
  error: string | null;
  refetch: () => Promise<void>;
  clearSession: () => void;
  can: (permission: Permission) => boolean;
  isAdmin: boolean;
};

const AuthSessionContext = createContext<Ctx | null>(null);

function toAppRole(r: 'ADMIN' | 'SUBSCRIBER'): Role {
  if (r === 'ADMIN') {
    return R.ADMIN;
  }
  return R.SUBSCRIBER;
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<AuthMe | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const u = await apiFetch<AuthMe>('/auth/me');
      setMe(u);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load user';
      if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized')) {
        setMe(null);
        setError(null);
        return;
      }
      setError(msg);
      setMe(null);
    }
  }, []);

  const clearSession = useCallback(() => {
    setMe(null);
    setError(null);
  }, []);

  /** Re-sync session after navigation (e.g. post-login redirect) — tokens are httpOnly cookies. */
  useEffect(() => {
    void refetch();
  }, [pathname, refetch]);

  const value = useMemo<Ctx>(
    () => ({
      me,
      role: me === undefined ? undefined : (me?.role ?? null),
      error,
      refetch,
      clearSession,
      can: (permission: Permission) => {
        if (!me) {
          return false;
        }
        return can(toAppRole(me.role), permission);
      },
      /** True only when profile is loaded and role is ADMIN (not for subscribers). */
      isAdmin: me != null && me.role === 'ADMIN',
    }),
    [me, error, refetch, clearSession],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): Ctx {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return ctx;
}
