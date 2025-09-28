import { NextRequest, NextResponse } from 'next/server';

// Paths and their allowed roles
const accessRules: Array<{ path: string; roles: Array<'super-admin' | 'manager' | 'curator'> }> = [
  { path: '/mail', roles: ['super-admin', 'manager'] },
  { path: '/dashboard/invitations', roles: ['super-admin'] },
];

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // Determine if the current path needs protection and which roles are allowed
  const rule = accessRules.find((r) => pathname === r.path || pathname.startsWith(r.path + '/'));
  if (!rule) {
    return NextResponse.next();
  }

  try {
    // Call internal auth endpoint to resolve current admin + role.
    // Forward cookies for auth.
    const meRes = await fetch(`${origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });

    if (!meRes.ok) {
      // Not authenticated
      const url = new URL('/', origin);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const data = (await meRes.json()) as { admin?: { role?: 'super-admin' | 'manager' | 'curator' } };
    const role = data?.admin?.role;

    if (!role || !rule.roles.includes(role)) {
      // Authenticated but not authorized
      const url = new URL('/dashboard', origin);
      url.searchParams.set('denied', '1');
      return NextResponse.redirect(url);
    }

    // Authorized
    return NextResponse.next();
  } catch {
    // On error, be safe and redirect to home
    return NextResponse.redirect(new URL('/', origin));
  }
}

export const config = {
  matcher: ['/mail', '/mail/:path*', '/dashboard/invitations', '/dashboard/invitations/:path*'],
};
