import { NextRequest, NextResponse } from 'next/server';

/**
 * Keeps the Worlds experience under /yaggdrasil while its existing App Router
 * pages and API routes remain unchanged internally.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/yaggdrasil') {
    return NextResponse.rewrite(new URL('/worlds-home', request.url));
  }

  if (pathname.startsWith('/yaggdrasil/')) {
    const destination = request.nextUrl.clone();
    destination.pathname = pathname.slice('/yaggdrasil'.length) || '/worlds-home';
    return NextResponse.rewrite(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/yaggdrasil', '/yaggdrasil/:path*'],
};
