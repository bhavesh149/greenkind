import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { Stripe as StripeTypes } from 'stripe/cjs/stripe.core.js';

import { type AppEnv } from '../config/env.schema';
import { PrismaService } from '../prisma/prisma.service';
import { CharitiesService } from './charities.service';

@Injectable()
export class DonationsService {
  private readonly log = new Logger(DonationsService.name);
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly charities: CharitiesService,
  ) {}

  private getStripe(): InstanceType<typeof Stripe> {
    if (this.stripe) {
      return this.stripe;
    }
    const key = this.config.get('STRIPE_SECRET_KEY', { infer: true });
    if (!key) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }
    this.stripe = new Stripe(key);
    return this.stripe;
  }

  /**
   * @returns true if this was a donation session (handled or skipped as duplicate);
   * false to let the billing module handle subscription checkouts.
   */
  async tryCompleteFromCheckoutSession(
    session: StripeTypes.Checkout.Session,
  ): Promise<boolean> {
    if (session.metadata?.type !== 'donation') {
      return false;
    }
    await this.completeFromCheckoutSession(session);
    return true;
  }

  private async completeFromCheckoutSession(
    session: StripeTypes.Checkout.Session,
  ) {
    const userId = session.client_reference_id ?? session.metadata?.userId;
    const charityId = session.metadata?.charityId;
    if (!userId || !charityId) {
      this.log.warn(
        'Donation checkout.session.completed missing userId/charityId',
      );
      return;
    }
    if (session.payment_status !== 'paid') {
      this.log.warn(`Donation session ${session.id} not paid, skip`);
      return;
    }
    const piId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!piId) {
      this.log.warn('Donation session missing payment_intent');
      return;
    }
    const amountCents = session.amount_total;
    if (amountCents == null) {
      this.log.warn('Donation session missing amount_total');
      return;
    }
    const existing = await this.prisma.donation.findUnique({
      where: { stripePaymentIntentId: piId },
    });
    if (existing) {
      return;
    }
    await this.prisma.donation.create({
      data: {
        userId,
        charityId,
        amountCents,
        stripePaymentIntentId: piId,
      },
    });
  }

  async createDonationCheckoutSession(
    userId: string,
    email: string,
    charityId: string,
    amountCents: number,
  ) {
    const ch = await this.charities.ensureActiveId(charityId);
    const currency = this.config
      .get('STRIPE_DONATION_CURRENCY', { infer: true })
      .toLowerCase();
    if (!/^[a-z]{3}$/.test(currency)) {
      throw new ServiceUnavailableException(
        'STRIPE_DONATION_CURRENCY must be 3 letters',
      );
    }
    const stripe = this.getStripe();
    const origin = this.config.get('FRONTEND_ORIGIN', { infer: true });
    return stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        type: 'donation',
        userId,
        charityId,
        amountCents: String(amountCents),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: {
              name: `Donation: ${ch.name}`,
              description:
                'One-time contribution (test mode when using test keys)',
            },
          },
        },
      ],
      success_url: `${origin}/charities/${ch.slug}?donation=success`,
      cancel_url: `${origin}/charities/${ch.slug}?donation=canceled`,
    });
  }
}
