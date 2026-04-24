import { cookies } from 'next/headers';

import type { CharityCard } from '@/lib/charity-types';

/**
 * Server-side fetch to the API. Default is local Nest on :3000; in production set `API_REWRITE_URL`
 * to your API origin (Vercel, Railway, etc.) so RSC fetches are not `127.0.0.1` during SSR.
 * On Vercel without `API_REWRITE_URL`, same-origin is used so `/v1` rewrites in `next.config` apply.
 */
export function getInternalApiBase(): string {
  if (process.env.API_REWRITE_URL) {
    return process.env.API_REWRITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://127.0.0.1:3000';
}

export async function fetchPublicV1Json<T>(path: string, init?: RequestInit): Promise<T> {
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `${getInternalApiBase()}/v1${p}`;
  const res = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
    next: { revalidate: 60 },
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  if (!res.ok) {
    const err = data as { message?: string };
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchCharityBySlug(slug: string) {
  const url = `${getInternalApiBase()}/v1/charities/${encodeURIComponent(slug)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (res.status === 404) {
    return null;
  }
  const text = await res.text();
  const data = text
    ? (JSON.parse(text) as { charity?: Record<string, unknown>; message?: string })
    : {};
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  if (!data.charity) {
    return null;
  }
  return data.charity as CharityCard;
}

/** Current user from API when access cookie is present (server components / RSC). */
export async function getSessionUserOnServer(): Promise<{ id: string } | null> {
  const jar = await cookies();
  const parts = jar.getAll().map((c) => `${c.name}=${c.value}`);
  if (parts.length === 0) {
    return null;
  }
  const res = await fetch(`${getInternalApiBase()}/v1/auth/me`, {
    headers: { Cookie: parts.join('; ') },
    cache: 'no-store',
  });
  if (!res.ok) {
    return null;
  }
  const u = (await res.json()) as { id?: string } | null;
  if (!u?.id) {
    return null;
  }
  return { id: u.id };
}
