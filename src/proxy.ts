import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const url      = req.nextUrl.clone()
  const hostname = req.headers.get('host') || ''
  const pathname = url.pathname

  // ── Safety: never rewrite API routes, static files, or assets ──────────────
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // ── Admin subdomain: admin.techstarsolution.in ──────────────────────────────
  if (
    hostname.startsWith('admin.') ||
    hostname === 'admin.techstarsolution.in' ||
    hostname === 'admin.localhost:3000'
  ) {
    // Already prefixed with /admin → pass through
    if (pathname.startsWith('/admin')) {
      return NextResponse.next()
    }

    // Root / → redirect to /admin/login
    if (pathname === '/' || pathname === '') {
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    // /login → /admin/login, /leads → /admin/leads, etc.
    url.pathname = '/admin' + pathname
    return NextResponse.rewrite(url)
  }

  // ── Partner subdomain: partner.techstarsolution.in ─────────────────────────
  if (
    hostname.startsWith('partner.') ||
    hostname === 'partner.techstarsolution.in' ||
    hostname === 'partner.localhost:3000'
  ) {
    if (!pathname.startsWith('/partner')) {
      url.pathname = `/partner${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
