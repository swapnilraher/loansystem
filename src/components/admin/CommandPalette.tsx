"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Briefcase, CornerDownLeft, Search, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { canAccessRoute, CrmRole } from "@/lib/permissions"
import { NAV_ITEMS } from "./nav"
import { useIsClient } from "@/components/admin/ui/useIsClient"
import type { Lead } from "@/lib/hooks/useLeads"
import type { AdminUser } from "@/lib/hooks/useUsers"

interface Result {
  id: string
  label: string
  hint?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
  section: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  /**
   * Passed in from the layout. The palette never opens its own Firestore
   * listener — the layout is already subscribed to both collections.
   */
  leads: Lead[]
  users: AdminUser[]
  role: CrmRole | null
}

const MAX_LEADS = 6
const MAX_USERS = 4

export function CommandPalette({ open, onClose, leads, users, role }: CommandPaletteProps) {
  const mounted = useIsClient()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()

    const nav: Result[] = NAV_ITEMS.filter(item => canAccessRoute(role, item.href))
      .filter(item => !q || `${item.name} ${item.keywords ?? ""}`.toLowerCase().includes(q))
      .map(item => ({
        id: `nav:${item.href}`,
        label: item.name,
        icon: item.icon,
        href: item.href,
        section: "Go to",
      }))

    if (!q) return nav

    const leadHits: Result[] = leads
      .filter(lead => {
        const haystack = [lead.name, lead.fullName, lead.phone, lead.mobile, lead.email, lead.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return haystack.includes(q)
      })
      .slice(0, MAX_LEADS)
      .map(lead => ({
        id: `lead:${lead.id}`,
        label: lead.name || lead.fullName || "Unnamed lead",
        hint: [lead.phone || lead.mobile, lead.status].filter(Boolean).join(" · "),
        icon: Briefcase,
        href: `/admin/leads?q=${encodeURIComponent(lead.phone || lead.name || "")}`,
        section: "Leads",
      }))

    const userHits: Result[] = users
      .filter(user => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(q))
      .slice(0, MAX_USERS)
      .map(user => ({
        id: `user:${user.id}`,
        label: user.name,
        hint: [user.role, user.email].filter(Boolean).join(" · "),
        icon: User,
        href: `/admin/users?q=${encodeURIComponent(user.name)}`,
        section: "Team",
      }))

    return [...nav, ...leadHits, ...userHits]
  }, [query, leads, users, role])

  // Reset the cursor whenever the result set changes underneath it.
  const resultCount = results.length
  const safeCursor = resultCount === 0 ? 0 : Math.min(cursor, resultCount - 1)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setCursor(c => (resultCount === 0 ? 0 : (c + 1) % resultCount))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setCursor(c => (resultCount === 0 ? 0 : (c - 1 + resultCount) % resultCount))
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose, resultCount])

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = overflow
    }
  }, [open])

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" })
  }, [safeCursor, resultCount])

  if (!mounted) return null

  /** First row of each section carries the section heading. */
  const startsSection = (index: number) =>
    index === 0 || results[index - 1].section !== results[index].section

  const go = (result: Result) => {
    router.push(result.href)
    onClose()
    setQuery("")
    setCursor(0)
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-350 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
            className="absolute inset-0 bg-admin-overlay"
          />

          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="relative w-full max-w-lg bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-3 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-3.5 h-12 border-b border-admin-border">
              <Search size={16} className="text-admin-subtle shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setCursor(0)
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && results[safeCursor]) {
                    e.preventDefault()
                    go(results[safeCursor])
                  }
                }}
                placeholder="Search leads, team, pages…"
                className="flex-1 bg-transparent outline-none text-admin-base text-admin-text placeholder:text-admin-subtle"
              />
              <kbd className="hidden sm:inline-block text-admin-2xs text-admin-subtle border border-admin-border rounded px-1.5 py-0.5">
                Esc
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto custom-scrollbar py-1.5">
              {results.length === 0 && (
                <p className="px-4 py-8 text-center text-admin-sm text-admin-muted">
                  No matches for “{query}”
                </p>
              )}

              {results.map((result, index) => {
                const showSection = startsSection(index)
                const isActive = index === safeCursor
                return (
                  <React.Fragment key={result.id}>
                    {showSection && (
                      <p className="px-3.5 pt-2.5 pb-1 text-admin-2xs font-semibold uppercase tracking-wider text-admin-subtle">
                        {result.section}
                      </p>
                    )}
                    <button
                      data-active={isActive}
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => go(result)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3.5 h-10 text-left transition-colors",
                        isActive ? "bg-admin-surface-2" : "hover:bg-admin-surface-2"
                      )}
                    >
                      <result.icon size={15} className="text-admin-subtle shrink-0" />
                      <span className="text-admin-sm text-admin-text truncate">{result.label}</span>
                      {result.hint && (
                        <span className="text-admin-xs text-admin-subtle truncate ml-1">
                          {result.hint}
                        </span>
                      )}
                      {isActive ? (
                        <CornerDownLeft size={13} className="ml-auto text-admin-subtle shrink-0" />
                      ) : (
                        <ArrowRight size={13} className="ml-auto text-transparent shrink-0" />
                      )}
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
