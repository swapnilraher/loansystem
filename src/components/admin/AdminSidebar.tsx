"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { lockScroll } from "@/lib/scrollLock";
import { useAuth } from "@/context/AuthContext";
import { canAccessRoute } from "@/lib/permissions";
import { NAV_GROUPS, activeHref } from "./nav";

export const SIDEBAR_ID = "admin-sidebar";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface AdminSidebarProps {
  /** Mobile drawer open state. */
  isOpen?: boolean;
  onClose?: () => void;
  /**
   * Passed down from the layout, which already listens to leads — a second
   * listener here re-rendered the whole sidebar on every lead change.
   */
  pendingApprovals?: number;
  /** Desktop: narrow icon rail instead of the full 288px sidebar. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Desktop: sidebar slid off-screen entirely, toggled from the header. */
  desktopHidden?: boolean;
  /**
   * Whether the sidebar is actually on screen at the current breakpoint.
   * Drives `inert`, so an off-screen sidebar never collects tab stops.
   */
  visible?: boolean;
}

export function AdminSidebar({
  isOpen = false,
  onClose,
  pendingApprovals = 0,
  collapsed = false,
  onToggleCollapsed,
  desktopHidden = false,
  visible = true,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { role, logout } = useAuth();
  const active = activeHref(pathname);
  const panelRef = useRef<HTMLElement>(null);

  /**
   * Callers pass a fresh inline arrow every render, and the layout re-renders
   * on every Firestore snapshot. Depending on `onClose` directly re-ran this
   * whole effect each time and re-focused the panel, stealing focus from
   * whatever the user was on. Keep it in a ref.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const restoreFocusTo = useRef<HTMLElement | null>(null);

  // The mobile drawer is a modal surface: Escape closes it, the page behind it
  // must not scroll, and focus has to land inside so keyboard users are not
  // left tabbing through content hidden behind the backdrop.
  useEffect(() => {
    if (!isOpen) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }

      /**
       * Trap Tab inside the panel. Without this, tabbing past the drawer's last
       * control walked straight into the header and page content underneath —
       * covered by an opaque backdrop, so the focus ring was invisible and
       * Enter fired things the user could not see. The first stop out was the
       * hamburger itself, sitting physically beneath the drawer.
       */
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // The panel itself is `tabIndex={-1}` and holds focus on open, so the
      // first Tab has to be steered manually into the list.
      if (!panel.contains(active) || active === panel) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const release = lockScroll();
    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(raf);
      release();
      // Hand focus back to the hamburger rather than stranding it on <body>.
      restoreFocusTo.current?.focus?.();
    };
  }, [isOpen]);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessRoute(role, item.href)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      id={SIDEBAR_ID}
      ref={panelRef}
      tabIndex={-1}
      aria-label="Main navigation"
      // `inert` rather than `aria-hidden`: the panel itself is focusable, and
      // aria-hidden on a focusable element is invalid. Off-screen nav must not
      // collect tab stops.
      inert={!visible}
      className={cn(
        "fixed left-0 top-0 bottom-0 h-dvh bg-admin-surface border-r border-admin-border flex flex-col z-200 outline-none",
        // `translate`, not `transform`: Tailwind v4 compiles `translate-x-*` to
        // the standalone `translate:` property, so transitioning `transform`
        // animated nothing. The panel teleported into place while the content
        // column's margin animated over 200ms — long enough that a second
        // click of an impatient double-tap on the hamburger landed on the
        // sidebar logo and navigated the user away to /admin.
        "transition-[translate,width] duration-200 motion-reduce:transition-none",
        // 13rem expanded, down from 18rem. This is the floor: the longest label
        // ("Payouts & Commissions", 21 chars) needs ~130px, and 13rem leaves
        // ~160px once the nav padding, item padding, icon and gap are taken
        // out. Going narrower starts ellipsizing real nav labels.
        //
        // Paired with `lg:ml-52` / `lg:ml-[50px]` on the content column in
        // admin/layout.tsx -- the same measurement written twice, so changing
        // one without the other leaves a dead strip beside the sidebar.
        collapsed ? "w-40 lg:w-[50px]" : "w-52",
        isOpen ? "translate-x-0" : "-translate-x-full",
        desktopHidden ? "lg:-translate-x-full" : "lg:translate-x-0",
      )}
    >
      <div
        className={cn(
          "h-14 flex items-center gap-2.5 justify-between border-b border-admin-border shrink-0",
          collapsed ? "px-3 lg:justify-center" : "px-3 lg:px-4",
        )}
      >
        <Link
          href="/admin"
          onClick={onClose}
          className={cn(
            // `flex-1` is what actually pins the close button to the far right:
            // the logo block is content-sized, so an auto margin alone left the
            // X floating next to the text instead of against the panel edge.
            // The collapsed desktop rail is the one case that must not grow,
            // or it would defeat `lg:justify-center`.
            "admin-focus flex flex-1 items-center gap-2.5 min-w-0 rounded-admin-sm",
            collapsed && "lg:flex-none",
          )}
        >
          <span className="w-9 h-9 rounded-admin-sm overflow-hidden border border-admin-border bg-admin-surface shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo.webp"
              alt=""
              className="w-full h-full object-cover"
            />
          </span>
          <span className={cn("min-w-0", collapsed && "lg:hidden")}>
            <span className="block text-admin-base font-semibold text-admin-text leading-tight truncate">
              TechStar
            </span>
            <span className="block text-admin-2xs text-admin-subtle leading-tight truncate">
              Staff Portal
            </span>
          </span>
        </Link>

        {/* Desktop: width toggle. Hiding the sidebar entirely lives in the header. */}
        {onToggleCollapsed && !collapsed && (
          <button
            onClick={onToggleCollapsed}
            title="Collapse to icons"
            aria-label="Collapse sidebar to icons"
            className="admin-focus hidden lg:inline-flex ml-auto p-1.5 rounded-admin-sm text-admin-subtle hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
          >
            <PanelLeftClose size={16} />
          </button>
        )}

        {/* Mobile close, inside the drawer, hard against its right edge.
            `ml-auto` eats the gap left by the content-sized logo block. */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="admin-touch admin-focus lg:hidden shrink-0 ml-auto p-2 -mr-1 rounded-admin-sm text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {collapsed && onToggleCollapsed && (
        <button
          onClick={onToggleCollapsed}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className="admin-focus hidden lg:flex items-center justify-center h-8 mx-3 mt-2 rounded-admin-sm text-admin-subtle hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* Was `py-3 space-y-4`. On a nav of 36px rows a 16px group gap read as a
          bigger break than the groups actually are, and pushed the lower ones
          under the fold. */}
      {/* Horizontal padding trimmed from `px-3` to buy the label room back at
          the narrower width -- 8px here plus 5px per item is the difference
          between "Payouts & Commissions" fitting and ellipsizing. */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1 space-y-2">
        {groups.map((group) => (
          <div key={group.id}>
            <p
              className={cn(
                "px-2 mb-0.5 text-admin-2xs font-semibold uppercase tracking-wider text-admin-subtle",
                collapsed && "lg:hidden",
              )}
            >
              {group.label}
            </p>
            {/* Collapsed rail gets a hairline instead of a label, so groups stay legible. */}
            {collapsed && (
              <div className="hidden lg:block h-px bg-admin-border mx-2 mb-1.5" />
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active === item.href;
                const badge =
                  item.href === "/admin/approvals" && pendingApprovals > 0
                    ? String(pendingApprovals)
                    : item.badge;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      title={collapsed ? item.name : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "admin-focus relative flex items-center gap-2.5 h-9 rounded-admin-sm transition-colors",
                        collapsed ? "px-2 lg:justify-center" : "px-2",
                        isActive
                          ? "bg-admin-accent-soft text-admin-text font-semibold"
                          : "text-admin-muted hover:text-admin-text hover:bg-admin-surface-2",
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-admin-accent" />
                      )}
                      <item.icon
                        size={17}
                        className={cn(
                          "shrink-0",
                          isActive ? "text-admin-accent" : "text-admin-subtle",
                        )}
                      />
                      <span
                        className={cn(
                          "text-admin-sm truncate flex-1",
                          collapsed && "lg:hidden",
                        )}
                      >
                        {item.name}
                      </span>
                      {badge && (
                        <span
                          className={cn(
                            "admin-num shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-tone-warn text-tone-warn-fg border border-tone-warn-bd text-admin-2xs font-semibold inline-flex items-center justify-center",
                            collapsed &&
                              "lg:absolute lg:top-0.5 lg:right-0.5 lg:min-w-[15px] lg:h-[15px] lg:px-0",
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Desktop logout lives in the header; this is the mobile drawer's copy. */}
      <div className="p-3 border-t border-admin-border lg:hidden shrink-0">
        <button
          onClick={logout}
          className="admin-focus flex items-center justify-center gap-2 w-full h-9 rounded-admin-sm text-admin-sm font-semibold text-admin-muted hover:text-tone-danger-fg hover:bg-tone-danger transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
