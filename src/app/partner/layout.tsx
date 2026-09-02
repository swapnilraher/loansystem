"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Home, ListPlus, LayoutList, Wallet, User, LogOut, AlertCircle, ShieldCheck } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { AdminButton } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/partner", icon: Home },
  { label: "New Lead", href: "/partner/leads/new", icon: ListPlus },
  { label: "My Leads", href: "/partner/leads", icon: LayoutList },
  { label: "Credit Check", href: "/partner/credit-check", icon: ShieldCheck },
  { label: "Wallet", href: "/partner/wallet", icon: Wallet },
  { label: "Profile", href: "/partner/profile", icon: User },
]

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, adminRole, loading, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const partnerPhoto = profile?.kycData?.photoBase64
    ? `data:image/jpeg;base64,${profile.kycData.photoBase64}`
    : user?.photoURL || ""

  // Security & Redirect checks:
  // 1. If not authenticated, redirect to partner login
  // Security & Redirect checks:
  // 1. If not authenticated, redirect to partner login
  // 2. If Staff Admin user, redirect to https://admin.techstarsolution.in
  // 3. If User with no partner application yet, redirect to /onboarding
  // 4. If Partner applicant/member, enforce approval status routing
  const isLoginPage = pathname === "/partner/login" || pathname === "/login" || pathname?.endsWith("/login")

  useEffect(() => {
    if (loading) return

    if (!user) {
      if (!isLoginPage) {
        router.push(pathname.startsWith("/partner") ? "/partner/login" : "/login")
      }
      return
    }

    if (!profile) return // still loading profile

    // If Staff/Super Admin logs in on Partner Portal, redirect them cleanly to the Admin Portal
    if (adminRole) {
      if (!isLoginPage) {
        if (typeof window !== "undefined") {
          const host = window.location.host
          if (host.includes("partner.localhost")) {
            window.location.href = window.location.origin.replace("partner.", "admin.")
            return
          }
          if (host.includes("partner.techstarsolution.in")) {
            window.location.href = "https://admin.techstarsolution.in"
            return
          }
        }
        router.push("/admin")
      }
      return
    }

    // Partner Access Check
    const hasPartnerAccess =
      profile.role === "partner" ||
      profile.role === "admin" ||
      profile.role === "super_admin" ||
      !!profile.dsaStatus ||
      !!profile.applicationId ||
      !!profile.dsaCode

    if (!hasPartnerAccess) {
      if (!isLoginPage) {
        router.push("/onboarding")
      }
      return
    }

    // Only redirect to onboarding if applicant has an unsubmitted draft with no application ID
    const currentStatus = String(profile.dsaStatus || profile.status || "").toLowerCase()
    if (currentStatus === "draft" && !profile.applicationId && !isLoginPage) {
      router.push("/onboarding")
    }
  }, [user, profile, adminRole, loading, pathname, router, isLoginPage])

  if (loading) {
    return <PartnerSplash />
  }

  // Allow login page to bypass the standard partner dashboard layout
  if (isLoginPage) {
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
      : (user?.email?.[0]?.toUpperCase() || "P")

  return (
    /*
     * `partner-root` is the Bootstrap quarantine marker, the counterpart to
     * `admin-root` in the CRM — see postcss-plugins/strip-bootstrap-important.
     * Nothing in this tree uses a Bootstrap class, and without the exclusion
     * Reboot's `label{display:inline-block}` collapses form fields on the pages
     * rendered inside here, while `p-*`/`px-*` land on Bootstrap's scale.
     */
    <div className="partner-root min-h-dvh bg-admin-bg flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col sticky top-0 h-dvh bg-admin-surface border-r border-admin-border">
        <div className="px-4 py-4 border-b border-admin-border">
          <p className="text-admin-base font-semibold tracking-tight text-admin-text">
            Techstar Money
          </p>
          <p className="text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle mt-0.5">
            DSA Partner
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive =
              pathname === item.href || ((pathname ?? "").startsWith(item.href) && item.href !== "/partner")
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "admin-focus flex items-center gap-2.5 min-h-11 px-2.5 rounded-admin-sm text-admin-sm font-semibold transition-colors",
                  isActive
                    ? "bg-admin-accent-soft text-admin-accent"
                    : "text-admin-muted hover:bg-admin-surface-2 hover:text-admin-text"
                )}
              >
                <item.icon size={17} className="shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-2.5 border-t border-admin-border space-y-2.5">
          <div className="flex items-center gap-2.5 px-1 min-w-0">
            <span className="w-9 h-9 shrink-0 rounded-admin-sm bg-admin-surface-2 border border-admin-border overflow-hidden flex items-center justify-center text-admin-sm font-semibold uppercase text-admin-muted">
              {partnerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={partnerPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                partnerInitial
              )}
            </span>
            <span className="block min-w-0">
              <span className="block text-admin-sm font-semibold text-admin-text truncate">
                {partnerDisplayName}
              </span>
              <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle admin-num">
                {profile?.dsaCode || "Pending"}
              </span>
            </span>
          </div>
          <AdminButton variant="secondary" icon={LogOut} onClick={logout} className="w-full">
            Log out
          </AdminButton>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 bg-admin-surface border-b border-admin-border">
        <div className="flex items-center justify-between gap-3 px-4 h-14">
          <p className="text-admin-sm font-semibold tracking-tight text-admin-text truncate">
            Techstar Money
            <span className="text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle ml-1.5">
              DSA
            </span>
          </p>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 shrink-0 rounded-admin-sm bg-admin-surface-2 border border-admin-border overflow-hidden flex items-center justify-center text-admin-xs font-semibold uppercase text-admin-muted">
              {partnerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={partnerPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                partnerInitial
              )}
            </span>
            <button
              onClick={logout}
              title="Logout"
              className="h-8 px-2.5 rounded-admin bg-admin-surface-2 border border-admin-border text-tone-danger-fg text-admin-2xs font-bold flex items-center gap-1.5 hover:bg-tone-danger-bg hover:border-tone-danger-bd transition-colors"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content. Bottom padding clears the fixed mobile tab bar. */}
      <main className="flex-1 min-w-0 overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="max-w-7xl mx-auto w-full px-4 py-4 md:py-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-admin-surface border-t border-admin-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around px-1">
          {NAV_ITEMS.map(item => {
            const isActive =
              pathname === item.href || ((pathname ?? "").startsWith(item.href) && item.href !== "/partner")
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "admin-focus flex-1 flex flex-col items-center justify-center gap-1 py-1.5 min-h-14 rounded-admin-sm transition-colors text-center",
                  isActive ? "text-admin-accent font-bold" : "text-admin-subtle hover:text-admin-text"
                )}
              >
                <item.icon size={18} className="shrink-0" />
                <span className="text-[10px] leading-tight font-medium truncate max-w-[58px] block">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function PartnerSplash() {
  return (
    <div className="partner-root relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-admin-bg px-6 text-center">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 w-80 h-80 rounded-full bg-admin-accent/20 blur-3xl animate-blob motion-reduce:animate-none"
      />
      <span
        aria-hidden
        style={{ animationDelay: "2.5s" }}
        className="pointer-events-none absolute -bottom-28 -right-16 w-96 h-96 rounded-full bg-admin-accent/10 blur-3xl animate-blob motion-reduce:animate-none"
      />

      <div className="relative flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden
            style={{ animationDuration: "18s", animationDirection: "reverse" }}
            className="absolute w-36 h-36 rounded-full border border-admin-border animate-spin motion-reduce:animate-none"
          />

          <span
            aria-hidden
            style={{
              animationDuration: "2.6s",
              background:
                "conic-gradient(from 0deg, transparent 0deg, var(--admin-accent) 300deg, transparent 356deg)",
              WebkitMaskImage:
                "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
              maskImage:
                "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            }}
            className="absolute w-28 h-28 rounded-full animate-spin motion-reduce:animate-none"
          />

          <span
            aria-hidden
            className="absolute w-20 h-20 rounded-full bg-admin-accent/25 blur-xl"
          />

          <span className="relative w-18 h-18 rounded-admin-lg overflow-hidden border border-admin-border bg-admin-surface shadow-admin-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.webp" alt="" className="w-full h-full object-cover" />
          </span>
        </div>

        <h1 className="admin-splash-sheen text-admin-2xl font-semibold tracking-tight mt-8">
          Techstar Money Solution
        </h1>
        <p className="text-admin-2xs font-medium uppercase tracking-[0.25em] text-admin-subtle mt-2">
          DSA Partner Portal
        </p>

        <span
          aria-hidden
          className="relative mt-7 h-0.5 w-44 overflow-hidden rounded-full bg-admin-border"
        >
          <span className="admin-splash-rail absolute inset-y-0 left-0 w-1/3 rounded-full bg-admin-accent" />
        </span>

        <p className="flex items-center gap-2 text-admin-sm font-medium text-admin-muted mt-5">
          <ShieldCheck size={15} className="text-admin-accent shrink-0" />
          Loading partner workspace…
        </p>
      </div>
    </div>
  )
}

