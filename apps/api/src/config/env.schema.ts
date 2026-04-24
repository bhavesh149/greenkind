import { z } from 'zod';

const durationString = z.string().min(1);

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  /** Default matches local dev: API on 3000, web on 3001 (see docs/ENV.md). */
  PORT: z.coerce.number().int().min(1).default(3000),
  /** Bind address for HTTP server. Use 0.0.0.0 in containers; 127.0.0.1 is fine for local-only. */
  API_HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1).startsWith('postgres'),
  FRONTEND_ORIGIN: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: durationString.default('15m'),
  JWT_REFRESH_EXPIRES: durationString.default('7d'),

  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  /** Stripe Price IDs (Dashboard → Product catalog → product → copy Price ID) */
  STRIPE_PRICE_ID_MONTHLY: z.string().optional().default(''),
  STRIPE_PRICE_ID_YEARLY: z.string().optional().default(''),
  /** One-off donation Checkout line_items (price_data) currency, e.g. inr, usd */
  STRIPE_DONATION_CURRENCY: z.string().min(3).max(3).default('inr'),

  /** Portion of estimated subscription revenue that funds the monthly prize pool (0–1). */
  PRIZE_POOL_REVPCT: z.coerce.number().min(0).max(1).default(0.2),
  /** Assumed net monthly subscription in cents (used only to estimate the pool; adjust per market). */
  PRIZE_ESTIMATED_MRR_CENTS: z.coerce.number().int().min(0).default(1_500),

  /** Resend (https://resend.com). Leave empty to skip outbound email in dev. */
  RESEND_API_KEY: z.string().optional().default(''),
  /** Must be a verified domain sender in Resend, e.g. GreenKind <mail@yourdomain.com> */
  RESEND_FROM: z.string().optional().default(''),
  /**
   * If set to 1 or true, the daily notification digest job does not run (useful in tests/CI).
   * Omit or 0 in production to enable digest.
   */
  DISABLE_EMAIL_DIGEST: z
    .string()
    .optional()
    .default('0')
    .transform((s) => s === '1' || s === 'true'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`,
    );
  }
  return parsed.data;
}
