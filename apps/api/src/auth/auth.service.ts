import { randomBytes, createHash } from 'crypto';

import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type User, type Subscription } from '@prisma/client';
import * as argon2 from 'argon2';
import { type AppEnv } from '../config/env.schema';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { REFRESH_COOKIE, ACCESS_COOKIE } from './cookie.util';
import type { JwtUserPayload } from './jwt-payload';
import { subscriptionToClaim } from './subscription-claim.util';

function hashRefreshToken(raw: string) {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly email: EmailService,
  ) {}

  async buildPayload(
    user: Pick<User, 'id' | 'email' | 'role'>,
    subscription: Pick<
      Subscription,
      'status' | 'currentPeriodEnd' | 'cancelAtPeriodEnd'
    > | null,
  ): Promise<Omit<JwtUserPayload, 'iat' | 'exp'>> {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      subscriptionStatus: subscriptionToClaim(subscription),
    };
  }

  async signAccessToken(payload: Omit<JwtUserPayload, 'iat' | 'exp'>) {
    return this.jwt.signAsync({ ...payload });
  }

  getRefreshTtlMs() {
    // default 7d
    return 7 * 24 * 60 * 60 * 1000;
  }

  getAccessTtlMs() {
    return 15 * 60 * 1000;
  }

  private parseExpiresToMs(fallback: number) {
    const raw = this.config.get('JWT_REFRESH_EXPIRES', { infer: true }) || '7d';
    if (/^\d+$/.test(String(raw))) {
      return parseInt(String(raw), 10) * 1000;
    }
    const m = String(raw).match(/^(\d+)([smhd])$/i);
    if (!m) {
      return fallback;
    }
    const n = parseInt(m[1], 10);
    const u = m[2].toLowerCase();
    const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[u] || 1;
    return n * mult;
  }

  getRefreshCookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'lax' as const,
      maxAge: this.parseExpiresToMs(this.getRefreshTtlMs()),
      path: '/',
    };
  }

  getAccessCookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'lax' as const,
      maxAge: this.getAccessTtlMs(),
      path: '/',
    };
  }

  setAuthCookies(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res: { cookie: (n: string, v: string, o: any) => void },
    access: string,
    refreshRaw: string,
  ) {
    res.cookie(ACCESS_COOKIE, access, this.getAccessCookieOptions());
    res.cookie(REFRESH_COOKIE, refreshRaw, this.getRefreshCookieOptions());
  }

  clearAuthCookies(res: {
    clearCookie: (n: string, o: { path: string }) => void;
  }) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  async register(
    email: string,
    password: string,
    name: string,
    phone?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone || null,
      },
    });
    void this.email
      .sendWelcome({ to: user.email, name: user.name })
      .catch((err: unknown) => {
        this.log.warn(
          `Welcome email: ${err instanceof Error ? err.message : err}`,
        );
      });
    return this.loginWithUser(user, null);
  }

  private async createRefreshToken(userId: string) {
    const raw = randomBytes(48).toString('hex');
    const tokenHash = hashRefreshToken(raw);
    const expiresAt = new Date(
      Date.now() + this.parseExpiresToMs(this.getRefreshTtlMs()),
    );
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return raw;
  }

  private async loadSubscription(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async loginWithUser(user: User, subscription: Subscription | null) {
    const sub = subscription ?? (await this.loadSubscription(user.id));
    const payload = await this.buildPayload(user, sub);
    const access = await this.signAccessToken(payload);
    const refresh = await this.createRefreshToken(user.id);
    return { user, access, refresh };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const subscription = await this.loadSubscription(user.id);
    return this.loginWithUser(user, subscription);
  }

  async refresh(refreshRaw: string | undefined) {
    if (!refreshRaw) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const tokenHash = hashRefreshToken(refreshRaw);
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = record.user;
    const subscription = await this.loadSubscription(user.id);
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.loginWithUser(user, subscription);
  }

  async logout(refreshRaw: string | undefined) {
    if (refreshRaw) {
      const tokenHash = hashRefreshToken(refreshRaw);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        selectedCharity: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string | null },
  ) {
    const update: { name?: string; phone?: string | null } = {};
    if (data.name !== undefined) {
      update.name = data.name;
    }
    if (data.phone !== undefined) {
      update.phone = data.phone;
    }
    if (Object.keys(update).length === 0) {
      return this.getProfile(userId);
    }
    await this.prisma.user.update({ where: { id: userId }, data: update });
    return this.getProfile(userId);
  }
}
