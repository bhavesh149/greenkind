import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

const publicAuthPaths = ['/sign-in', '/sign-up', '/forgot-password'];

function getSecret() {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s || s.length < 32) {
    throw new Error('JWT_ACCESS_SECRET (min 32 chars) must be set for middleware. See docs/ENV.md');
  }
  return new TextEncoder().encode(s);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicAuthPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/app')) {
    const token = request.cookies.get('gk_access')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const role = (payload as { role?: string }).role;
      if (!payload.sub) {
        throw new Error('invalid');
      }
      if (role !== 'SUBSCRIBER' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('gk_access')?.value;
    if (!token) {
      return NextResponse.redirect(
        new URL('/sign-in?next=' + encodeURIComponent(pathname), request.url),
      );
    }
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const role = (payload as { role?: string }).role;
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/app', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
