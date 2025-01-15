import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle .well-known requests for subdomains
  if (pathname.startsWith('/.well-known/atproto-did')) {
    // Rewrite to our API endpoint
    return NextResponse.rewrite(new URL('/api/.well-known/atproto-did', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/.well-known/atproto-did',
  ],
};
