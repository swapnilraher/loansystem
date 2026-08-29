/**
 * Shared header & footer for all public-facing partner portal pages:
 * - /partner/login
 * - /onboarding
 * - /application-status
 *
 * NOT used inside the authenticated partner dashboard (/partner/*).
 */

import React from "react"
import Link from "next/link"
import Image from "next/image"

interface PartnerPortalHeaderProps {
  /** Sub-label shown below "Techstar Money". Defaults to "Partner Portal". */
  subtitle?: string
  /** If provided, shown as the logged-in mobile number on the right side. */
  mobileNumber?: string
  /** Right-side link label. Defaults to "Partner Login". */
  rightLinkLabel?: string
  /** Right-side link href. Defaults to "/partner/login". */
  rightLinkHref?: string
}

export function PartnerPortalHeader({
  subtitle = "Partner Portal",
  mobileNumber,
  rightLinkLabel,
  rightLinkHref,
}: PartnerPortalHeaderProps) {
  const linkLabel = rightLinkLabel ?? (mobileNumber ? "Status Tracker" : "Partner Login")
  const linkHref  = rightLinkHref  ?? (mobileNumber ? "/application-status" : "/partner/login")

  return (
    <header className="sticky top-0 z-30 bg-admin-surface border-b border-admin-border">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-4 h-14">
        {/* ── Logo + Brand ── */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 shrink-0 rounded-admin overflow-hidden bg-admin-surface-2 border border-admin-border flex items-center justify-center shadow-admin-1">
            <Image
              src="/img/logo.webp"
              alt="Techstar Money Logo"
              width={36}
              height={36}
              className="object-contain"
              preload
            />
          </span>
          <span className="block min-w-0">
            <span className="block text-admin-sm font-semibold tracking-tight text-admin-text truncate">
              Techstar Money
            </span>
            <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">
              {subtitle}
            </span>
          </span>
        </div>

        {/* ── Right Nav ── */}
        <div className="flex items-center gap-1 shrink-0">
          {mobileNumber && (
            <span className="hidden sm:inline admin-num text-admin-xs text-admin-muted px-2">
              +91 {mobileNumber}
            </span>
          )}
          <Link
            href={linkHref}
            className="admin-focus inline-flex items-center min-h-11 sm:min-h-9 px-2 rounded-admin-sm text-admin-xs font-semibold text-admin-muted hover:text-admin-text transition-colors"
          >
            {linkLabel}
          </Link>
        </div>
      </div>
    </header>
  )
}

export function PartnerPortalFooter() {
  return (
    <footer className="border-t border-admin-border bg-admin-surface py-4 px-4 text-center">
      <p className="text-admin-2xs text-admin-subtle">
        © {new Date().getFullYear()} Techstar Money Solution Pvt. Ltd. All rights reserved.
      </p>
    </footer>
  )
}
