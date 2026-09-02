"use client"
import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ReactLenis } from "lenis/react"

/**
 * Lenis takes over document scroll for marketing pages only.
 * The CRM and Partner portals must use native scroll so inner containers
 * and mouse wheel events are never hijacked or frozen.
 */
const NATIVE_SCROLL_ROUTES = [
  "/admin",
  "/partner",
  "/dashboard",
  "/onboarding",
  "/application-status",
  "/leads",
  "/users",
  "/settings",
  "/approvals",
  "/kanban",
  "/profile",
  "/wallet",
  "/credit-check",
  "/bankers",
  "/banks",
  "/reports",
  "/analytics",
  "/whatsapp-inbox",
  "/payouts",
  "/marketing",
  "/integrations",
  "/automation",
  "/storage",
  "/permissions"
]

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSubdomain, setIsSubdomain] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase()
      if (host.startsWith("admin.") || host.startsWith("partner.")) {
        setIsSubdomain(true)
      }
    }
  }, [])

  const useNativeScroll =
    isSubdomain ||
    NATIVE_SCROLL_ROUTES.some(
      route => pathname === route || pathname?.startsWith(`${route}/`)
    )

  if (useNativeScroll) return <>{children}</>

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  )
}
