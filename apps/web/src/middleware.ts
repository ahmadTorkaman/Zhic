// apps/web/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'tag_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow the login page + its action through unauthenticated.
  if (pathname.startsWith('/atelier/tag/login')) return NextResponse.next();
  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (hasSession) return NextResponse.next();
  if (pathname.startsWith('/api/tag')) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/atelier/tag/login';
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/atelier/tag', '/atelier/tag/:path*', '/api/tag/:path*'] };
