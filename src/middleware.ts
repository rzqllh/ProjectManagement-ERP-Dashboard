import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session');
    const path = request.nextUrl.pathname;

    // Paths that do not require authentication
    const publicPaths = ['/login', '/signup', '/api/health'];

    // Check if the current path is public
    const isPublicPath =
        publicPaths.includes(path) ||
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path.startsWith('/favicon.ico');

    // If user is not authenticated and trying to access a protected route
    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is authenticated and trying to access login page
    // BUT skip redirect if there are email link sign-in params (oobCode, mode, etc.)
    const hasEmailLinkParams =
        request.nextUrl.searchParams.has('oobCode') ||
        request.nextUrl.searchParams.has('mode') ||
        request.nextUrl.searchParams.has('apiKey');

    if (session && path === '/login' && !hasEmailLinkParams) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
    ],
};
