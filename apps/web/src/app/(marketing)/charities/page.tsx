import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CharitiesListResponse } from '@/lib/charity-types';
import { fetchPublicV1Json } from '@/lib/server-api';
import { cn } from '@/lib/utils';

/** No static prerender: build env has no API; set `API_REWRITE_URL` on the host for runtime fetches. */
export const dynamic = 'force-dynamic';

export default async function CharitiesPage() {
  const data = await fetchPublicV1Json<CharitiesListResponse>('/charities?limit=50&page=1');
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Charities
        </h1>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed">
          Impact partners you can support. Subscribers choose a recipient and allocate at least 10%
          of their subscription. You can also make one-time donations on each charity’s page.
        </p>
      </div>
      {data.items.length === 0 ? (
        <p className="text-muted-foreground">No charities listed yet. Check back soon.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((c) => (
            <li key={c.id}>
              <Card
                className={cn('h-full transition-shadow', c.featured && 'ring-brand-500/30 ring-2')}
              >
                <CardHeader>
                  {c.featured ? (
                    <p className="text-brand-600 dark:text-brand-300 text-xs font-medium tracking-wide uppercase">
                      Featured
                    </p>
                  ) : null}
                  <CardTitle className="font-heading text-xl leading-snug">
                    <Link
                      href={`/charities/${c.slug}`}
                      className="hover:text-primary focus-visible:ring-ring/40 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {c.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{c.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3 text-sm">{c.category}</p>
                  <Link href={`/charities/${c.slug}`} className={buttonVariants({ size: 'sm' })}>
                    View & donate
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
