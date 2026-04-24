import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PassportStrategy } from '@nestjs/passport';
import { type Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type AppEnv } from '../config/env.schema';

import { cookieAccessExtractor } from './cookie.util';
import type { JwtUserPayload, SubscriptionClaim } from './jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService<AppEnv, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => cookieAccessExtractor(req),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: UserRole;
    subscriptionStatus: SubscriptionClaim;
  }): Promise<JwtUserPayload> {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      subscriptionStatus: payload.subscriptionStatus,
    };
  }
}
