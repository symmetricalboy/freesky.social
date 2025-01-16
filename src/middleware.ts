import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Handle .well-known requests for subdomains
  if (pathname === '/.well-known/atproto-did') {
    // Extract handle and domain from hostname
    const [handle = '', ...domainParts] = hostname.split('.');
    const domain = domainParts.join('.');

    // Rewrite to our API endpoint with query parameters
    const url = request.nextUrl.clone();
    url.pathname = '/api/.well-known/atproto-did';
    url.searchParams.set('handle', handle);
    url.searchParams.set('domain', domain);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/.well-known/atproto-did',
  ],
};
