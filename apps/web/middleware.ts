import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { AUTH_COOKIE } from '@/lib/auth';

const handleI18n = createMiddleware(routing);

// Paths that don't require authentication (locale-stripped)
const PUBLIC_PATHS = ['/login'];

// Derive locale pattern from routing config so adding a locale requires no changes here.
// Anchored with (?=/|$) so `/vienna` does not match locale `vi`.
const LOCALE_PREFIX_RE = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);

function isPublicPath(pathname: string): boolean {
  const stripped = pathname.replace(LOCALE_PREFIX_RE, '') || '/';
  return PUBLIC_PATHS.some((p) => stripped.startsWith(p));
}

function extractLocale(pathname: string): string {
  return pathname.match(LOCALE_PREFIX_RE)?.[1] ?? routing.defaultLocale;
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const locale = extractLocale(pathname);

  if (!isPublicPath(pathname) && !token) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath(pathname) && token) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return handleI18n(request);
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
