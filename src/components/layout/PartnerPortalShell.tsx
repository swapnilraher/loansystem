/**
 * Shared header & footer for all public-facing partner portal pages:
 * - /partner            (marketing landing, logged out)
 * - /partner/login
 * - /onboarding
 * - /application-status
 *
 * NOT used inside the authenticated partner dashboard (/partner/*).
 *
 * The landing page needs a section nav and its own primary CTA on top of the
 * plain logo bar the auth pages use, so both are optional slots rather than a
 * second header component -- one header, two configurations.
 */

"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface PortalNavLink {
  href: string
  label: string
}

interface PartnerPortalHeaderProps {
  /** Sub-label shown below "Techstar Money". Defaults to "Partner Portal". */
  subtitle?: string
  /** If provided, shown as the logged-in mobile number on the right side. */
  mobileNumber?: string
  /** Right-side link label. Defaults to "Partner Login". */
  rightLinkLabel?: string
  /** Right-side link href. Defaults to "/partner/login". */
  rightLinkHref?: string
  /**
   * In-page section links. When present the header grows a desktop nav and a
   * mobile disclosure; when absent the header stays the plain bar the auth
   * pages use.
   */
  navLinks?: PortalNavLink[]
  /** Primary CTA rendered as the only filled button in the bar. */
  cta?: PortalNavLink
}

export function PartnerPortalHeader({
  subtitle = "Partner Portal",
  mobileNumber,
  rightLinkLabel,
  rightLinkHref,
  navLinks,
  cta,
}: PartnerPortalHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const linkLabel =
    rightLinkLabel ?? (mobileNumber ? "Status Tracker" : "Partner Login")
  const linkHref =
    rightLinkHref ?? (mobileNumber ? "/application-status" : "/partner/login")

  const hasNav = !!navLinks?.length

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-admin-border bg-admin-surface/95 backdrop-blur-md transition-shadow",
        scrolled ? "shadow-admin-2" : "shadow-none"
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-3 px-4 sm:px-6",
          hasNav ? "w-full max-w-7xl h-16" : "max-w-5xl h-14"
        )}
      >
        {/* Logo + Brand */}
        <Link
          href="/"
          className="admin-touch admin-focus group flex min-w-0 items-center gap-3 no-underline"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-admin border border-brand-strong/20 bg-brand shadow-admin-1">
            <Image
              src="/img/logo.webp"
              alt="Techstar Money Solution logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </span>
          <span className="block min-w-0">
            <span className="block truncate text-admin-sm font-extrabold tracking-tight text-admin-text transition-colors motion-reduce:transition-none group-hover:text-brand">
              Techstar Money Solution
            </span>
            <span
              className={cn(
                "block truncate text-admin-2xs font-semibold uppercase tracking-widest text-admin-subtle",
                hasNav && "hidden sm:block"
              )}
            >
              {subtitle}
            </span>
          </span>
        </Link>

        {/* Section nav — landing page only */}
        {hasNav && (
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="admin-focus rounded-admin-sm px-3 py-2 text-admin-sm font-semibold text-admin-muted no-underline transition-colors motion-reduce:transition-none hover:bg-brand-soft hover:text-brand"
              >
                {label}
              </a>
            ))}
          </nav>
        )}

        {/* Right Nav */}
        <div className="flex shrink-0 items-center gap-2">
          {mobileNumber && (
            <span className="admin-num hidden px-2 text-admin-xs text-admin-subtle sm:inline">
              +91 {mobileNumber}
            </span>
          )}
          <Link
            href={linkHref}
            className={cn(
              "admin-focus inline-flex min-h-[44px] items-center rounded-admin-sm border border-admin-border px-4 py-2 text-admin-xs font-bold text-admin-text no-underline transition-all motion-reduce:transition-none hover:border-brand-ring hover:bg-brand-soft hover:text-brand",
              hasNav && "hidden sm:inline-flex"
            )}
          >
            {linkLabel}
          </Link>

          {/* The one filled button in the bar */}
          {cta && (
            <Link
              href={cta.href}
              className="admin-focus inline-flex min-h-[44px] items-center rounded-admin-sm bg-brand px-4 py-2 text-admin-xs font-bold text-brand-fg no-underline shadow-admin-1 transition-colors motion-reduce:transition-none hover:bg-brand-hover"
            >
              {cta.label}
            </Link>
          )}

          {hasNav && (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="portal-mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="admin-focus inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-admin-sm border border-admin-border text-admin-muted transition-colors motion-reduce:transition-none hover:border-brand-ring hover:text-brand lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile disclosure */}
      {hasNav && menuOpen && (
        <div
          id="portal-mobile-nav"
          className="border-t border-admin-border bg-admin-surface px-4 py-3 shadow-admin-2 lg:hidden"
        >
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="admin-focus flex min-h-[44px] items-center rounded-admin-sm px-3 text-admin-base font-semibold text-admin-muted no-underline transition-colors motion-reduce:transition-none hover:bg-brand-soft hover:text-brand"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            href={linkHref}
            onClick={() => setMenuOpen(false)}
            className="admin-focus mt-2 flex min-h-[44px] items-center justify-center rounded-admin-sm border border-admin-border text-admin-sm font-bold text-admin-text no-underline transition-colors motion-reduce:transition-none hover:border-brand-ring hover:text-brand sm:hidden"
          >
            {linkLabel}
          </Link>
        </div>
      )}
    </header>
  )
}

export function PartnerPortalFooter() {
  return (
    <footer className="border-t border-admin-border bg-admin-surface px-4 py-5 text-center">
      <p className="text-admin-xs font-medium text-admin-subtle">
        © {new Date().getFullYear()} Techstar Money Solution Pvt. Ltd. All
        rights reserved. · CIN: U66190MR2026PTC478675
      </p>
    </footer>
  )
}
