'use client';

import { useAuthSession } from '@/components/providers/auth-session-provider';

/**
 * @deprecated prefer `useAuthSession` from `@/components/providers/auth-session-provider`
 * Single session fetch via root `AuthSessionProvider`.
 */
export function usePermissions() {
  return useAuthSession();
}
