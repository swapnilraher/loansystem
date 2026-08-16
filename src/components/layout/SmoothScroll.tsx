"use client"
import React from "react"
import { usePathname } from "next/navigation"
import { ReactLenis } from "lenis/react"

/**
 * Lenis takes over the document scroll to smooth the marketing pages.
 *
 * The app-like areas (CRM, connector portal, customer portal) scroll an inner
 * container instead, and Lenis' wheel handler swallows those events — the
 * panel simply refuses to scroll. It also runs a permanent rAF loop, which
 * these data-heavy screens can do without. Keep it off there.
 */
const NATIVE_SCROLL_ROUTES = ["/admin", "/partner", "/dashboard"]

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const useNativeScroll = NATIVE_SCROLL_ROUTES.some(
    route => pathname === route || pathname?.startsWith(`${route}/`)
  )

  if (useNativeScroll) return <>{children}</>

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  )
}
