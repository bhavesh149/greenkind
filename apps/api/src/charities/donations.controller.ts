import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/jwt-payload';
import { AuthService } from '../auth/auth.service';
import { DonationCheckoutDto } from './dto/donation-checkout.dto';
import { DonationsService } from './donations.service';

@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(
    private readonly donations: DonationsService,
    private readonly auth: AuthService,
  ) {}

  @Post('checkout')
  @ApiOperation({
    summary:
      'One-time donation via Stripe Checkout (payment mode); user must be signed in',
  })
  async checkout(
    @CurrentUser() u: JwtUserPayload,
    @Body() body: DonationCheckoutDto,
  ) {
    const profile = await this.auth.getProfile(u.sub);
    if (!profile?.email) {
      throw new BadRequestException(
        'Profile email is required for donation checkout',
      );
    }
    const session = await this.donations.createDonationCheckoutSession(
      u.sub,
      profile.email,
      body.charityId,
      body.amountCents,
    );
    if (!session.url) {
      return { url: null };
    }
    return { url: session.url, sessionId: session.id };
  }
}
