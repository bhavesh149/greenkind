/** Same values as Prisma `UserRole` (browser bundle avoids `@prisma/client`). */
type SignInRole = 'ADMIN' | 'SUBSCRIBER';

/**
 * Resolves a safe in-app path after sign-in from ?next=, using the account role.
 * - Subscribers that requested an admin path are sent to the app.
 * - Admins that land on the generic /app home are sent to /admin; deep /app/... and /admin/... are kept.
 * - Rejects open redirects (e.g. //example.com).
 */
export function getPostSignInDestination(nextParam: string | null, role: SignInRole): string {
  const fallback: string = role === 'ADMIN' ? '/admin' : '/app';
  const raw = nextParam?.trim();
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return fallback;
  }

  if (role === 'SUBSCRIBER') {
    if (isUnderPath(raw, '/admin')) {
      return '/app';
    }
    return raw;
  }

  if (isUnderPath(raw, '/admin')) {
    return raw;
  }
  if (getPathname(raw) === '/app') {
    return '/admin';
  }
  return raw;
}

function getPathname(relative: string): string {
  const u = new URL(relative, 'http://localhost');
  const p = u.pathname;
  if (p.length > 1 && p.endsWith('/')) {
    return p.replace(/\/+$/, '') || '/';
  }
  return p;
}

function isUnderPath(relative: string, base: string): boolean {
  const p = getPathname(relative);
  return p === base || p.startsWith(`${base}/`);
}
