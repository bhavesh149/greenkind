'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type PublicPricingResponse } from '@/lib/billing-pricing';
import { apiFetch, publicApiFetch } from '@/lib/api';
import {
  subscriptionCheckoutPlanSchema,
  type SubscriptionCheckoutPlan,
} from '@greenkind/validation';

type BillSummary = {
  subscription: {
    plan: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hasStripeCustomer: boolean;
  } | null;
};

export function BillingClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<SubscriptionCheckoutPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [pricing, setPricing] = useState<PublicPricingResponse | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const data = (await apiFetch<BillSummary>('/billing', { method: 'GET' })) as BillSummary;
    setSummary(data);
    try {
      const prices = await publicApiFetch<PublicPricingResponse>('/billing/pricing', {
        method: 'GET',
      });
      setPricing(prices);
    } catch {
      setPricing(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const checkout = sp.get('checkout');
        const sessionId = sp.get('session_id');
        if (checkout === 'success' && sessionId) {
          try {
            await apiFetch('/billing/confirm-checkout', {
              method: 'POST',
              body: JSON.stringify({ sessionId }),
            });
            await apiFetch('/auth/refresh', { method: 'POST' });
            router.replace('/app/billing');
            return;
          } catch (e) {
            if (!cancelled) {
              setError(e instanceof Error ? e.message : 'Could not confirm checkout');
            }
          }
        }
        if (!cancelled) {
          await load();
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load billing');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, router, sp]);

  const preselected = useMemo(
    () => subscriptionCheckoutPlanSchema.safeParse(sp.get('plan')).data,
    [sp],
  );

  async function startCheckout(plan: SubscriptionCheckoutPlan) {
    setCheckoutLoading(plan);
    setError(null);
    try {
      const r = (await apiFetch<{ url: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      })) as { url: string };
      if (r.url) {
        window.location.href = r.url;
        return;
      }
      setError('Checkout did not return a URL. Are Stripe price IDs set on the API?');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const r = (await apiFetch<{ url: string }>('/billing/portal', {
        method: 'POST',
      })) as { url: string };
      if (r.url) {
        window.location.href = r.url;
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Portal failed');
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading && !summary) {
    return <p className="text-muted-foreground text-sm">Loading billing…</p>;
  }

  const sub = summary?.subscription;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Subscribe through Stripe, manage your plan in the customer portal, and refresh your
          session after payment so the app shows your access.
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {preselected ? (
        <p className="text-muted-foreground text-sm">
          You chose{' '}
          <strong className="text-foreground">
            {preselected === 'YEARLY' ? 'yearly' : 'monthly'}
          </strong>{' '}
          from pricing — use the button below to open Stripe Checkout.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            {sub
              ? `${sub.plan} — ${sub.status}${
                  sub.currentPeriodEnd
                    ? ` — renews or ends after ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                    : ''
                }`
              : 'You do not have an active GreenKind subscription yet.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pricing ? (
            <ul className="text-muted-foreground space-y-1 text-sm">
              {pricing.plans.map((p) => (
                <li key={p.plan} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-foreground/90">
                    {p.plan === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                  </span>
                  <span className="text-foreground font-medium tabular-nums">{p.formatted}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => void startCheckout('MONTHLY')}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === 'MONTHLY' ? 'Redirecting…' : 'Subscribe monthly'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void startCheckout('YEARLY')}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === 'YEARLY' ? 'Redirecting…' : 'Subscribe yearly'}
            </Button>
            {sub?.hasStripeCustomer ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void openPortal()}
                disabled={portalLoading}
              >
                {portalLoading ? 'Opening…' : 'Manage in Stripe'}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
