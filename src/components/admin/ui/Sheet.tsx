"use client"

import React, { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { lockScroll } from "@/lib/scrollLock"
import { useIsClient } from "./useIsClient"

type SheetSide = "right" | "center"
type SheetSize = "sm" | "md" | "lg" | "xl"

/** Open sheets, innermost last — used so Escape only closes the top one. */
const ESCAPE_STACK: object[] = []

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const WIDTHS: Record<SheetSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
}

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  /** `right` = side panel for record detail. `center` = modal for confirmations. */
  side?: SheetSide
  size?: SheetSize
  footer?: React.ReactNode
  children: React.ReactNode
  /** Set false for destructive confirmations that must be answered. */
  dismissOnBackdrop?: boolean
  /** Set false when the body owns its own layout, e.g. a chat pane. */
  padded?: boolean
  className?: string
}

/**
 * The single overlay primitive for the CRM — replaces the hand-rolled modals
 * spread across the admin pages. Portals to body so it escapes the sidebar and
 * bottom-nav stacking contexts, locks body scroll, closes on Escape, and
 * returns focus to whatever opened it.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  side = "right",
  size = "md",
  footer,
  children,
  dismissOnBackdrop = true,
  padded = true,
  className,
}: SheetProps) {
  const mounted = useIsClient()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusTo = useRef<HTMLElement | null>(null)
  const titleId = useId()

  /**
   * Callers pass a fresh inline arrow every render (`onClose={() => setX(null)}`).
   * Depending on it directly re-ran the whole open effect on every parent
   * render — and the leads screen re-renders on every Firestore snapshot and
   * every clock tick — which yanked focus back to the panel mid-typing. Keep it
   * in a ref so the effect only ever depends on `open`.
   */
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    restoreFocusTo.current = document.activeElement as HTMLElement | null
    const release = lockScroll()

    // Only the topmost sheet reacts to Escape, so dismissing a status picker
    // opened from the detail sheet no longer closes both at once.
    const token = {}
    ESCAPE_STACK.push(token)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (ESCAPE_STACK[ESCAPE_STACK.length - 1] !== token) return
        event.stopPropagation()
        onCloseRef.current()
        return
      }

      if (event.key !== "Tab") return
      // Focus trap: without it, Tab walks straight into the page behind an
      // overlay that claims aria-modal.
      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter(el => el.offsetParent !== null || el === panel)
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeEl = document.activeElement
      if (!event.shiftKey && activeEl === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && (activeEl === first || activeEl === panel)) {
        event.preventDefault()
        last.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)

    // Move focus into the panel so Escape and Tab behave for keyboard users.
    const raf = requestAnimationFrame(() => panelRef.current?.focus())

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      cancelAnimationFrame(raf)
      const index = ESCAPE_STACK.indexOf(token)
      if (index !== -1) ESCAPE_STACK.splice(index, 1)
      release()
      restoreFocusTo.current?.focus?.()
    }
  }, [open])

  if (!mounted) return null

  const isSide = side === "right"

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-300 flex" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={dismissOnBackdrop ? onClose : undefined}
            className="absolute inset-0 bg-admin-overlay"
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={isSide ? { x: "100%" } : { opacity: 0, scale: 0.97, y: 8 }}
            animate={isSide ? { x: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isSide ? { x: "100%" } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className={cn(
              "relative bg-admin-surface shadow-admin-3 flex flex-col outline-none w-full",
              isSide
                ? cn("ml-auto h-full sm:border-l border-admin-border", WIDTHS[size])
                : // On a phone a centre sheet used to sit flush against every
                  // screen edge, so its rounded corners and border were cropped.
                  // Inset it and keep clear of the home indicator.
                  cn(
                    "m-auto mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] max-h-[85dvh]",
                    "rounded-admin-lg border border-admin-border sm:mx-auto sm:mb-auto",
                    WIDTHS[size]
                  ),
              className
            )}
          >
            {(title || description) && (
              <div className="flex items-start gap-4 px-5 py-4 border-b border-admin-border shrink-0">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 id={titleId} className="text-admin-lg font-semibold text-admin-text truncate">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-admin-sm text-admin-muted mt-0.5">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="admin-touch admin-focus shrink-0 -mr-1 p-1.5 rounded-admin-sm text-admin-subtle hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div
              className={cn(
                "flex-1 min-h-0 overscroll-contain text-admin-base text-admin-text",
                padded ? "overflow-y-auto px-5 py-4" : "flex flex-col"
              )}
            >
              {children}
            </div>

            {footer && (
              <div className="px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-3.5 border-t border-admin-border bg-admin-surface-2 flex items-center justify-end gap-2 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
