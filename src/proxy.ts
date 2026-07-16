import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  PUBLIC_ROUTES,
  ROLE_DEFAULT_REDIRECT,
  SHARED_PROTECTED_ROUTES,
} from '@/lib/constants';
import type { UserRole } from '@/types';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Create a response we can mutate (for cookie refresh) ──────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── 2. Refresh the session (required — do NOT remove) ─────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 3. Allow public routes unconditionally ────────────────────────────────
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  if (isPublicRoute) {
    // If user is logged in and hits /auth/login, redirect to their dashboard
    if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
      const profile = await getUserRole(supabase, user.id);
      const role = profile ?? 'student';
      const redirect = ROLE_DEFAULT_REDIRECT[role as UserRole] ?? '/student/dashboard';
      return NextResponse.redirect(new URL(redirect, request.url));
    }
    return supabaseResponse;
  }

  // ── 4. Unauthenticated — redirect to login ────────────────────────────────
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 5. Fetch the user's role from public.users ────────────────────────────
  const userRole = await getUserRole(supabase, user.id);
  if (!userRole) {
    // Profile not yet created (edge case during OAuth) — allow through
    return supabaseResponse;
  }

  // ── 6. Shared routes (profile, notifications) — any auth'd user ──────────
  const isSharedRoute = SHARED_PROTECTED_ROUTES.some((r) =>
    pathname.startsWith(r)
  );
  if (isSharedRoute) return supabaseResponse;

  // ── 7. Role-based route enforcement ──────────────────────────────────────
  const requestedSection = pathname.split('/')[1]; // e.g. "admin"
  const adminRoles: UserRole[] = ['super_admin', 'admin'];

  if (requestedSection === 'admin' && !adminRoles.includes(userRole as UserRole)) {
    return NextResponse.redirect(new URL('/403', request.url));
  }
  if (requestedSection === 'manager' && userRole !== 'manager' && !adminRoles.includes(userRole as UserRole)) {
    return NextResponse.redirect(new URL('/403', request.url));
  }
  if (requestedSection === 'trainer' && userRole !== 'trainer' && !adminRoles.includes(userRole as UserRole)) {
    return NextResponse.redirect(new URL('/403', request.url));
  }
  if (requestedSection === 'student' && userRole !== 'student' && !adminRoles.includes(userRole as UserRole)) {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  return supabaseResponse;
}

/** Fetch user role from public.users table */
async function getUserRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<UserRole | null> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return (data?.role as UserRole) ?? null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
