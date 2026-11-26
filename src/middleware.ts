import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const isLocalMode =
    process.env.NEXT_PUBLIC_LOCAL_MODE === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project');

  if (isLocalMode) {
    const localSessionRaw = request.cookies.get('docytrack_local_session')?.value;
    let localSession: any = null;
    if (localSessionRaw) {
      try {
        localSession = JSON.parse(decodeURIComponent(localSessionRaw));
      } catch (_) {}
    }

    const protectedPaths = [
      '/student',
      '/department',
      '/dean',
      '/registrar',
      '/admin',
      '/profile',
      '/notifications',
    ];

    const isProtectedPath = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (isProtectedPath && !localSession) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      redirectUrl.searchParams.set('auth', 'signin');
      return NextResponse.redirect(redirectUrl);
    }

    if (localSession && isProtectedPath) {
      const role = localSession.profile?.role;
      const pathname = request.nextUrl.pathname;

      if (pathname.startsWith('/student') && role !== 'student') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (pathname.startsWith('/department') && role !== 'department_chair') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (pathname.startsWith('/dean') && role !== 'college_dean') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (pathname.startsWith('/registrar') && role !== 'university_registrar') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (pathname.startsWith('/admin') && role !== 'system_admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    if (localSession && request.nextUrl.pathname === '/login') {
      const role = localSession.profile?.role;
      const roleRedirects: Record<string, string> = {
        student: '/student/dashboard',
        department_chair: '/department/dashboard',
        college_dean: '/dean/dashboard',
        university_registrar: '/registrar/dashboard',
        system_admin: '/admin/dashboard',
      };
      return NextResponse.redirect(new URL(roleRedirects[role] || '/', request.url));
    }

    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = [
    '/student',
    '/department',
    '/dean',
    '/registrar',
    '/admin',
    '/profile',
    '/notifications',
  ];

  const isProtectedPath = protectedPaths.some((path) => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    redirectUrl.searchParams.set('auth', 'signin');
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based route protection
  if (user && isProtectedPath) {
    let role = user.app_metadata?.role;
    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role;
    }

    if (role) {
      const pathname = request.nextUrl.pathname;

      // Check role permissions
      if (pathname.startsWith('/student') && role !== 'student') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (pathname.startsWith('/department') && role !== 'department_chair') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (pathname.startsWith('/dean') && role !== 'college_dean') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (pathname.startsWith('/registrar') && role !== 'university_registrar') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (pathname.startsWith('/admin') && role !== 'system_admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  // Redirect logged-in users away from login page
  if (user && request.nextUrl.pathname === '/login') {
    let role = user.app_metadata?.role;
    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role;
    }

    if (role) {
      const roleRedirects: Record<string, string> = {
        student: '/student/dashboard',
        department_chair: '/department/dashboard',
        college_dean: '/dean/dashboard',
        university_registrar: '/registrar/dashboard',
        system_admin: '/admin/dashboard',
      };
      return NextResponse.redirect(new URL(roleRedirects[role] || '/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
