import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { type Request, type Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequireActiveSubscription } from '../common/decorators/require-subscription.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE } from './cookie.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { JwtUserPayload } from './jwt-payload';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create account (subscriber)' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access, refresh } = await this.auth.register(
      dto.email,
      dto.password,
      dto.name,
      dto.phone,
    );
    this.auth.setAuthCookies(res, access, refresh);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sign in with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access, refresh } = await this.auth.login(
      dto.email,
      dto.password,
    );
    this.auth.setAuthCookies(res, access, refresh);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Rotate access token using httpOnly refresh cookie',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const { access, refresh: newRefresh, user } = await this.auth.refresh(raw);
    this.auth.setAuthCookies(res, access, newRefresh);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Clear cookies and revoke refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const raw = req.cookies?.[REFRESH_COOKIE];
    await this.auth.logout(raw);
    this.auth.clearAuthCookies(res);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Current user profile (access cookie or Authorization header)',
  })
  async me(@CurrentUser() token: JwtUserPayload) {
    return this.formatMeResponse(await this.auth.getProfile(token.sub));
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update name and/or phone' })
  async patchMe(
    @CurrentUser() token: JwtUserPayload,
    @Body() body: UpdateProfileDto,
  ) {
    const u = await this.auth.updateProfile(token.sub, {
      name: body.name,
      phone: body.phone,
    });
    return this.formatMeResponse(u);
  }

  private formatMeResponse(u: Awaited<ReturnType<AuthService['getProfile']>>) {
    if (!u) {
      return null;
    }
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      charityContribution: u.charityContribution,
      selectedCharity: u.selectedCharity,
      subscription: u.subscription
        ? {
            plan: u.subscription.plan,
            status: u.subscription.status,
            currentPeriodEnd: u.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: u.subscription.cancelAtPeriodEnd,
          }
        : null,
    };
  }

  @Get('subscription-check')
  @RequireActiveSubscription()
  @ApiOperation({ summary: 'Example: subscriber with active plan only' })
  subOnly(@CurrentUser() u: JwtUserPayload) {
    return { ok: true, sub: u.sub, subscriptionStatus: u.subscriptionStatus };
  }

  @Get('admin-check')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Example: admin only' })
  adminOnly(@CurrentUser() u: JwtUserPayload) {
    return { ok: true, sub: u.sub, role: u.role };
  }
}
