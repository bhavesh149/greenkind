import type { Request } from 'express';

import { type JwtUserPayload } from './jwt-payload';

export const ACCESS_COOKIE = 'gk_access';
export const REFRESH_COOKIE = 'gk_refresh';

export const cookieAccessExtractor = (req: Request): string | null => {
  if (
    req?.cookies?.[ACCESS_COOKIE] &&
    typeof req.cookies[ACCESS_COOKIE] === 'string'
  ) {
    return req.cookies[ACCESS_COOKIE];
  }
  return null;
};

export const payloadFromRequest = (
  req: Request & { user?: JwtUserPayload },
): JwtUserPayload | undefined => {
  return req.user;
};
