import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCharityBySlug, getSessionUserOnServer } from '@/lib/server-api';

import { CharityDonateForm } from './charity-donate-form';

/** Match /charities list: fetch API at request time, not at build (see `API_REWRITE_URL`). */
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ donation?: string }>;
};

export default async function CharityDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { donation } = await searchParams;
  const charity = await fetchCharityBySlug(slug);
  if (!charity) {
    notFound();
  }
  const session = await getSessionUserOnServer();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {donation === 'success' ? (
        <div className="border-brand-500/30 bg-brand-50/50 dark:bg-brand-950/30 mb-8 rounded-lg border px-4 py-3 text-sm">
          Thank you — your donation is processing. You will see confirmation from Stripe.
        </div>
      ) : null}
      {donation === 'canceled' ? (
        <div className="mb-8 rounded-lg border border-amber-500/30 bg-amber-50/50 px-4 py-3 text-sm dark:bg-amber-950/20">
          Checkout was canceled. You can try again when you are ready.
        </div>
      ) : null}

      <p className="text-muted-foreground mb-2 text-sm">{charity.category}</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {charity.name}
      </h1>
      <p className="text-muted-foreground mt-4 whitespace-pre-wrap leading-relaxed">
        {charity.description}
      </p>

      <div className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">One-time donation</CardTitle>
          </CardHeader>
          <CardContent>
            <CharityDonateForm charityId={charity.id} signedIn={!!session} />
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 flex flex-wrap gap-2">
        <Link href="/charities" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Back to directory
        </Link>
        {session ? (
          <Link href="/app/charity" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Subscription charity settings
          </Link>
        ) : null}
      </p>
    </main>
  );
}
