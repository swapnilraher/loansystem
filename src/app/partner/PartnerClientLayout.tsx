"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Home,
  ListPlus,
  LayoutList,
  Wallet,
  User,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/partner", icon: Home },
  { label: "New Lead", href: "/partner/leads/new", icon: ListPlus },
  { label: "My Leads", href: "/partner/leads", icon: LayoutList },
  { label: "Credit Check", href: "/partner/credit-check", icon: ShieldCheck },
  { label: "Wallet", href: "/partner/wallet", icon: Wallet },
  { label: "Profile", href: "/partner/profile", icon: User },
]

export default function PartnerClientLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, adminRole, loading, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const partnerPhoto = profile?.kycData?.photoBase64
    ? `data:image/jpeg;base64,${profile.kycData.photoBase64}`
    : user?.photoURL || ""

  const isLoginPage =
    pathname === "/partner/login" ||
    pathname === "/login" ||
    pathname?.endsWith("/login")

  const isLandingPath =
    pathname === "/partner" || pathname === "/" || pathname === ""

  useEffect(() => {
    if (loading) return
    if (!user) {
      if (!isLoginPage && !isLandingPath) {
        router.push(pathname.startsWith("/partner") ? "/partner/login" : "/login")
      }
      return
    }
    if (!profile) return

    const hasPartnerAccess =
      adminRole ||
      profile.role === "partner" ||
      profile.role === "admin" ||
      profile.role === "super_admin" ||
      !!profile.dsaStatus ||
      !!profile.applicationId ||
      !!profile.dsaCode

    if (!hasPartnerAccess) {
      if (!isLoginPage && !isLandingPath) {
        router.push("/onboarding")
      }
      return
    }

    const currentStatus = String(
      profile.dsaStatus || profile.status || ""
    ).toLowerCase()
    if (
      currentStatus === "draft" &&
      !profile.applicationId &&
      !isLoginPage &&
      !isLandingPath
    ) {
      router.push("/onboarding")
    }
  }, [user, profile, adminRole, loading, pathname, router, isLoginPage, isLandingPath])

  if (loading && !isLandingPath && !isLoginPage) {
    return <PartnerSplash />
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!user && isLandingPath) {
    return <>{children}</>
  }

  if (!user) return null

  const partnerDisplayName =
    profile?.name ||
    profile?.fullName ||
    profile?.contactPersonName ||
    profile?.businessName ||
    profile?.kycData?.name ||
    user?.displayName ||
    "Partner"

  const partnerInitial =
    partnerDisplayName && partnerDisplayName !== "Partner"
      ? partnerDisplayName[0]?.toUpperCase()
      : user?.email?.[0]?.toUpperCase() || "P"

  const dsaCode = profile?.dsaCode || "—"
  const dsaStatusRaw = String(
    profile?.dsaStatus || profile?.status || ""
  ).toLowerCase()
  const isApproved = dsaStatusRaw === "active" || dsaStatusRaw === "approved"

  return (
    <div className="partner-root min-h-dvh flex flex-col md:flex-row bg-admin-bg">
      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-dvh bg-admin-surface border-r border-admin-border"
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-admin-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-admin bg-brand flex items-center justify-center text-brand-fg font-bold text-xs shadow-admin-1 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/logo.webp"
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
            </div>
            <div>
              <div className="text-sm font-extrabold text-admin-text tracking-tight leading-tight">
                Techstar Money
              </div>
              <div className="text-[10px] font-semibold text-admin-subtle uppercase tracking-widest">
                DSA Partner Portal
              </div>
            </div>
          </div>

          {/* Status pill */}
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                isApproved
                  ? "bg-tone-success text-tone-success-fg border-tone-success-bd"
                  : "bg-tone-warn text-tone-warn-fg border-tone-warn-bd"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isApproved ? "bg-tone-success-fg" : "bg-tone-warn-fg"
                )}
              />
              {isApproved ? "Active DSA" : "Pending Verification"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              ((pathname ?? "").startsWith(item.href) &&
                item.href !== "/partner")
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "admin-focus flex items-center justify-between gap-2.5 min-h-10 px-3 rounded-admin-sm text-sm font-semibold transition-all no-underline",
                  isActive
                    ? "bg-brand-soft text-brand-soft-fg border border-brand-line shadow-admin-1"
                    : "text-admin-muted hover:bg-admin-surface-2 hover:text-admin-text border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon
                    size={16}
                    className={cn(
                      "shrink-0",
                      isActive ? "text-brand" : "text-admin-subtle"
                    )}
                  />
                  {item.label}
                </div>
                {isActive && (
                  <ChevronRight size={13} className="text-brand shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-admin-border space-y-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-admin-sm bg-admin-surface-2 border border-admin-border">
            <span className="w-9 h-9 shrink-0 rounded-admin bg-admin-surface border border-admin-border overflow-hidden flex items-center justify-center text-sm font-bold text-admin-muted shadow-admin-1">
              {partnerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={partnerPhoto}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                partnerInitial
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-admin-text truncate">
                {partnerDisplayName}
              </div>
              <div className="text-[10px] font-semibold text-admin-subtle font-mono uppercase tracking-wider">
                {dsaCode}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="admin-focus w-full flex items-center justify-center gap-2 h-9 rounded-admin-sm text-xs font-bold text-admin-muted bg-admin-surface hover:bg-tone-danger hover:text-tone-danger-fg border border-admin-border hover:border-tone-danger-bd transition-all"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ─────────────────────────────────────────────── */}
      <header
        className="md:hidden sticky top-0 z-40 bg-admin-surface/95 border-b border-admin-border backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-3 px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-admin bg-brand flex items-center justify-center text-brand-fg font-bold text-xs shadow-admin-1 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/logo.webp"
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
            </div>
            <div>
              <div className="text-sm font-extrabold text-admin-text tracking-tight leading-tight">
                Techstar Money
              </div>
              <div className="text-[10px] font-semibold text-admin-subtle uppercase tracking-widest leading-tight">
                DSA Partner
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 shrink-0 rounded-admin bg-admin-surface border border-admin-border overflow-hidden flex items-center justify-center text-xs font-bold text-admin-muted shadow-admin-1">
              {partnerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={partnerPhoto}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                partnerInitial
              )}
            </span>
            <button
              onClick={logout}
              className="admin-focus h-8 px-3 rounded-admin-sm bg-tone-danger border border-tone-danger-bd text-tone-danger-fg text-xs font-bold flex items-center gap-1.5 hover:bg-tone-danger transition-colors"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main
        className="flex-1 min-w-0 overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"
      >
        <div className="max-w-7xl mx-auto w-full px-4 py-5 md:py-7">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)] bg-admin-surface/95 border-t border-admin-border backdrop-blur-md"
      >
        <div className="flex items-stretch justify-around px-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              ((pathname ?? "").startsWith(item.href) &&
                item.href !== "/partner")
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "admin-focus flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-14 rounded-admin-sm transition-colors text-center no-underline",
                  isActive
                    ? "text-brand font-bold"
                    : "text-admin-subtle hover:text-admin-text"
                )}
              >
                <item.icon
                  size={19}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-brand" : "text-admin-subtle"
                  )}
                />
                <span className="text-[9px] leading-tight font-semibold truncate max-w-[52px] block">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-brand block" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

// ── Loading Splash ──────────────────────────────────────────────────────────
function PartnerSplash() {
  return (
    <div
      className="partner-root min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-admin-bg"
    >
      <div className="relative flex flex-col items-center space-y-6">
        {/* Logo ring */}
        <div className="relative flex items-center justify-center">
          <span
            className="absolute w-20 h-20 rounded-full border-2 border-brand-line animate-spin motion-reduce:animate-none"
            style={{ animationDuration: "3s" }}
          />
          <span
            className="absolute w-16 h-16 rounded-full border border-brand-line animate-spin motion-reduce:animate-none"
            style={{ animationDuration: "5s", animationDirection: "reverse" }}
          />
          <div className="w-12 h-12 rounded-admin-lg overflow-hidden bg-brand border-2 border-admin-surface shadow-admin-3 flex items-center justify-center text-brand-fg font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo.webp"
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = "none"
              }}
            />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-admin-text tracking-tight">
            Techstar Money Solution
          </h1>
          <p className="text-xs font-semibold text-admin-subtle uppercase tracking-widest mt-1">
            DSA Partner Portal
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-40 h-1 bg-admin-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full animate-pulse motion-reduce:animate-none"
            style={{ width: "60%" }}
          />
        </div>

        <p className="flex items-center gap-2 text-sm font-medium text-admin-subtle">
          <ShieldCheck size={15} className="text-brand shrink-0" />
          Loading partner workspace…
        </p>
      </div>
    </div>
  )
}
