"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  Bell,
  CheckCircle2,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Sun,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useWaNotificationsContext } from "@/context/WaNotificationsContext";
import { can } from "@/lib/permissions";
import { CLOSED_STATUSES } from "@/lib/disbursement";
import { useNow } from "@/lib/hooks/useNow";
import { formatDateTime, timeAgo, toMillis } from "@/lib/dates";
import type { Lead } from "@/lib/hooks/useLeads";
import type { AdminUser } from "@/lib/hooks/useUsers";
import { CommandPalette } from "./CommandPalette";
import { SIDEBAR_ID } from "./AdminSidebar";

interface AdminHeaderProps {
  /** Toggles the nav: the drawer on mobile, the whole sidebar on desktop. */
  onToggleNav?: () => void;
  /** Whether the nav is currently on screen at this breakpoint. */
  navOpen?: boolean;
  /** Owned by the layout so the palette and bell add no Firestore listeners. */
  leads: Lead[];
  users: AdminUser[];
  pendingApprovals: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function AdminHeader({
  onToggleNav,
  navOpen = false,
  leads,
  users,
  pendingApprovals,
  theme,
  onToggleTheme,
}: AdminHeaderProps) {
  const { user, profile, adminRole, role, logout } = useAuth();
  const router = useRouter();
  const {
    unread: waUnread,
    unreadCount: waUnreadCount,
    markRead: markWaRead,
    markAllRead: markAllWaRead,
  } = useWaNotificationsContext();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const now = useNow();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [bellOpen]);

  const alerts = useMemo(() => {
    const open = leads.filter((lead) => !CLOSED_STATUSES.includes(lead.status));
    const unassigned = open.filter((lead) => !lead.assignedTo).length;
    const overdue = open.filter((lead) => {
      const due = toMillis(lead.followUpDate);
      return due !== null && due <= now;
    }).length;
    const recent = leads.slice(0, 4);
    return { unassigned, overdue, recent };
  }, [leads, now]);

  const canApprove = can(role, "disbursement:approve");
  const attentionCount =
    (canApprove ? pendingApprovals : 0) + alerts.unassigned + alerts.overdue;
  const alertCount = attentionCount + waUnreadCount;

  /**
   * Requirement 8 — open the lead's WhatsApp conversation.
   *
   * Routed through Leads rather than `/admin/whatsapp-inbox` on purpose: the
   * inbox is Admin/Manager-only under `ROUTE_ROLES`, and these notifications go
   * to telecallers too. `?q=` filters the table to the number and `?chat=` opens
   * that lead's WhatsApp sheet, which every role can reach.
   */
  const openWaConversation = (notification: {
    id: string;
    leadId: string;
    phone: string;
  }) => {
    setBellOpen(false);
    void markWaRead(notification.id);
    const params = new URLSearchParams();
    if (notification.phone) params.set("q", notification.phone);
    if (notification.leadId) params.set("chat", notification.leadId);
    router.push(`/admin/leads?${params.toString()}`);
  };

  const displayName =
    profile?.name || user?.displayName || user?.email || "Admin User";
  const initials = displayName.substring(0, 2);

  return (
    <>
      {/*
        Solid background on purpose: a sticky bar with `backdrop-blur` forces the
        browser to re-blur what is behind it on every scroll frame, which is the
        single worst source of scroll jank on mobile.
      */}
      <header className="h-14 bg-admin-surface border-b border-admin-border px-3 lg:px-5 flex items-center gap-2 sticky top-0 z-40">
        {/*
          One control for every breakpoint: it opens and closes the drawer on
          mobile and shows or hides the whole sidebar on desktop. It used to be
          `lg:hidden`, which left desktop users with no way to reclaim the
          288px the sidebar occupies.
        */}
        {onToggleNav && (
          <button
            onClick={onToggleNav}
            aria-label={navOpen ? "Hide navigation" : "Show navigation"}
            aria-expanded={navOpen}
            aria-controls={SIDEBAR_ID}
            title={navOpen ? "Hide navigation" : "Show navigation"}
            className="admin-touch admin-focus p-2 -ml-1 rounded-admin-sm text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
          >
            {navOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}

        {/* Desktop: looks like a field, behaves like the ⌘K trigger. */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="admin-focus hidden md:flex items-center gap-2 h-9 w-full max-w-sm px-3 rounded-admin-sm border border-admin-border bg-admin-surface-2 text-admin-muted hover:border-admin-border-strong hover:text-admin-text transition-colors"
        >
          <Search size={15} className="shrink-0" />
          <span className="text-admin-sm">Search leads, team, pages…</span>
          <kbd className="ml-auto text-admin-2xs border border-admin-border rounded px-1.5 py-0.5 bg-admin-surface">
            ⌘K
          </kbd>
        </button>

        {/* Branch Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 h-7 rounded bg-admin-accent-soft border border-admin-accent/15 text-admin-accent text-[11px] font-bold select-none ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-admin-accent animate-pulse" />
          Chhatrapati Sambhajinagar Branch
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          aria-label="Search"
          className="admin-touch admin-focus md:hidden p-2 rounded-admin-sm text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
        >
          <Search size={18} />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onToggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            title={theme === "dark" ? "Light theme" : "Dark theme"}
            className="admin-touch admin-focus p-2 rounded-admin-sm text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen((o) => !o)}
              aria-label={`Notifications${alertCount ? ` (${alertCount})` : ""}`}
              className="admin-touch admin-focus relative p-2 rounded-admin-sm text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
            >
              <Bell size={18} />
              {alertCount > 0 && (
                <span className="admin-num absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-tone-danger-fg text-admin-surface text-admin-2xs font-semibold flex items-center justify-center">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-11 w-[300px] max-h-[calc(100dvh-5.5rem)] flex flex-col bg-admin-surface border border-admin-border rounded-admin shadow-admin-3 overflow-hidden z-50">
                {/*
                  The panel used to have `overflow-hidden` and no height cap, so
                  it grew as tall as its contents. It is absolutely positioned
                  inside a `sticky` header, so it does not move with the page —
                  anything past the bottom of the viewport simply could not be
                  reached by scrolling. Capped to the viewport minus the header,
                  with the list below as the single scroll area.
                */}
                <div className="shrink-0 flex items-center gap-2 px-3.5 py-2.5 border-b border-admin-border">
                  <p className="flex-1 text-admin-xs font-semibold uppercase tracking-wider text-admin-subtle">
                    Notifications
                  </p>
                  {waUnreadCount > 0 && (
                    <button
                      onClick={() => void markAllWaRead()}
                      className="admin-focus text-admin-2xs font-semibold text-admin-accent hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* `min-h-0` is load-bearing: a flex child defaults to
                    `min-height: auto`, which refuses to shrink below its
                    content, so without it this box would just grow past the
                    capped panel and get clipped rather than scroll.
                    `overscroll-contain` stops a flick past the end of the list
                    from scrolling the page behind it. */}
                <div className="min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">
                  {/*
                    Incoming WhatsApp messages on leads whose Auto Chatbot is
                    off. These sit above the derived alerts because nobody else
                    is answering them — the bot is deliberately silent on these
                    threads, so the customer is waiting on a person.
                  */}
                  {waUnread.length > 0 && (
                    <>
                      <p className="px-3.5 py-2 text-admin-xs font-semibold uppercase tracking-wider text-tone-success-fg border-b border-admin-border bg-tone-success">
                        WhatsApp · awaiting your reply
                      </p>
                      <div className="divide-y divide-admin-border">
                        {waUnread.slice(0, 8).map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => openWaConversation(notification)}
                            className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-admin-surface-2 transition-colors"
                          >
                            <MessageSquare
                              size={15}
                              className="text-tone-success-fg shrink-0 mt-0.5"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline gap-2">
                                <span className="flex-1 truncate text-admin-sm font-semibold text-admin-text">
                                  {notification.leadName || "Customer"}
                                </span>
                                <span
                                  className="admin-num shrink-0 text-admin-2xs text-admin-subtle"
                                  title={formatDateTime(notification.receivedAt)}
                                >
                                  {timeAgo(notification.receivedAt, now)}
                                </span>
                              </span>
                              <span className="block truncate text-admin-xs text-admin-muted mt-0.5">
                                {notification.message}
                              </span>
                              <span className="block truncate text-admin-2xs text-admin-subtle mt-1">
                                {notification.leadStatus || "New Lead"}
                                {notification.assignedToName
                                  ? ` · ${notification.assignedToName}`
                                  : " · Unassigned"}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                      {waUnread.length > 8 && (
                        <p className="px-3.5 py-1.5 text-admin-2xs text-admin-subtle border-b border-admin-border">
                          +{waUnread.length - 8} more waiting
                        </p>
                      )}
                    </>
                  )}

                  <p className="px-3.5 py-2 text-admin-xs font-semibold uppercase tracking-wider text-admin-subtle border-b border-admin-border bg-admin-surface-2">
                    Needs attention
                  </p>

                  <div className="divide-y divide-admin-border">
                  {canApprove && pendingApprovals > 0 && (
                    <Link
                      href="/admin/approvals"
                      onClick={() => setBellOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-admin-surface-2 transition-colors"
                    >
                      <CheckCircle2
                        size={15}
                        className="text-tone-warn-fg shrink-0"
                      />
                      <span className="text-admin-sm text-admin-text flex-1">
                        Disbursals awaiting sign-off
                      </span>
                      <span className="admin-num text-admin-sm font-semibold text-admin-text">
                        {pendingApprovals}
                      </span>
                    </Link>
                  )}

                  {alerts.overdue > 0 && (
                    <Link
                      href="/admin/leads"
                      onClick={() => setBellOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-admin-surface-2 transition-colors"
                    >
                      <AlarmClock
                        size={15}
                        className="text-tone-danger-fg shrink-0"
                      />
                      <span className="text-admin-sm text-admin-text flex-1">
                        Follow-ups overdue
                      </span>
                      <span className="admin-num text-admin-sm font-semibold text-admin-text">
                        {alerts.overdue}
                      </span>
                    </Link>
                  )}

                  {alerts.unassigned > 0 && (
                    <Link
                      href="/admin/leads"
                      onClick={() => setBellOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-admin-surface-2 transition-colors"
                    >
                      <UserPlus
                        size={15}
                        className="text-tone-info-fg shrink-0"
                      />
                      <span className="text-admin-sm text-admin-text flex-1">
                        Unassigned leads in the pool
                      </span>
                      <span className="admin-num text-admin-sm font-semibold text-admin-text">
                        {alerts.unassigned}
                      </span>
                    </Link>
                  )}

                  {attentionCount === 0 && (
                    <p className="px-3.5 py-6 text-center text-admin-sm text-admin-muted">
                      Nothing needs you right now.
                    </p>
                  )}
                </div>

                {alerts.recent.length > 0 && (
                  <>
                    <p className="px-3.5 py-2 text-admin-xs font-semibold uppercase tracking-wider text-admin-subtle border-y border-admin-border bg-admin-surface-2">
                      Latest leads
                    </p>
                    {/* No scroller of its own any more — a 224px window nested
                        inside the panel's scroller was two scroll areas under
                        one thumb, and the outer one is the whole panel now. */}
                    <div>
                      {alerts.recent.map((lead) => (
                        <Link
                          key={lead.id}
                          href="/admin/leads"
                          onClick={() => setBellOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-admin-surface-2 transition-colors"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-admin-sm text-admin-text truncate">
                              {lead.name || lead.fullName || "Unnamed lead"}
                            </span>
                            <span className="block text-admin-2xs text-admin-subtle truncate">
                              {lead.type || "Loan"} · {lead.status}
                            </span>
                          </span>
                          <span className="text-admin-2xs text-admin-subtle shrink-0">
                            {timeAgo(lead.createdAt, now)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-admin-border mx-1.5" />

          <Link
            href="/admin/profile"
            className={cn(
              "admin-focus flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-admin-sm hover:bg-admin-surface-2 transition-colors",
            )}
          >
            <span className="w-8 h-8 rounded-admin-sm bg-admin-accent-soft border border-admin-border text-admin-accent flex items-center justify-center text-admin-xs font-semibold uppercase shrink-0">
              {initials}
            </span>
            <span className="text-right hidden sm:block">
              <span className="block text-admin-sm font-semibold text-admin-text leading-tight truncate max-w-[140px]">
                {displayName}
              </span>
              <span className="block text-admin-2xs text-admin-subtle leading-tight">
                {adminRole || "Staff"}
              </span>
            </span>
          </Link>

          <button
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="admin-focus hidden lg:inline-flex p-2 rounded-admin-sm text-admin-subtle hover:text-tone-danger-fg hover:bg-tone-danger transition-colors"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        leads={leads}
        users={users}
        role={role}
      />
    </>
  );
}
