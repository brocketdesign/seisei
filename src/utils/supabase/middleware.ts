import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected routes - redirect to login if not authenticated
    if (
        !user &&
        request.nextUrl.pathname.startsWith('/dashboard')
    ) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages (except reset-password)
    if (
        user &&
        (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/forgot-password')
    ) {
        // Check if user has completed onboarding (has brand_name set)
        const { data: profile } = await supabase
            .from('profiles')
            .select('brand_name')
            .eq('id', user.id)
            .single();

        const url = request.nextUrl.clone();
        if (profile?.brand_name) {
            url.pathname = '/dashboard';
        } else {
            url.pathname = '/onboarding';
        }
        return NextResponse.redirect(url);
    }

    // If user is on /onboarding but already completed it, skip to dashboard
    if (
        user &&
        request.nextUrl.pathname === '/onboarding' &&
        !request.nextUrl.searchParams.get('step')
    ) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('brand_name')
            .eq('id', user.id)
            .single();

        if (profile?.brand_name) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    return supabaseResponse;
}
