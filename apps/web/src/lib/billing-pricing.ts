export type PublicPlanPrice = {
  plan: 'MONTHLY' | 'YEARLY';
  currency: string;
  amountCents: number;
  interval: 'month' | 'year';
  formatted: string;
};

export type PublicPricingResponse = {
  plans: PublicPlanPrice[];
  source: 'stripe' | 'fallback';
  yearlySavingsPercent: number | null;
};
