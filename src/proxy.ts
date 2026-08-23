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
    if (pathname.startsWith('/admin')) {
      return NextResponse.next()
    }

    if (pathname === '/' || pathname === '') {
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    url.pathname = '/admin' + pathname
    return NextResponse.rewrite(url)
  }

  // ── Partner subdomain: partner.techstarsolution.in ─────────────────────
  if (
    hostname.startsWith('partner.') ||
    hostname === 'partner.techstarsolution.in' ||
    hostname === 'partner.localhost:3000'
  ) {
    if (pathname.startsWith('/onboarding') || pathname.startsWith('/application-status')) {
      return NextResponse.next()
    }

    if (!pathname.startsWith('/partner')) {
      url.pathname = `/partner${pathname}`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // ── Main domain: block /partner/* — redirect to subdomain ──────────────────
  if (
    (hostname === 'techstarsolution.in' || hostname === 'www.techstarsolution.in') &&
    pathname.startsWith('/partner')
  ) {
    const subPath = pathname.replace('/partner', '') || '/'
    return NextResponse.redirect(
      `https://partner.techstarsolution.in${subPath}`,
      308
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
