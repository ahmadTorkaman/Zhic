import { NextResponse, type NextRequest } from 'next/server';

/**
 * Basic-auth gate for staging preview.
 *
 * Enabled whenever `ZHIC_STAGING_USER` + `ZHIC_STAGING_PASS` are both set.
 * In production we leave both blank (see `ops/env.example`) and this
 * middleware becomes a no-op pass-through.
 */
const STAGING_USER = process.env.ZHIC_STAGING_USER;
const STAGING_PASS = process.env.ZHIC_STAGING_PASS;
const ENABLED = Boolean(STAGING_USER && STAGING_PASS);

export function middleware(req: NextRequest) {
  if (!ENABLED) return NextResponse.next();

  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(':');
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (user === STAGING_USER && pass === STAGING_PASS) {
        return NextResponse.next();
      }
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Zhic staging"' },
  });
}

export const config = {
  matcher: [
    // Everything except Next internals + public assets
    '/((?!_next/static|_next/image|favicon.ico|fonts|invoices|docs).*)',
  ],
};
