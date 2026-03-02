import { NextResponse, type NextRequest } from 'next/server';

/**
 * Lightweight middleware — only checks for the presence of a Supabase
 * session cookie. The real auth verification (supabase.auth.getUser)
 * happens in the server-side CMS layout, which has full Node.js runtime.
 *
 * Keeping Supabase imports OUT of middleware reduces the bundle from
 * ~75 kB to < 1 kB, preventing Vercel Edge deployment failures.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  const isAdminRoute = pathname.startsWith('/admin');

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // Supabase stores the session in a cookie starting with "sb-" and
  // ending with "-auth-token". Presence of this cookie indicates an
  // active (or recently active) session.
  const hasSession = request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  // No session → redirect to login (except when already on login)
  if (!hasSession && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // Has session → redirect away from login to dashboard
  if (hasSession && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
