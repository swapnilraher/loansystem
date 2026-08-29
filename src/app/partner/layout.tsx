"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Home, ListPlus, LayoutList, Wallet, User, LogOut, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { AdminButton } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/partner", icon: Home },
  { label: "New Lead", href: "/partner/leads/new", icon: ListPlus },
  { label: "My Leads", href: "/partner/leads", icon: LayoutList },
  { label: "Wallet", href: "/partner/wallet", icon: Wallet },
  { label: "Profile", href: "/partner/profile", icon: User },
]

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const partnerPhoto = profile?.kycData?.photoBase64
    ? `data:image/jpeg;base64,${profile.kycData.photoBase64}`
    : user?.photoURL || ""

  // Redirect checks:
  // 1. If not authenticated, redirect to partner login
  // 2. If authenticated but role is not partner or dsaStatus is not Active/approved, redirect to /onboarding to complete onboarding
  useEffect(() => {
    if (loading) return

    const isLoginPage = pathname === "/partner/login"

    if (!user) {
      if (!isLoginPage) router.push("/partner/login")
      return
    }

    if (!profile) return // still loading profile

    const isApproved =
      profile.role === "partner" &&
      (profile.dsaStatus === "Active" || profile.dsaStatus === "approved")

    if (!isApproved && !isLoginPage) {
      // If they have a submitted application, send them to the status tracker
      // Otherwise send back to onboarding to complete
      if (
        profile.applicationId ||
        profile.dsaStatus === "under_review" ||
        profile.dsaStatus === "queried"
      ) {
        router.push("/application-status")
      } else {
        router.push("/onboarding")
      }
    }
  }, [user, profile, loading, pathname, router])

  if (loading) {
    return (
      <div className="partner-root min-h-dvh flex items-center justify-center bg-admin-bg">
        <span
          role="status"
          aria-label="Loading"
          className="w-9 h-9 rounded-full border-4 border-admin-border border-t-admin-accent animate-spin"
        />
      </div>
    )
  }

  // Allow login page to bypass the standard partner dashboard layout
  if (pathname === "/partner/login") {
    return <>{children}</>
  }

  if (!user) return null

  const initial = profile?.name?.[0] || user.email?.[0] || "P"

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
                initial
              )}
            </span>
            <span className="block min-w-0">
              <span className="block text-admin-sm font-semibold text-admin-text truncate">
                {profile?.name || "Partner"}
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
                initial
              )}
            </span>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg bg-admin-surface-2 border border-admin-border text-tone-danger-fg text-xs font-bold flex items-center gap-1 hover:bg-red-500/10"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content. Bottom padding clears the fixed mobile tab bar. */}
      <main className="flex-1 min-w-0 overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="max-w-4xl mx-auto w-full px-4 py-4 md:py-6">
          {profile?.dsaStatus && profile.dsaStatus !== "Active" && (
            <div
              role="status"
              className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-admin-sm bg-tone-warn border border-tone-warn-bd text-tone-warn-fg"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span className="block">
                <span className="block text-admin-sm font-semibold">
                  Account {profile.dsaStatus}
                </span>
                <span className="block text-admin-xs mt-0.5">
                  You cannot submit new leads at this time. Please contact Admin for support.
                </span>
              </span>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-admin-surface border-t border-admin-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {NAV_ITEMS.map(item => {
            const isActive =
              pathname === item.href || ((pathname ?? "").startsWith(item.href) && item.href !== "/partner")
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "admin-focus flex-1 flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-admin-sm transition-colors",
                  isActive ? "text-admin-accent" : "text-admin-subtle hover:text-admin-text"
                )}
              >
                <item.icon size={19} className="shrink-0" />
                <span className="text-admin-2xs font-semibold">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
