/**
 * One-off: create test-mode Product + Prices in INR and print env lines.
 * Default: ₹5/month, ₹10/year (dev). Override with STRIPE_DEV_CURRENCY=usd|inr
 *
 * Run from apps/api: pnpm run stripe:seed-prices
 * Requires STRIPE_SECRET_KEY in .env
 *
 * Amounts: Stripe uses the smallest unit — INR uses paise (1 ₹ = 100 paise).
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import Stripe from 'stripe';

function loadEnvFile() {
  const p = join(__dirname, '..', '.env');
  if (!existsSync(p)) {
    throw new Error(`Missing ${p}`);
  }
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) {
      continue;
    }
    const i = t.indexOf('=');
    if (i === -1) {
      continue;
    }
    const key = t.slice(0, i);
    const val = t.slice(i + 1);
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvFile();
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY missing or invalid in apps/api/.env');
  }
  const currency = (process.env.STRIPE_DEV_CURRENCY || 'inr').toLowerCase() as
    | 'inr'
    | 'usd';

  const stripe = new Stripe(key);

  const isInr = currency === 'inr';
  const product = await stripe.products.create({
    name: 'GreenKind subscription (dev)',
    description: isInr
      ? 'Dev: ₹5/mo, ₹10/yr (INR) — set STRIPE_DEV_CURRENCY=usd for USD test prices'
      : 'Dev: $5/mo, $10/yr (USD)',
  });

  if (isInr) {
    // paise: ₹5 = 500, ₹10 = 1000
    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: 500,
      currency: 'inr',
      recurring: { interval: 'month' },
    });
    const yearly = await stripe.prices.create({
      product: product.id,
      unit_amount: 1000,
      currency: 'inr',
      recurring: { interval: 'year' },
    });
    // eslint-disable-next-line no-console
    printEnv(monthly.id, yearly.id, product.id, 'INR: ₹5/mo, ₹10/yr');
    return;
  }

  const monthly = await stripe.prices.create({
    product: product.id,
    unit_amount: 500,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  const yearly = await stripe.prices.create({
    product: product.id,
    unit_amount: 1000,
    currency: 'usd',
    recurring: { interval: 'year' },
  });
  // eslint-disable-next-line no-console
  printEnv(monthly.id, yearly.id, product.id, 'USD: $5/mo, $10/yr');
}

function printEnv(
  monthlyId: string,
  yearlyId: string,
  productId: string,
  label: string,
) {
  // eslint-disable-next-line no-console
  console.log('\n# Add these to apps/api/.env:');
  // eslint-disable-next-line no-console
  console.log(`STRIPE_PRICE_ID_MONTHLY=${monthlyId}`);
  // eslint-disable-next-line no-console
  console.log(`STRIPE_PRICE_ID_YEARLY=${yearlyId}`);
  // eslint-disable-next-line no-console
  console.log('\n# %s (test mode, product: %s)\n', label, productId);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
