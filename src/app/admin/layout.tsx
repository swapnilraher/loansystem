"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { AdminSidebar, SIDEBAR_ID } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { db, getMessagingClient } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { getToken, onMessage } from "firebase/messaging"
import { motion, AnimatePresence } from "framer-motion"

import { ShieldCheck, LayoutDashboard, Briefcase, Menu, CheckCircle2, Kanban, Handshake, MessageSquare, Sparkles } from "lucide-react"
import { WaNotificationsProvider, useWaNotificationsContext } from "@/context/WaNotificationsContext"
import { WA_NOTIFICATION_TYPE } from "@/lib/waNotificationShared"
import { useLeads } from "@/lib/hooks/useLeads"
import { useUsers } from "@/lib/hooks/useUsers"
import { useLocalState } from "@/lib/hooks/useLocalState"
import { useIsDesktop } from "@/lib/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { can, canAccessRoute } from "@/lib/permissions"
import { STATUS_PENDING_APPROVAL } from "@/lib/disbursement"
import { ToastProvider } from "@/components/admin/ui"

/**
 * Notification chime. Still a third-party CDN fetch on every push — it will
 * simply stay silent offline or if mixkit is unreachable. Drop an mp3 in
 * /public and point this at it to make notifications self-contained.
 */
const NOTIFICATION_SOUND_URL =
  "https://assets.mixkit.co/active_storage/sfx/911/911-200.mp3"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, adminRole, role, accountDisabled, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    title: string;
    body: string;
    type: 'lead' | 'partner' | 'whatsapp';
    /** Where "View details" goes — resolved when the push arrives. */
    href: string;
  } | null>(null)

  // Both persisted per browser. `data-admin-theme` is scoped to the CRM on
  // purpose: the marketing site's ThemeContext force-strips `.dark`, so a
  // shared class would fight it on every load.
  const [theme, setTheme] = useLocalState<"light" | "dark">("admin:theme", "light")
  const [railState, setRailState] = useLocalState<"expanded" | "collapsed">("admin:rail", "expanded")
  const [navState, setNavState] = useLocalState<"visible" | "hidden">("admin:nav", "visible")
  const collapsed = railState === "collapsed"
  const desktopHidden = navState === "hidden"

  // The header's single nav control means different things either side of `lg`:
  // below it the sidebar is an overlay drawer, above it it is a fixed column.
  const isDesktop = useIsDesktop()

  /**
   * The drawer is a *mobile* modal, so it can never be open at `lg` and above.
   * Deriving it rather than reading `sidebarOpen` raw is what makes crossing
   * the breakpoint release the scroll lock: `AdminSidebar`'s modal effect is
   * keyed on this value, so the cleanup runs on the same render as the resize.
   *
   * Without it, a drawer opened at 900px and then widened past 1024px stayed
   * logically open forever — invisible, because both the backdrop and the
   * drawer's own close button are `lg:hidden` and the sidebar reads as the
   * normal docked column — while `lockScroll` kept an inline `overflow:hidden`
   * on the content column. The whole CRM simply stopped scrolling with nothing
   * on screen to explain why, and the only way out was pressing the hamburger
   * twice. That is the bug that makes the hamburger look broken.
   */
  const drawerOpen = !isDesktop && sidebarOpen

  /**
   * ...and clear the stale flag, so narrowing back below `lg` does not re-open
   * the drawer on its own. Adjusted during render rather than in an effect:
   * React re-runs the component before committing, so the committed tree
   * already has the drawer closed, and this codebase deliberately avoids
   * set-state-in-effect.
   */
  const [wasDesktop, setWasDesktop] = useState(isDesktop)
  if (isDesktop !== wasDesktop) {
    setWasDesktop(isDesktop)
    if (isDesktop && sidebarOpen) setSidebarOpen(false)
  }

  const navOpen = isDesktop ? !desktopHidden : sidebarOpen
  const toggleNav = () => {
    if (isDesktop) {
      setNavState(desktopHidden ? "visible" : "hidden")
    } else {
      setSidebarOpen(open => !open)
    }
  }

  const { leads } = useLeads()
  const { users } = useUsers()

  const pendingApprovals = leads.filter(l => l.status === STATUS_PENDING_APPROVAL).length

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-admin-theme", theme)
    // Leaving the CRM must hand the marketing site back its light theme.
    return () => root.removeAttribute("data-admin-theme")
  }, [theme])

  // Auto-dismiss in-app notification toast after 8 seconds
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeNotification]);


  // Real-time browser push notifications for new leads and new DSA partners via FCM
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !user || !adminRole) return;

    /**
     * Setup is async, so the effect can be torn down while it is still awaiting.
     * Previously the cleanup only read `unsubscribe`, which is null until the
     * whole chain finishes — so a teardown mid-setup cancelled nothing, the
     * in-flight run went on to register `onMessage` anyway, and that listener
     * was never removed. React StrictMode double-invokes effects in dev (Next
     * defaults `reactStrictMode` on), which makes that the *normal* path: two
     * live listeners, so every push fired the toast twice and played the sound
     * twice. This flag is what lets a teardown actually stop the run.
     */
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let stopWaitingForGesture: (() => void) | null = null;

    const setupMessaging = async () => {
      try {
        const messagingInstance = await getMessagingClient();
        if (cancelled) return;
        if (!messagingInstance) {
          console.log("Firebase Messaging not supported/initialized in this browser.");
          return;
        }
        if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

        // Register service worker for mobile notifications compatibility and FCM background
        const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        if (cancelled) return;

        const acquireToken = async () => {
          try {
            const currentToken = await getToken(messagingInstance, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
              serviceWorkerRegistration: reg
            });
            if (cancelled) return;
            if (currentToken) {
              // Save token to admin user document
              await updateDoc(doc(db, "users", user.uid), {
                fcmTokens: arrayUnion(currentToken)
              });
            } else {
              console.log("No registration token available. Request permission to generate one.");
            }
          } catch (err) {
            console.error("An error occurred while retrieving token:", err);
          }
        };

        if (Notification.permission === "granted") {
          await acquireToken();
        } else if (Notification.permission === "default") {
          /**
           * Wait for a real interaction before asking.
           *
           * This used to call `requestPermission()` the moment the CRM mounted.
           * Chrome and Firefox both penalise a permission prompt that is not
           * tied to a user gesture — Chrome downgrades it to the quiet UI or
           * blocks it outright — and a dismissed prompt latches to `denied`
           * permanently, after which push can never work again for that user.
           * One gesture is enough to make it a normal prompt.
           */
          const ask = async () => {
            stopWaitingForGesture?.();
            stopWaitingForGesture = null;
            if (cancelled) return;
            if ((await Notification.requestPermission()) === "granted") await acquireToken();
          };
          window.addEventListener("pointerdown", ask, { once: true });
          window.addEventListener("keydown", ask, { once: true });
          stopWaitingForGesture = () => {
            window.removeEventListener("pointerdown", ask);
            window.removeEventListener("keydown", ask);
          };
        }

        if (cancelled) return;

        // Listen for foreground messages
        unsubscribe = onMessage(messagingInstance, (payload) => {
          const title = payload.notification?.title || "New Notification";
          const body = payload.notification?.body || "";
          const rawType = payload.data?.type;

          // An incoming WhatsApp message on a lead whose Auto Chatbot is off
          // deep-links to that lead's conversation; the older lead/partner
          // pushes keep their existing destinations.
          const type =
            rawType === 'partner' ? 'partner'
            : rawType === WA_NOTIFICATION_TYPE ? 'whatsapp'
            : 'lead';

          let href = '/admin/leads';
          if (type === 'partner') {
            href = '/admin/partners';
          } else if (type === 'whatsapp') {
            const params = new URLSearchParams();
            if (payload.data?.phone) params.set('q', payload.data.phone);
            if (payload.data?.leadId) params.set('chat', payload.data.leadId);
            const queryString = params.toString();
            href = queryString ? `/admin/leads?${queryString}` : '/admin/leads';
          }

          // Trigger premium in-app toast
          setActiveNotification({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title,
            body,
            type,
            href
          });

          // `play()` REJECTS under autoplay policy rather than throwing, so the
          // old try/catch never saw it and every blocked sound surfaced as an
          // unhandled promise rejection in the console.
          const audio = new Audio(NOTIFICATION_SOUND_URL);
          audio.volume = 0.4;
          void audio.play().catch(() => {
            /* autoplay blocked until the user interacts — not an error */
          });
        });
      } catch (err) {
        console.error("FCM setup failed in layout:", err);
      }
    };

    setupMessaging();

    return () => {
      cancelled = true;
      stopWaitingForGesture?.();
      unsubscribe?.();
    };
  }, [user, adminRole]);

  const isLoginPage = pathname === "/admin/login" || pathname === "/login"

  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user) {
        // Not logged in at all, redirect to admin login page
        router.push(pathname.startsWith("/admin") ? "/admin/login" : "/login")
      }
    }
  }, [user, loading, router, pathname, isLoginPage])

  if (isLoginPage) {
    // No `justify-center` here: the page centres its own card with auto
    // margins, which is what lets a tall form scroll instead of overflowing
    // past the top of the viewport.
    return <div className="admin-root min-h-dvh bg-admin-bg flex flex-col">{children}</div>
  }

  // Deactivated staff account: keep them out of the CRM with a clear message
  // instead of an unexplained bounce to the marketing site.
  if (!loading && accountDisabled) {
    return (
      <div className="admin-root min-h-dvh flex flex-col items-center justify-center bg-admin-bg gap-4 px-6 text-center">
        <div className="w-12 h-12 rounded-admin bg-tone-danger border border-tone-danger-bd flex items-center justify-center">
          <ShieldCheck className="text-tone-danger-fg" size={22} />
        </div>
        <div>
          <h1 className="text-admin-xl font-semibold text-admin-text">Account deactivated</h1>
          <p className="text-admin-sm text-admin-muted mt-1.5 max-w-sm">
            Your staff account is currently inactive. Please contact an administrator to regain access to the CRM.
          </p>
        </div>
        <button
          onClick={logout}
          className="admin-focus h-9 px-4 bg-admin-accent text-admin-accent-fg rounded-admin-sm text-admin-sm font-semibold hover:bg-admin-accent-hover transition-colors"
        >
          Sign out
        </button>
      </div>
    )
  }

  // Loading state check
  if (loading) {
    return <AdminSplash />
  }

  // Strict Security & Role-Based Access Control: Block Partner Users & Normal Users from Admin Panel
  if (user && !adminRole) {
    const isPartnerUser = profile?.role === "partner" || Boolean(profile?.dsaCode || profile?.dsaStatus)
    return (
      <div className="admin-root min-h-dvh flex flex-col items-center justify-center bg-admin-bg gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-admin-lg bg-tone-danger border border-tone-danger-bd flex items-center justify-center shadow-lg">
          <ShieldCheck className="text-tone-danger-fg" size={32} />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-admin-2xl font-black text-admin-text">
            {isPartnerUser ? "Partner Access Restricted (पार्टनर अ‍ॅक्सेस नाकारला)" : "Access Denied (अ‍ॅक्सेस नाकारला)"}
          </h1>
          <p className="text-admin-sm text-admin-muted leading-relaxed">
            {isPartnerUser
              ? "पार्टनर अकाउंटवरून अ‍ॅडमिन पोर्टलला अ‍ॅक्सेस करता येत नाही. कृपया तुमचे कार्य पूर्ण करण्यासाठी Partner Portal वापरा. Partner accounts cannot access Staff Admin Portal."
              : "तुम्हाला अ‍ॅडमिन पॅनेल वापरण्याची परवानगी नाही. Admin panel access is strictly reserved for authorized staff only."}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Link
            href={isPartnerUser ? "/partner" : "/dashboard"}
            className="admin-focus h-10 px-5 inline-flex items-center bg-admin-accent text-admin-accent-fg rounded-admin-sm text-admin-sm font-bold hover:bg-admin-accent-hover transition-colors shadow-sm"
          >
            {isPartnerUser ? "Partner Portal वर जा" : "User Dashboard वर जा"}
          </Link>
          <button
            onClick={logout}
            className="admin-focus h-10 px-5 inline-flex items-center bg-admin-surface border border-admin-border text-admin-text rounded-admin-sm text-admin-sm font-semibold hover:bg-admin-surface-2 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      {/* One WhatsApp-notification listener for the header bell, the Leads
          screen and the inbox — see WaNotificationsContext. */}
      <WaNotificationsProvider>
      {/* `admin-root` is the hook globals.css uses to quarantine Bootstrap's
          unlayered Reboot rules from the CRM. Server-rendered on purpose, so
          there is no flash of Bootstrap-sized type before hydration. */}
      <div className="admin-root h-dvh bg-admin-bg relative overflow-hidden">
        <AdminSidebar
          isOpen={drawerOpen}
          onClose={() => setSidebarOpen(false)}
          pendingApprovals={pendingApprovals}
          collapsed={collapsed}
          onToggleCollapsed={() => setRailState(collapsed ? "expanded" : "collapsed")}
          desktopHidden={desktopHidden}
          visible={navOpen}
        />

        {/* Mobile sidebar overlay backdrop. Gated on `drawerOpen`, not
            `sidebarOpen`: `lg:hidden` only stopped it being *seen* at desktop
            widths, it did not stop the drawer being logically open. */}
        {drawerOpen && (
          <div
            className="fixed inset-0 bg-admin-overlay z-190 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* No `relative z-10` here — fixed modals inside children must be able to
            stack above the mobile bottom navigation bar. */}
        {/* Content column offset must track the sidebar rail width exactly.
            `data-scroll-lock` marks this as the real scroll container, so
            overlays lock it rather than only <body>, which never scrolls. */}
        <div
          data-scroll-lock
          className={cn(
            "min-w-0 ml-0 h-dvh overflow-y-auto overscroll-contain custom-scrollbar relative transition-[margin] duration-200 motion-reduce:transition-none",
            // These two must equal AdminSidebar's own width classes exactly --
            // `w-56` expanded, `w-[50px]` collapsed. Any drift shows up as a
            // dead strip between the sidebar and the page, which is precisely
            // the "sidebar gap" this kept producing.
            //
            // `[50px]` stays an arbitrary value on both sides on purpose. The
            // linter offers `ml-12.5`, but Tailwind's scale is rem-based and
            // this app ramps `html` to 17px on desktop, so 12.5 resolves to
            // 3.125rem = 53px and silently re-opens a 3px gap.
            desktopHidden ? "lg:ml-0" : collapsed ? "lg:ml-[50px]" : "lg:ml-52"
          )}
        >
          <AdminHeader
            onToggleNav={toggleNav}
            navOpen={navOpen}
            leads={leads}
            users={users}
            pendingApprovals={pendingApprovals}
            theme={theme}
            onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
          {/* Bottom padding clears the fixed nav *and* the home indicator.
              The nav itself is ~56px, so 5rem leaves a comfortable gap without
              stranding a screenful of dead space under short pages. */}
          <main className="px-3 py-3 md:px-6 md:py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6">
            {canAccessRoute(role, pathname) ? children : (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-24 px-6">
                <div className="w-12 h-12 rounded-admin bg-tone-warn border border-tone-warn-bd flex items-center justify-center">
                  <ShieldCheck className="text-tone-warn-fg" size={22} />
                </div>
                <div>
                  <h2 className="text-admin-xl font-semibold text-admin-text">Restricted section</h2>
                  <p className="text-admin-sm text-admin-muted mt-1.5 max-w-sm">
                    Your role ({role}) does not have access to this part of the CRM.
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="admin-focus h-9 px-4 inline-flex items-center bg-admin-accent text-admin-accent-fg rounded-admin-sm text-admin-sm font-semibold hover:bg-admin-accent-hover transition-colors"
                >
                  Back to overview
                </Link>
              </div>
            )}
          </main>
        </div>

        {/* Sticky mobile bottom navigation. z-100 keeps it below dialogs. */}
        <nav
          aria-label="Primary"
          className="fixed bottom-0 left-0 right-0 bg-admin-surface border-t border-admin-border px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-center justify-around z-100 lg:hidden select-none"
        >
          <BottomTab href="/admin" label="Overview" icon={LayoutDashboard} active={pathname === "/admin"} />
          <BottomTab
            href="/admin/leads"
            label="Leads"
            icon={Briefcase}
            active={!!pathname?.startsWith("/admin/leads")}
          />
          {can(role, "disbursement:approve") ? (
            <BottomTab
              href="/admin/approvals"
              label="Approvals"
              icon={CheckCircle2}
              active={!!pathname?.startsWith("/admin/approvals")}
              badge={pendingApprovals}
            />
          ) : (
            <BottomTab
              href="/admin/kanban"
              label="Pipeline"
              icon={Kanban}
              active={!!pathname?.startsWith("/admin/kanban")}
            />
          )}
          {/* Gated on the same rule the router enforces, so a telecaller is
              never given a tab that lands them on "Restricted section" — which
              also keeps their bar at four items. */}
          {canAccessRoute(role, "/admin/whatsapp-inbox") && (
            <WhatsAppTab pathname={pathname} />
          )}
          {/* A toggle, not an open-only button — it used to disagree with the
              header control it duplicates. */}
          <button
            onClick={() => setSidebarOpen(open => !open)}
            aria-expanded={drawerOpen}
            aria-controls={SIDEBAR_ID}
            className={cn(
              "admin-focus flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-admin-sm transition-colors active:scale-95",
              drawerOpen ? "text-admin-accent" : "text-admin-subtle"
            )}
          >
            <Menu size={19} />
            <span className="text-admin-2xs font-medium">More</span>
          </button>
        </nav>

        {/* Real-time FCM notification toast. Separate from the app toast stack:
            this one is a push notification with its own routing action. */}
        <AnimatePresence>
          {activeNotification && (
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="fixed top-4 right-4 z-500 w-[320px] sm:w-[360px] rounded-admin border border-admin-border bg-admin-surface shadow-admin-3 p-3.5"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`w-8 h-8 rounded-admin-sm flex items-center justify-center shrink-0 border ${
                    activeNotification.type === 'partner'
                      ? 'bg-tone-info border-tone-info-bd text-tone-info-fg'
                      : 'bg-tone-success border-tone-success-bd text-tone-success-fg'
                  }`}
                >
                  {activeNotification.type === 'partner' ? <Handshake size={15} />
                    : activeNotification.type === 'whatsapp' ? <MessageSquare size={15} />
                    : <Sparkles size={15} />}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-admin-sm font-semibold text-admin-text">{activeNotification.title}</h4>
                  <p className="text-admin-xs text-admin-muted mt-0.5 whitespace-pre-line">
                    {activeNotification.body}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => {
                        router.push(activeNotification.href);
                        setActiveNotification(null);
                      }}
                      className="admin-focus h-7 px-2.5 rounded-admin-sm bg-admin-accent text-admin-accent-fg text-admin-xs font-semibold hover:bg-admin-accent-hover transition-colors"
                    >
                      {activeNotification.type === 'whatsapp' ? 'Open chat' : 'View details'}
                    </button>
                    <button
                      onClick={() => setActiveNotification(null)}
                      className="admin-focus h-7 px-2 rounded-admin-sm text-admin-xs font-semibold text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </WaNotificationsProvider>
    </ToastProvider>
  )
}

/**
 * The WhatsApp mark. lucide-react dropped brand icons, so the tab had been
 * standing in a generic speech bubble — which reads as "messages", not as
 * "WhatsApp", next to four other line icons in the same bar.
 *
 * Signature matches a lucide icon (`size`, `className`) so it drops straight
 * into `BottomTab`'s `icon` prop, and `fill="currentColor"` means it inherits
 * the active/inactive tab colour exactly like its neighbours.
 */
function WhatsAppIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.465 3.488" />
    </svg>
  )
}

/**
 * Its own component purely so it can read the notification context: the layout
 * *renders* the provider, so the layout body itself sits outside it and cannot
 * call the hook. The badge counts unread incoming WhatsApp messages, matching
 * the header bell.
 */
function WhatsAppTab({ pathname }: { pathname: string | null }) {
  const { unreadCount } = useWaNotificationsContext()
  return (
    <BottomTab
      href="/admin/whatsapp-inbox"
      label="WhatsApp"
      icon={WhatsAppIcon}
      active={!!pathname?.startsWith("/admin/whatsapp-inbox")}
      badge={unreadCount}
    />
  )
}

/**
 * Branded hold screen shown while `AuthContext` resolves the signed-in user's
 * staff record against `admin_users`.
 *
 * Worth more than a bare spinner: this is the first thing staff see on every
 * cold load of the CRM, it is the *only* thing on screen while the role check
 * runs, and on a slow connection that can last a couple of seconds. It reuses
 * the login screen's mark and wordmark so the two read as one product.
 *
 * All motion is Tailwind's built-ins — no keyframes are added to globals.css —
 * and every animated layer opts out under `prefers-reduced-motion`, which
 * leaves a clean static lockup rather than a frozen half-drawn ring.
 */
function AdminSplash() {
  return (
    // `overflow-hidden` is load-bearing: the ambient washes below are wider
    // than the viewport by design, and without it they open a scrollbar.
    <div className="admin-root relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-admin-bg px-6 text-center">
      {/*
        Ambient depth. Two large accent washes drifting on offset cycles —
        `blur-3xl` is what turns them into light rather than two visible green
        circles, and the low alpha keeps them under the content instead of
        competing with it. `animate-blob` is already defined in globals.css.
      */}
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
          {/*
            Outer hairline turning slowly the other way. Two rings moving in
            opposite directions at different speeds is what gives the lockup
            depth; one ring alone reads flat no matter how it is styled.
          */}
          <span
            aria-hidden
            style={{ animationDuration: "18s", animationDirection: "reverse" }}
            className="absolute w-36 h-36 rounded-full border border-admin-border animate-spin motion-reduce:animate-none"
          />

          {/*
            The sweep. A conic gradient masked down to a 2px ring, so the accent
            fades up and away around the circle instead of the hard quarter-arc
            a `border-t-` trick gives you. Written as inline style rather than
            arbitrary utilities on purpose — Tailwind silently drops a class it
            cannot parse, and a dropped mask here means a solid green disc.
          */}
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

          {/* Glow pooling under the mark, so it sits in the light rather than on it. */}
          <span
            aria-hidden
            className="absolute w-20 h-20 rounded-full bg-admin-accent/25 blur-xl"
          />

          <span className="relative w-18 h-18 rounded-admin-lg overflow-hidden border border-admin-border bg-admin-surface shadow-admin-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.webp" alt="" className="w-full h-full object-cover" />
          </span>
        </div>

        {/* Colour comes from the sheen class (it paints the gradient through
            the glyphs), so no `text-admin-*` here — it would be overridden. */}
        <h1 className="admin-splash-sheen text-admin-2xl font-semibold tracking-tight mt-8">
          Techstar Money Solution
        </h1>
        <p className="text-admin-2xs font-medium uppercase tracking-[0.25em] text-admin-subtle mt-2">
          Staff portal
        </p>

        {/* Indeterminate rail. `overflow-hidden` on the track is what clips the
            bar at each end, so it reads as movement through a slot. */}
        <span
          aria-hidden
          className="relative mt-7 h-0.5 w-44 overflow-hidden rounded-full bg-admin-border"
        >
          <span className="admin-splash-rail absolute inset-y-0 left-0 w-1/3 rounded-full bg-admin-accent" />
        </span>

        <p className="flex items-center gap-2 text-admin-sm font-medium text-admin-muted mt-5">
          <ShieldCheck size={15} className="text-admin-accent shrink-0" />
          Verifying permissions…
        </p>
      </div>
    </div>
  )
}

function BottomTab({
  href,
  label,
  icon: Icon,
  active,
  badge = 0,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      // `px-2` rather than `px-3`: Admin and Manager now get a fifth tab, and
      // the wider padding pushed the row past the edge on a 360px phone.
      className={`admin-focus relative flex min-w-0 flex-col items-center justify-center gap-0.5 min-h-11 px-2 rounded-admin-sm transition-colors ${
        active ? "text-admin-accent" : "text-admin-subtle"
      }`}
    >
      <Icon size={19} />
      <span className={`text-admin-2xs ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
      {badge > 0 && (
        <span className="admin-num absolute top-0 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-tone-warn-fg text-admin-surface text-admin-2xs font-semibold flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}
