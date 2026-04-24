import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';
import { CheckoutDto } from './dto/checkout.dto';
import { ConfirmCheckoutDto } from './dto/confirm-checkout.dto';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('pricing')
  @ApiOperation({
    summary: 'Public plan amounts for marketing (from Stripe or fallback)',
  })
  async publicPricing() {
    return this.billing.getPublicPricing();
  }

  @Get()
  @ApiOperation({
    summary:
      'Current subscription (from our DB; refresh token for JWT claim update)',
  })
  async summary(@CurrentUser() user: JwtUserPayload) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId: user.sub },
    });
    if (!sub) {
      return { subscription: null };
    }
    return {
      subscription: {
        plan: sub.plan,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        hasStripeCustomer: Boolean(sub.stripeCustomerId),
      },
    };
  }

  @Post('checkout')
  @ApiOperation({
    summary: 'Create Stripe Checkout (subscription) and return URL',
  })
  async checkout(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: CheckoutDto,
  ) {
    const u = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, email: true },
    });
    if (!u) {
      return { url: null };
    }
    const session = await this.billing.createCheckoutSession(
      u.id,
      u.email,
      body.plan,
    );
    if (!session.url) {
      return { url: null, error: 'No checkout URL from Stripe' };
    }
    return { url: session.url, sessionId: session.id };
  }

  @Post('portal')
  @ApiOperation({ summary: 'Create Stripe Customer Portal session URL' })
  async portal(@CurrentUser() user: JwtUserPayload) {
    const session = await this.billing.createPortalSession(user.sub);
    return { url: session.url };
  }

  @Post('confirm-checkout')
  @ApiOperation({
    summary:
      'Reconcile after Checkout success (avoids race before webhook; user must be logged in as buyer)',
  })
  async confirm(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: ConfirmCheckoutDto,
  ) {
    return this.billing.confirmCheckoutSession(user.sub, body.sessionId);
  }
}
