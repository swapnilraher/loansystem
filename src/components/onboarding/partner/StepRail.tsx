"use client"

/**
 * The progress indicator, in its two shapes.
 *
 * `StepRail` is the desktop sidebar: a vertical spine with a tick per finished
 * step, so a partner can see the whole journey and how much of it is left
 * without scrolling the form.
 *
 * `MobileStepBar` and `MobileStepSheet` are the phone equivalent. There is no
 * room for eight rows above the fold, so the bar shows position and percentage
 * only, and the full list is one tap away. Both read the same `stepDone` map
 * that gates navigation, so the rail can never claim a step is finished when
 * the wizard would refuse to let you leave it.
 */

import React, { useEffect } from "react"
import { Check, ChevronDown, Lock, X } from "lucide-react"

import { PARTNER_ONBOARDING_STEPS, type PartnerStepId } from "@/lib/onboarding-steps"
import { lockScroll } from "@/lib/scrollLock"
import { cn } from "@/lib/utils"

interface RailProps {
  current: PartnerStepId
  stepDone: Record<PartnerStepId, boolean>
  lockReason: (id: PartnerStepId) => string | null
  onJump: (id: PartnerStepId) => void
}

const TOTAL = PARTNER_ONBOARDING_STEPS.length

function percent(stepDone: Record<PartnerStepId, boolean>): number {
  const done = PARTNER_ONBOARDING_STEPS.filter(s => stepDone[s.id as PartnerStepId]).length
  return Math.round((done / TOTAL) * 100)
}

/* ─── Desktop spine ──────────────────────────────────────────────────────── */

export function StepRail({ current, stepDone, lockReason, onJump }: RailProps) {
  const pct = percent(stepDone)

  return (
    <nav aria-label="Onboarding steps" className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-admin-2xs font-bold uppercase tracking-widest text-admin-subtle">Your progress</span>
          <span className="admin-num text-admin-2xs font-bold text-admin-text">{pct}%</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-admin-surface-3"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        >
          <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ol className="relative space-y-0.5">
        {PARTNER_ONBOARDING_STEPS.map((s, index) => {
          const id = s.id as PartnerStepId
          const done = stepDone[id]
          const active = current === id
          const locked = Boolean(lockReason(id))
          const last = index === TOTAL - 1

          return (
            <li key={s.key} className="relative">
              {/*
                The spine. Drawn behind the markers rather than as a border on
                them, so a tick can sit on top of it without a gap.
              */}
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[15px] top-9 h-[calc(100%-1.25rem)] w-px",
                    done ? "bg-tone-success-bd" : "bg-admin-border"
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => !locked && onJump(id)}
                disabled={locked}
                title={lockReason(id) ?? undefined}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "admin-focus relative flex w-full items-start gap-3 rounded-admin px-2 py-2 text-left transition-colors",
                  active ? "bg-brand-soft" : "hover:bg-admin-surface-2",
                  locked && "cursor-not-allowed opacity-55 hover:bg-transparent"
                )}
              >
                <span
                  className={cn(
                    "admin-num relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-admin-xs font-bold transition-colors",
                    done
                      ? "border-tone-success-bd bg-tone-success text-tone-success-fg"
                      : active
                        ? "border-brand bg-brand text-brand-fg shadow-admin-1"
                        : "border-admin-border bg-admin-surface text-admin-subtle"
                  )}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : locked ? <Lock size={12} /> : id}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span
                    className={cn(
                      "block truncate text-admin-xs font-bold leading-tight",
                      active ? "text-brand-soft-fg" : done ? "text-admin-text" : "text-admin-muted"
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="block truncate text-admin-2xs text-admin-subtle">{s.description}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ─── Phone bar ──────────────────────────────────────────────────────────── */

export function MobileStepBar({
  current,
  stepDone,
  onOpen,
}: {
  current: PartnerStepId
  stepDone: Record<PartnerStepId, boolean>
  onOpen: () => void
}) {
  const pct = percent(stepDone)
  const title = PARTNER_ONBOARDING_STEPS[current - 1]?.title ?? "Onboarding"

  return (
    <div className="border-b border-admin-border bg-admin-surface px-4 py-2 lg:hidden">
      <button
        type="button"
        onClick={onOpen}
        className="admin-focus flex w-full items-center justify-between gap-3 rounded-admin-sm py-1 text-left"
        aria-label={`Step ${current} of ${TOTAL}: ${title}. Open the full step list.`}
      >
        <span className="min-w-0">
          <span className="admin-num block text-admin-2xs font-bold uppercase tracking-widest text-admin-subtle">
            Step {current} of {TOTAL}
          </span>
          <span className="flex items-center gap-1.5 text-admin-sm font-black tracking-tight text-admin-text">
            <span className="truncate">{title}</span>
            <ChevronDown size={15} className="shrink-0 text-admin-subtle" />
          </span>
        </span>
        <span className="admin-num shrink-0 text-admin-xs font-bold text-brand">{pct}%</span>
      </button>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-admin-surface-3">
        <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function MobileStepSheet({
  open,
  onClose,
  current,
  stepDone,
  lockReason,
  onJump,
}: RailProps & { open: boolean; onClose: () => void }) {
  // The sheet covers the viewport, so the form behind it must not keep
  // scrolling under the thumb while the list is open.
  useEffect(() => {
    if (!open) return
    const release = lockScroll()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      release()
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-admin-surface lg:hidden" role="dialog" aria-modal="true" aria-label="Onboarding steps">
      <header className="flex items-center justify-between gap-3 border-b border-admin-border px-4 py-3">
        <div>
          <h2 className="text-admin-lg font-black tracking-tight text-admin-text">Partner onboarding</h2>
          <p className="admin-num text-admin-2xs font-semibold text-admin-subtle">
            {PARTNER_ONBOARDING_STEPS.filter(s => stepDone[s.id as PartnerStepId]).length} of {TOTAL} steps complete
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close step list"
          className="admin-focus flex h-11 w-11 items-center justify-center rounded-full text-admin-muted hover:bg-admin-surface-2"
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        <StepRail current={current} stepDone={stepDone} lockReason={lockReason} onJump={id => {
          onJump(id)
          onClose()
        }} />
      </div>

      <footer className="border-t border-admin-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onClose}
          className="admin-focus h-12 w-full rounded-admin bg-brand text-admin-sm font-bold text-brand-fg shadow-admin-2 hover:bg-brand-hover active:scale-[0.99]"
        >
          Back to step {current}
        </button>
      </footer>
    </div>
  )
}
