import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const host = req.headers.get('host') || ''
  const hostname = host.split(':')[0].toLowerCase()
  const pathname = url.pathname

  // ── 1. Safety: Bypass API routes, Next.js internals, and static assets ──
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Helper to determine if we are in local development
  const isLocalhost = hostname.includes('localhost') || hostname === '127.0.0.1'
  const portSuffix = host.includes(':') ? `:${host.split(':')[1]}` : ''

  // ── 2. Admin Subdomain: admin.techstarsolution.in / admin.localhost ──
  if (
    hostname === 'admin.techstarsolution.in' ||
    hostname === 'admin.localhost' ||
    hostname.startsWith('admin.')
  ) {
    // If URL already contains /admin prefix, redirect 308 to clean URL
    if (pathname === '/admin') {
      url.pathname = '/'
      return NextResponse.redirect(url, 308)
    }
    if (pathname.startsWith('/admin/')) {
      url.pathname = pathname.replace(/^\/admin/, '') || '/'
      return NextResponse.redirect(url, 308)
    }

    // Rewrite clean paths to internal /admin routes
    if (pathname === '/' || pathname === '') {
      url.pathname = '/admin'
      return NextResponse.rewrite(url)
    }

    url.pathname = `/admin${pathname}`
    return NextResponse.rewrite(url)
  }

  // ── 3. Partner Subdomain: partner.techstarsolution.in / partner.localhost ──
  if (
    hostname === 'partner.techstarsolution.in' ||
    hostname === 'partner.localhost' ||
    hostname.startsWith('partner.')
  ) {
    // If URL already contains /partner prefix, redirect 308 to clean URL
    if (pathname === '/partner') {
      url.pathname = '/'
      return NextResponse.redirect(url, 308)
    }
    if (pathname.startsWith('/partner/')) {
      url.pathname = pathname.replace(/^\/partner/, '') || '/'
      return NextResponse.redirect(url, 308)
    }

    // Direct public routes allowed under partner portal
    if (pathname.startsWith('/onboarding') || pathname.startsWith('/application-status')) {
      return NextResponse.next()
    }

    // Rewrite clean paths to internal /partner routes
    if (pathname === '/' || pathname === '') {
      url.pathname = '/partner'
      return NextResponse.rewrite(url)
    }

    url.pathname = `/partner${pathname}`
    return NextResponse.rewrite(url)
  }

  // ── 4. Main Domain: techstarsolution.in / www.techstarsolution.in / localhost ──
  // Block and 308 Redirect any /admin or /admin/* to admin subdomain
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const subPath = pathname.replace(/^\/admin/, '') || '/'
    const adminOrigin = isLocalhost
      ? `http://admin.localhost${portSuffix}`
      : 'https://admin.techstarsolution.in'
    return NextResponse.redirect(`${adminOrigin}${subPath}${url.search}`, 308)
  }

  // Block and 308 Redirect any /partner or /partner/* to partner subdomain
  if (pathname === '/partner' || pathname.startsWith('/partner/')) {
    const subPath = pathname.replace(/^\/partner/, '') || '/'
    const partnerOrigin = isLocalhost
      ? `http://partner.localhost${portSuffix}`
      : 'https://partner.techstarsolution.in'
    return NextResponse.redirect(`${partnerOrigin}${subPath}${url.search}`, 308)
  }

  // Block /login on main domain -> 308 redirect to partner subdomain login
  if (pathname === '/login') {
    const partnerOrigin = isLocalhost
      ? `http://partner.localhost${portSuffix}`
      : 'https://partner.techstarsolution.in'
    return NextResponse.redirect(`${partnerOrigin}/login${url.search}`, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, documents, static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|pdf|css|js|map|xml|txt)).*)',
  ],
}
