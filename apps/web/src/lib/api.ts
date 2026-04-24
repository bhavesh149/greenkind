/** BFF: browser calls `fetch(/v1/...)`; Next rewrites to the API. Auth uses httpOnly `gk_access` + `gk_refresh` cookies. */
const base = '/v1';

export function v1Path(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p.startsWith('/v1')) {
    return p;
  }
  return `${base}${p}`;
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(v1Path(path), {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (res.status === 204) {
    return {} as T;
  }
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  if (!res.ok) {
    const err = data as { message?: string; statusCode?: number };
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return data;
}

/** Unauthenticated read of public API routes (e.g. marketing pricing). */
export async function publicApiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(v1Path(path), {
    ...init,
    credentials: 'omit',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  if (!res.ok) {
    const err = data as { message?: string };
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return data;
}
