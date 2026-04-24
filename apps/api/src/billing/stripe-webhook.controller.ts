import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { type Request } from 'express';
import Stripe from 'stripe';
import type { Stripe as StripeTypes } from 'stripe/cjs/stripe.core.js';

import { Public } from '../common/decorators/public.decorator';
import { BillingService } from './billing.service';

/**
 * Webhook: raw body is required for signature verification (see main.ts).
 * Path: POST /v1/stripe/webhook
 */
@ApiExcludeController()
@Controller('stripe')
@SkipThrottle()
export class StripeWebhookController {
  constructor(private readonly billing: BillingService) {}

  @Public()
  @Post('webhook')
  async handle(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature');
    }
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw?.length) {
      throw new BadRequestException(
        'Missing raw body (configure JSON parser verify in main)',
      );
    }
    let event: StripeTypes.Event;
    try {
      event = this.billing.handleStripeWebhook(raw, signature);
    } catch (e) {
      if (e instanceof Stripe.errors.StripeSignatureVerificationError) {
        throw new BadRequestException('Invalid signature');
      }
      throw e;
    }
    const result = await this.billing.processStripeEvent(event);
    return { received: true, duplicate: result.duplicate };
  }
}
