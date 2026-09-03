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
  const linkLabel =
    rightLinkLabel ?? (mobileNumber ? "Status Tracker" : "Partner Login")
  const linkHref =
    rightLinkHref ?? (mobileNumber ? "/application-status" : "/partner/login")

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(255,255,255,0.97)",
        borderBottom: "1px solid #E2E8F0",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 h-14">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <span className="w-9 h-9 shrink-0 rounded-xl overflow-hidden bg-blue-600 border border-blue-700/20 flex items-center justify-center shadow-sm">
            <Image
              src="/img/logo.webp"
              alt="Techstar Money Solution logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </span>
          <span className="block min-w-0">
            <span className="block text-sm font-extrabold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors truncate">
              Techstar Money Solution
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {subtitle}
            </span>
          </span>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-2 shrink-0">
          {mobileNumber && (
            <span className="hidden sm:inline text-xs text-slate-400 font-mono px-2">
              +91 {mobileNumber}
            </span>
          )}
          <Link
            href={linkHref}
            className="inline-flex items-center min-h-9 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all no-underline"
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
    <footer
      className="py-5 px-4 text-center"
      style={{ borderTop: "1px solid #E2E8F0", background: "#FFFFFF" }}
    >
      <p className="text-xs text-slate-400 font-medium">
        © {new Date().getFullYear()} Techstar Money Solution Pvt. Ltd. All
        rights reserved. · CIN: U66190MR2026PTC478675
      </p>
    </footer>
  )
}
