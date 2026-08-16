"use client"

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tone, TONE_CLASSES } from "./status"
import { useIsClient } from "./useIsClient"

export interface ToastInput {
  title: string
  description?: string
  tone?: Extract<Tone, "info" | "success" | "warn" | "danger" | "neutral">
  /** ms on screen. 0 keeps it until dismissed. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

interface ToastRecord extends ToastInput {
  id: string
}

interface ToastApi {
  push: (toast: ToastInput) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  danger: XCircle,
  neutral: Info,
} as const

/**
 * App-wide toast stack. Mount once in the admin layout; call `useToast().push()`
 * from anywhere below it. Separate from the FCM push toast in the layout, which
 * is a richer notification card with its own routing actions.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const mounted = useIsClient()
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const seq = useRef(0)

  React.useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback(
    (toast: ToastInput) => {
      seq.current += 1
      const id = `toast-${seq.current}`
      // Cap the stack: five toasts is already more than anyone reads.
      setToasts(prev => [...prev.slice(-4), { ...toast, id }])

      const duration = toast.duration ?? 5000
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        )
      }
      return id
    },
    [dismiss]
  )

  const api = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-400 flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-80 pointer-events-none"
          >
            <AnimatePresence initial={false}>
              {toasts.map(toast => {
                const tone = toast.tone ?? "neutral"
                const Icon = ICONS[tone]
                return (
                  <motion.div
                    key={toast.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="pointer-events-auto bg-admin-surface border border-admin-border rounded-admin shadow-admin-3 p-3 flex items-start gap-2.5"
                  >
                    <span className={cn("shrink-0 mt-0.5", TONE_CLASSES[tone].text)}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-admin-sm font-semibold text-admin-text">{toast.title}</p>
                      {toast.description && (
                        <p className="text-admin-xs text-admin-muted mt-0.5">{toast.description}</p>
                      )}
                      {toast.action && (
                        <button
                          onClick={() => {
                            toast.action?.onClick()
                            dismiss(toast.id)
                          }}
                          className="admin-focus mt-2 text-admin-xs font-semibold text-admin-accent hover:underline"
                        >
                          {toast.action.label}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => dismiss(toast.id)}
                      aria-label="Dismiss"
                      className="admin-focus shrink-0 p-0.5 rounded text-admin-subtle hover:text-admin-text transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider> (mounted in the admin layout)")
  return ctx
}
