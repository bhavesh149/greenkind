import { z } from 'zod';

/** Shared DTOs between NestJS and the web app. Expand in later phases. */
export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8);

export const signUpBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(120),
});
export type SignUpBody = z.infer<typeof signUpBodySchema>;

export const signInBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export type SignInBody = z.infer<typeof signInBodySchema>;

/** Matches Prisma `SubscriptionPlan` (Stripe Checkout) */
export const subscriptionCheckoutPlanSchema = z.enum(['MONTHLY', 'YEARLY']);
export type SubscriptionCheckoutPlan = z.infer<typeof subscriptionCheckoutPlanSchema>;

/** Calendar date in UTC (YYYY-MM-DD) + Stableford points (1–45) */
export const scoreUpsertBodySchema = z.object({
  scoreDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD (UTC date)'),
  scoreValue: z.coerce.number().int().min(1).max(45),
});
export type ScoreUpsertBody = z.infer<typeof scoreUpsertBodySchema>;

export const charityListQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CharityListQuery = z.infer<typeof charityListQuerySchema>;

export const charitySelectionBodySchema = z.object({
  selectedCharityId: z.string().uuid().nullable(),
  charityContribution: z.coerce.number().int().min(10).max(100),
});
export type CharitySelectionBody = z.infer<typeof charitySelectionBodySchema>;

export const adminCharityCreateBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(8000),
  category: z.string().min(1).max(80),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});
export type AdminCharityCreateBody = z.infer<typeof adminCharityCreateBodySchema>;

export const adminCharityUpdateBodySchema = adminCharityCreateBodySchema
  .partial()
  .extend({ slug: z.string().min(1).max(200).optional() });
export type AdminCharityUpdateBody = z.infer<typeof adminCharityUpdateBodySchema>;

export const donationCheckoutBodySchema = z.object({
  charityId: z.string().uuid(),
  /** Paise/cents; min 1 unit of account (e.g. 100 = ₹1 in INR) */
  amountCents: z.coerce.number().int().min(100).max(5_000_000),
});
export type DonationCheckoutBody = z.infer<typeof donationCheckoutBodySchema>;
