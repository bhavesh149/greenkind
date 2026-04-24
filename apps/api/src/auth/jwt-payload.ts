import type { UserRole } from '@prisma/client';

/** Normalized subscription status for JWT + guards (not the full Prisma enum). */
export type SubscriptionClaim =
  | 'NONE'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'OTHER';

export type JwtUserPayload = {
  sub: string;
  email: string;
  role: UserRole;
  subscriptionStatus: SubscriptionClaim;
  iat?: number;
  exp?: number;
};
