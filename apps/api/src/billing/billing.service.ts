import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import type { Stripe as StripeTypes } from 'stripe/cjs/stripe.core.js';

import { type AppEnv } from '../config/env.schema';
import { DonationsService } from '../charities/donations.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private readonly log = new Logger(BillingService.name);
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly donations: DonationsService,
    private readonly email: EmailService,
  ) {}

  private getStripe(): InstanceType<typeof Stripe> {
    if (this.stripe) {
      return this.stripe;
    }
    const key = this.config.get('STRIPE_SECRET_KEY', { infer: true });
    if (!key) {
      throw new ServiceUnavailableException(
        'Stripe is not configured (STRIPE_SECRET_KEY).',
      );
    }
    this.stripe = new Stripe(key);
    return this.stripe;
  }

  private getPriceId(plan: SubscriptionPlan): string {
    const k =
      plan === SubscriptionPlan.MONTHLY
        ? 'STRIPE_PRICE_ID_MONTHLY'
        : 'STRIPE_PRICE_ID_YEARLY';
    const id = this.config.get(k, { infer: true });
    if (!id) {
      throw new ServiceUnavailableException(
        `Set ${k} in apps/api/.env to your Stripe Price ID`,
      );
    }
    return id;
  }

  private planFromPriceId(priceId: string): SubscriptionPlan | null {
    const m = this.config.get('STRIPE_PRICE_ID_MONTHLY', { infer: true });
    const y = this.config.get('STRIPE_PRICE_ID_YEARLY', { infer: true });
    if (priceId === m) {
      return SubscriptionPlan.MONTHLY;
    }
    if (priceId === y) {
      return SubscriptionPlan.YEARLY;
    }
    return null;
  }

  private mapStripeStatus(
    s: StripeTypes.Subscription.Status,
  ): SubscriptionStatus {
    const map: Record<StripeTypes.Subscription.Status, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      trialing: SubscriptionStatus.TRIAL,
      unpaid: SubscriptionStatus.UNPAID,
      paused: SubscriptionStatus.ACTIVE,
    };
    return map[s] ?? SubscriptionStatus.INCOMPLETE;
  }

  private async applyStripeSubscription(
    stripeSub: StripeTypes.Subscription,
    clientUserId: string | null,
  ) {
    const firstItem = stripeSub.items.data[0];
    if (!firstItem) {
      this.log.warn(
        `Subscription ${stripeSub.id} has no line items; skipping.`,
      );
      return;
    }
    const periodStart = toDateOrNull(firstItem.current_period_start);
    const periodEnd = toDateOrNull(firstItem.current_period_end);
    const price = firstItem.price;
    const priceId = typeof price === 'string' ? price : price.id;
    const plan = this.planFromPriceId(priceId);
    if (!plan) {
      this.log.warn(`Unknown price id ${priceId}; cannot map to plan.`);
    }

    const userIdFromMeta = stripeSub.metadata?.userId ?? null;
    const userId: string | null = clientUserId ?? userIdFromMeta;

    const customerId =
      typeof stripeSub.customer === 'string'
        ? stripeSub.customer
        : stripeSub.customer?.id;
    if (!customerId) {
      this.log.warn(`Subscription ${stripeSub.id} has no customer; skipping.`);
      return;
    }

    const existing = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSub.id },
    });
    if (existing) {
      const resolvedPlan = plan ?? existing.plan;
      const status = this.mapStripeStatus(stripeSub.status);
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          plan: resolvedPlan,
          status,
          stripeCustomerId: customerId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
        },
      });
      return;
    }

    if (!userId) {
      this.log.warn(
        `No user id for new subscription ${stripeSub.id} (set metadata and client_reference_id in Checkout).`,
      );
      return;
    }

    const resolvedPlan = plan;
    if (!resolvedPlan) {
      this.log.warn(
        `Could not map price to plan for subscription ${stripeSub.id}; skip create.`,
      );
      return;
    }

    const status = this.mapStripeStatus(stripeSub.status);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: resolvedPlan,
        status,
        provider: 'stripe',
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSub.id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
      },
      update: {
        plan: resolvedPlan,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSub.id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
      },
    });
  }

  async createCheckoutSession(
    userId: string,
    email: string,
    plan: SubscriptionPlan,
  ) {
    const priceId = this.getPriceId(plan);
    const stripe = this.getStripe();
    const origin = this.config.get('FRONTEND_ORIGIN', { infer: true });
    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const customerId = existing?.stripeCustomerId;

    return stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      customer: customerId ?? undefined,
      customer_email: !customerId ? email : undefined,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
      success_url: `${origin}/app/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
    });
  }

  async createPortalSession(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!sub?.stripeCustomerId) {
      throw new BadRequestException(
        'No Stripe customer yet — subscribe with Checkout first.',
      );
    }
    const stripe = this.getStripe();
    const origin = this.config.get('FRONTEND_ORIGIN', { infer: true });
    return stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${origin}/app/billing`,
    });
  }

  /**
   * Client calls after success redirect; fixes race with webhook and refreshes source of truth from Stripe.
   */
  async confirmCheckoutSession(userId: string, sessionId: string) {
    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });
    if (session.client_reference_id && session.client_reference_id !== userId) {
      throw new BadRequestException(
        'Session does not belong to the current user.',
      );
    }
    if (session.metadata?.userId && session.metadata.userId !== userId) {
      throw new BadRequestException(
        'Session does not belong to the current user.',
      );
    }
    const subRef = session.subscription;
    if (!subRef) {
      throw new BadRequestException(
        'Checkout session has no subscription yet.',
      );
    }
    const sub =
      typeof subRef === 'string'
        ? await stripe.subscriptions.retrieve(subRef)
        : (subRef as StripeTypes.Subscription);
    if (!sub) {
      throw new BadRequestException('Could not load subscription.');
    }
    await this.applyStripeSubscription(sub, userId);
    return { ok: true as const };
  }

  async markSubscriptionCanceledByStripeId(stripeSubscriptionId: string) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId },
      data: { status: SubscriptionStatus.CANCELED },
    });
  }

  handleStripeWebhook(rawBody: Buffer, signature: string): StripeTypes.Event {
    const wh = this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
    if (!wh) {
      throw new ServiceUnavailableException('STRIPE_WEBHOOK_SECRET is not set');
    }
    return this.getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      wh,
    ) as StripeTypes.Event;
  }

  async processStripeEvent(event: StripeTypes.Event) {
    const already = await this.prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });
    if (already) {
      return { duplicate: true as const };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as StripeTypes.Checkout.Session;
          const handledDonation =
            await this.donations.tryCompleteFromCheckoutSession(session);
          if (handledDonation) {
            break;
          }
          const userId =
            session.client_reference_id ?? session.metadata?.userId ?? null;
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id;
          if (subId) {
            const sub = await this.getStripe().subscriptions.retrieve(subId);
            await this.applyStripeSubscription(sub, userId);
            if (userId) {
              const u = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, name: true },
              });
              if (u) {
                void this.email
                  .sendSubscriptionThankYou({ to: u.email, name: u.name })
                  .catch((e: unknown) => {
                    this.log.warn(
                      `Subscription email: ${e instanceof Error ? e.message : e}`,
                    );
                  });
              }
            }
          }
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const sub = event.data.object as StripeTypes.Subscription;
          const userId = sub.metadata?.userId ?? null;
          await this.applyStripeSubscription(sub, userId);
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object as StripeTypes.Subscription;
          if (sub.id) {
            await this.markSubscriptionCanceledByStripeId(sub.id);
          }
          break;
        }
        case 'invoice.paid': {
          const inv = event.data.object as StripeTypes.Invoice;
          const parent = inv.parent;
          const subRef =
            parent?.type === 'subscription_details' &&
            parent.subscription_details
              ? parent.subscription_details.subscription
              : null;
          const subId = typeof subRef === 'string' ? subRef : subRef?.id;
          if (subId) {
            const sub = await this.getStripe().subscriptions.retrieve(subId);
            await this.applyStripeSubscription(
              sub,
              sub.metadata?.userId ?? null,
            );
            await this.prisma.subscription.updateMany({
              where: { stripeSubscriptionId: sub.id },
              data: { lastPaymentAt: new Date() },
            });
          }
          break;
        }
        default:
          break;
      }
    } catch (err) {
      this.log.error(
        `Handler error for event ${event.id} (${event.type}): ${
          err instanceof Error ? err.message : err
        }`,
      );
      throw err;
    }

    try {
      await this.prisma.stripeEvent.create({
        data: {
          eventId: event.id,
          type: event.type,
          payload: JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      if (isPrismaUniqueViolation(e)) {
        return { duplicate: true as const };
      }
      throw e;
    }

    return { duplicate: false as const };
  }

  /**
   * Public display prices for marketing + billing (Stripe when configured, else dev fallback).
   */
  async getPublicPricing(): Promise<{
    plans: Array<{
      plan: 'MONTHLY' | 'YEARLY';
      currency: string;
      amountCents: number;
      interval: 'month' | 'year';
      formatted: string;
    }>;
    source: 'stripe' | 'fallback';
    yearlySavingsPercent: number | null;
  }> {
    const key = this.config.get('STRIPE_SECRET_KEY', { infer: true });
    if (!key) {
      return { ...this.getFallbackPlanPrices(), source: 'fallback' as const };
    }
    const mId = this.config.get('STRIPE_PRICE_ID_MONTHLY', { infer: true });
    const yId = this.config.get('STRIPE_PRICE_ID_YEARLY', { infer: true });
    if (!mId || !yId) {
      return { ...this.getFallbackPlanPrices(), source: 'fallback' as const };
    }
    try {
      const stripe = this.getStripe();
      const [mp, yp] = await Promise.all([
        stripe.prices.retrieve(mId),
        stripe.prices.retrieve(yId),
      ]);
      const mAmount = mp.unit_amount ?? 0;
      const yAmount = yp.unit_amount ?? 0;
      const mCur = (mp.currency || 'usd').toLowerCase();
      const yCur = (yp.currency || 'usd').toLowerCase();
      if (mCur !== yCur) {
        this.log.warn(
          'Monthly/yearly price currencies differ; using fallback for public pricing',
        );
        return { ...this.getFallbackPlanPrices(), source: 'fallback' as const };
      }
      const plans: Array<{
        plan: 'MONTHLY' | 'YEARLY';
        currency: string;
        amountCents: number;
        interval: 'month' | 'year';
        formatted: string;
      }> = [
        {
          plan: 'MONTHLY',
          currency: mCur,
          amountCents: mAmount,
          interval: 'month',
          formatted: formatPlanDisplay(mAmount, mCur, 'month'),
        },
        {
          plan: 'YEARLY',
          currency: mCur,
          amountCents: yAmount,
          interval: 'year',
          formatted: formatPlanDisplay(yAmount, mCur, 'year'),
        },
      ];
      return {
        plans,
        source: 'stripe',
        yearlySavingsPercent: computeYearlySavingsPercent(mAmount, yAmount),
      };
    } catch (e) {
      this.log.warn('getPublicPricing: Stripe error; using fallback', e);
      return { ...this.getFallbackPlanPrices(), source: 'fallback' as const };
    }
  }

  private getFallbackPlanPrices(): {
    plans: Array<{
      plan: 'MONTHLY' | 'YEARLY';
      currency: string;
      amountCents: number;
      interval: 'month' | 'year';
      formatted: string;
    }>;
    yearlySavingsPercent: number | null;
  } {
    const c = (
      this.config.get('STRIPE_DONATION_CURRENCY', { infer: true }) || 'inr'
    ).toLowerCase();
    // Matches apps/api/scripts/create-stripe-prices.ts (500/1000 minor units = ₹5 / ₹10 or $5 / $10 in dev)
    const monthlyCents = 500;
    const yearlyCents = 1000;
    return {
      plans: [
        {
          plan: 'MONTHLY',
          currency: c,
          amountCents: monthlyCents,
          interval: 'month',
          formatted: formatPlanDisplay(monthlyCents, c, 'month'),
        },
        {
          plan: 'YEARLY',
          currency: c,
          amountCents: yearlyCents,
          interval: 'year',
          formatted: formatPlanDisplay(yearlyCents, c, 'year'),
        },
      ],
      yearlySavingsPercent: computeYearlySavingsPercent(
        monthlyCents,
        yearlyCents,
      ),
    };
  }
}

function formatPlanDisplay(
  amountCents: number,
  currency: string,
  interval: 'month' | 'year',
): string {
  const major = amountCents / 100;
  const cur = currency.toLowerCase() === 'inr' ? 'INR' : currency.toUpperCase();
  const locale = cur === 'INR' ? 'en-IN' : 'en-US';
  const fmt = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cur,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  const s = fmt.format(major);
  return interval === 'month' ? `${s} / month` : `${s} / year`;
}

function computeYearlySavingsPercent(
  monthlyCents: number,
  yearlyCents: number,
): number | null {
  if (monthlyCents <= 0 || yearlyCents < 0) {
    return null;
  }
  const annualizedMonthly = monthlyCents * 12;
  if (annualizedMonthly <= yearlyCents) {
    return null;
  }
  return Math.round(
    ((annualizedMonthly - yearlyCents) / annualizedMonthly) * 100,
  );
}

function toDateOrNull(u: number | undefined): Date | null {
  if (u == null) {
    return null;
  }
  return new Date(u * 1000);
}

function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
  );
}
