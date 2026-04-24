import { Subscription, SubscriptionStatus } from '@prisma/client';

import type { SubscriptionClaim } from './jwt-payload';

export function subscriptionToClaim(
  sub: Pick<
    Subscription,
    'status' | 'currentPeriodEnd' | 'cancelAtPeriodEnd'
  > | null,
): SubscriptionClaim {
  if (!sub) {
    return 'NONE';
  }
  const now = new Date();
  if (sub.status === SubscriptionStatus.ACTIVE) {
    if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) {
      return 'PAST_DUE';
    }
    return 'ACTIVE';
  }
  if (sub.status === SubscriptionStatus.PAST_DUE) {
    return 'PAST_DUE';
  }
  if (sub.status === SubscriptionStatus.CANCELED) {
    return 'CANCELED';
  }
  if (
    sub.status === SubscriptionStatus.INCOMPLETE ||
    sub.status === SubscriptionStatus.INCOMPLETE_EXPIRED
  ) {
    return 'INCOMPLETE';
  }
  return 'OTHER';
}
