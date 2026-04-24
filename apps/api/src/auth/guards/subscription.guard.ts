import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { REQUIRE_SUBSCRIPTION_KEY } from '../../common/decorators/require-subscription.decorator';
import type { JwtUserPayload } from '../jwt-payload';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }
    const require = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!require) {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    const user: JwtUserPayload | undefined = req.user;
    if (!user) {
      return false;
    }
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    if (user.subscriptionStatus === 'ACTIVE') {
      return true;
    }
    throw new ForbiddenException('Active subscription required');
  }
}
