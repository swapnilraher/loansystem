import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const url = req.nextUrl
  const hostname = req.headers.get('host') || ''

  // Explicit safety check: API routes, static files, and assets must NEVER be rewritten
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Subdomain routing for partner portal
  if (
    hostname.startsWith('partner.') || 
    hostname === 'partner.techstarsolution.in' ||
    hostname === 'partner.localhost:3000'
  ) {
    // If the path doesn't already start with /partner, rewrite it
    if (!url.pathname.startsWith('/partner')) {
      url.pathname = `/partner${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Also allow direct access via /partner if they are not using the subdomain (fallback)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
