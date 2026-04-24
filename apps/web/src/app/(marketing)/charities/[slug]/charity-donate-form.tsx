'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

type Props = {
  charityId: string;
  signedIn: boolean;
};

/**
 * Whole currency units (e.g. INR rupees) — sent as amountCents in smallest units to the API.
 */
export function CharityDonateForm({ charityId, signedIn }: Props) {
  const [amount, setAmount] = useState('5');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!signedIn) {
    return (
      <p className="text-muted-foreground text-sm">
        <a href="/sign-in" className="text-primary font-medium underline-offset-4 hover:underline">
          Sign in
        </a>{' '}
        to make a one-time donation.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const major = parseFloat(amount);
    if (Number.isNaN(major) || major < 1) {
      setError('Enter at least 1 in your currency (whole units).');
      return;
    }
    const amountCents = Math.round(major * 100);
    if (amountCents < 100) {
      setError('Minimum amount is 1.00 in your currency.');
      return;
    }
    setLoading(true);
    try {
      const r = await apiFetch<{ url: string | null }>('/donations/checkout', {
        method: 'POST',
        body: JSON.stringify({ charityId, amountCents }),
      });
      if (r.url) {
        window.location.href = r.url;
        return;
      }
      setError('Checkout could not be started. Try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="donation-amount"
          className="text-muted-foreground mb-1 block text-sm font-medium"
        >
          Amount (whole currency units, e.g. INR ₹)
        </label>
        <input
          id="donation-amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full max-w-xs rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Processed in test mode with Stripe test cards when using test keys.
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Redirecting…' : 'Donate with Stripe'}
      </Button>
    </form>
  );
}
