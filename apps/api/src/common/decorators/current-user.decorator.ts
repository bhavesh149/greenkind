import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { JwtUserPayload } from '../../auth/jwt-payload';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUserPayload | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as JwtUserPayload | undefined;
  },
);
