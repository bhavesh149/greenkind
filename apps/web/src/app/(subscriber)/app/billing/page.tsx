import { Suspense } from 'react';

import { BillingClient } from './billing-client';

export default function BillingPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
      <BillingClient />
    </Suspense>
  );
}
