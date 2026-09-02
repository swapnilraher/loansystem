"use client"

/**
 * Shared furniture for the 8-step partner onboarding wizard.
 *
 * Every step in `app/onboarding` repeats the same four things: a title block, a
 * grid of fields, a validation message, and a Back / Continue pair. They were
 * hand-written eight times over, which is why the spacing, the button sizes and
 * the error styling had drifted apart between steps. These are the one copy.
 *
 * Everything reads the admin token layer in `app/globals.css` — same tokens as
 * the CRM, no palette of its own.
 */

import React from "react"
import { ArrowLeft, ArrowRight, Check, Eye, FileText, Upload } from "lucide-react"
import { AdminButton } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

/**
 * One reserved line for a validation message, so the message appears in space
 * that already existed instead of shoving the rest of the form down as you
 * type.
 *
 * `1.5em` rather than a rem figure: `--text-admin-xs` carries line-height 1.5
 * and `em` resolves against this element's own font-size, so the reserved box
 * matches the rendered line exactly. A rem value is measured against the root,
 * which ramps 15px -> 17.5px across breakpoints and leaves the box short.
 */
export const ERROR_SLOT = "block min-h-[1.5em] text-admin-xs text-tone-danger-fg"

/** Title + one line of explanation, at the top of every step. */
export function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-admin-xl font-semibold tracking-tight text-admin-text">{title}</h2>
      <p className="text-admin-sm text-admin-muted mt-1">{description}</p>
    </div>
  )
}

/** The standard two-column field grid. `wide` children span both columns. */
export function FieldGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>{children}</div>
}

/**
 * Back / Continue footer.
 *
 * Sticky to the bottom of the viewport on phones so the primary action stays
 * reachable with the on-screen keyboard up — this form is eight steps long and
 * is filled almost entirely on mobile. From `sm` up it settles into a normal
 * static row, because on a desktop a floating bar just eats content height.
 */
export function StepNav({
  onBack,
  submitLabel = "Save & continue",
  loading,
  disabled,
  onSubmit,
  onSkip,
  skipLabel = "Skip to next step",
  isStepCompleted,
}: {
  onBack?: () => void
  submitLabel?: string
  loading?: boolean
  disabled?: boolean
  /** Omit for a `type="submit"` button inside a <form>. */
  onSubmit?: () => void
  onSkip?: () => void
  skipLabel?: string
  isStepCompleted?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 mt-6 pt-4 border-t border-admin-border",
        "sticky bottom-0 -mx-4 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-admin-surface",
        "sm:static sm:mx-0 sm:px-0 sm:pb-0 sm:bg-transparent"
      )}
    >
      {onBack ? (
        <AdminButton type="button" variant="secondary" icon={ArrowLeft} onClick={onBack}>
          Back
        </AdminButton>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2.5">
        {onSkip && isStepCompleted && (
          <AdminButton
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="text-admin-muted hover:text-admin-text text-admin-xs font-semibold"
          >
            {skipLabel}
          </AdminButton>
        )}
        <AdminButton
          type={onSubmit ? "button" : "submit"}
          variant="primary"
          loading={loading}
          disabled={disabled}
          onClick={onSubmit}
        >
          {submitLabel}
          {!loading && <ArrowRight size={15} />}
        </AdminButton>
      </div>
    </div>
  )
}

/**
 * Segmented single-choice control — entity type, firm type, GST yes/no.
 *
 * `role="radiogroup"` rather than a row of plain buttons: these are one choice
 * out of N, and a screen reader otherwise announces them as unrelated buttons
 * with no indication that picking one clears the others.
 */
export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 2,
  icons,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (next: T) => void
  columns?: 2 | 3
  /* Keyed by string rather than `T`: indexing a generic mapped type here gives
     TS a union it cannot narrow back to a single component. */
  icons?: Record<string, React.ComponentType<{ size?: number }>>
}) {
  return (
    <div className="space-y-1.5">
      <span
        id={`choice-${label.replace(/\W+/g, "-").toLowerCase()}`}
        className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle"
      >
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`choice-${label.replace(/\W+/g, "-").toLowerCase()}`}
        className={cn("grid gap-2", columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2")}
      >
        {options.map(opt => {
          const active = value === opt
          const Icon = icons?.[opt]
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt)}
              className={cn(
                "admin-focus flex items-center justify-center gap-2 h-11 sm:h-10 px-3 rounded-admin-sm border text-admin-sm font-semibold transition-all",
                active
                  ? "bg-admin-accent-soft text-admin-accent border-admin-accent shadow-xs"
                  : "bg-admin-surface text-admin-muted border-admin-border hover:bg-admin-surface-2 hover:text-admin-text"
              )}
            >
              {Icon && <Icon size={16} />}
              <span>{opt}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Step 6 document row with status pills and upload triggers. */
export function DocRow({
  label,
  description,
  uploaded,
  fileName,
  verified,
  onUpload,
  onView,
  uploading,
}: {
  label: string
  description: string
  uploaded: boolean
  fileName?: string
  verified?: boolean
  onUpload: () => void
  onView?: () => void
  uploading?: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-admin-surface border border-admin-border rounded-admin">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-admin-sm font-semibold text-admin-text">{label}</span>
          {verified ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tone-success text-tone-success-fg border border-tone-success-bd text-admin-2xs font-semibold">
              <Check size={11} /> Verified
            </span>
          ) : uploaded ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-admin-accent-soft text-admin-accent border border-admin-border text-admin-2xs font-semibold">
              Uploaded
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tone-warn text-tone-warn-fg border border-tone-warn-bd text-admin-2xs font-semibold">
              Pending
            </span>
          )}
        </div>
        <p className="text-admin-xs text-admin-muted truncate">{fileName || description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {uploaded && onView && (
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            icon={Eye}
            onClick={onView}
            aria-label={`View ${label}`}
          >
            View
          </AdminButton>
        )}
        <AdminButton
          type="button"
          variant={uploaded ? "ghost" : "primary"}
          size="sm"
          icon={Upload}
          onClick={onUpload}
          loading={uploading}
          disabled={uploading}
        >
          {uploaded ? "Re-upload" : "Upload"}
        </AdminButton>
      </div>
    </div>
  )
}

/** Step 8 review row: index pill + label + children + right-aligned edit button. */
export function ReviewRow({
  index,
  label,
  onEdit,
  children,
}: {
  index: number
  label: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-3.5 bg-admin-surface border border-admin-border rounded-admin">
      <div className="flex items-start gap-3 min-w-0">
        <span className="shrink-0 w-6 h-6 rounded-full bg-admin-accent-soft text-admin-accent border border-admin-border text-admin-2xs font-semibold admin-num flex items-center justify-center">
          {index}
        </span>
        <div className="space-y-0.5 min-w-0">
          <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">
            {label}
          </span>
          <div className="space-y-0.5">{children}</div>
        </div>
      </div>
      <AdminButton
        type="button"
        variant="ghost"
        size="sm"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        className="shrink-0"
      >
        Edit
      </AdminButton>
    </div>
  )
}

/** Progress header: step count, percentage, bar, and jump pills with green ticks. */
export function Stepper({
  titles,
  current,
  completedSteps = [],
  maxReachableStep,
  onJump,
}: {
  titles: readonly string[]
  current: number
  completedSteps?: number[]
  maxReachableStep?: number
  onJump: (step: number) => void
}) {
  const completedCount = completedSteps.length
  const pct = Math.round((Math.max(current, completedCount) / titles.length) * 100)
  
  return (
    <div className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 p-3.5 sm:p-4 transition-all">
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-admin-xs font-bold text-admin-text">
            Step {current} of {titles.length}
            <span className="text-admin-muted font-normal"> · {titles[current - 1]}</span>
          </span>
          {completedSteps.includes(current) && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Check size={11} strokeWidth={3} /> Completed
            </span>
          )}
        </div>
        <span className="text-admin-2xs font-bold text-admin-subtle admin-num shrink-0">
          {completedCount}/{titles.length} Done ({pct}%)
        </span>
      </div>

      <div
        className="w-full h-1.5 sm:h-2 rounded-full bg-admin-surface-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Onboarding progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-admin-accent transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 8-step Navigation Grid with Green Checkmarks on Completed Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 mt-3.5 pt-3 border-t border-admin-border">
        {titles.map((title, idx) => {
          const step = idx + 1
          const isDone = completedSteps.includes(step)
          const isNow = current === step
          const isPast = current > step
          // Can jump if already completed, or is current, or is past, or is next reachable step
          const canJump =
            isDone ||
            isPast ||
            isNow ||
            (maxReachableStep ? step <= maxReachableStep : false) ||
            Array.from({ length: step - 1 }, (_, i) => i + 1).every(s => completedSteps.includes(s))

          return (
            <button
              key={title}
              type="button"
              onClick={() => canJump && onJump(step)}
              disabled={!canJump}
              title={
                isDone
                  ? `Step ${step}: ${title} (Completed - Click to jump)`
                  : canJump
                    ? `Step ${step}: ${title} (Click to open)`
                    : `Step ${step}: ${title} (Please complete earlier steps first)`
              }
              aria-current={isNow ? "step" : undefined}
              className={cn(
                "admin-focus text-left p-2 rounded-admin-sm text-admin-2xs font-semibold transition-all relative select-none group",
                isNow &&
                  "bg-admin-accent-soft text-admin-accent border border-admin-accent/40 shadow-xs ring-1 ring-admin-accent/20",
                !isNow &&
                  isDone &&
                  "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer",
                !isNow &&
                  !isDone &&
                  canJump &&
                  "text-admin-text hover:bg-admin-surface-2 border border-admin-border/70 cursor-pointer",
                !isNow &&
                  !isDone &&
                  !canJump &&
                  "text-admin-subtle opacity-40 border border-transparent cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span
                  className={cn(
                    "text-[10px] tracking-wide uppercase font-bold",
                    isNow
                      ? "text-admin-accent"
                      : isDone
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-admin-subtle"
                  )}
                >
                  Step {step}
                </span>
                {isDone ? (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white shrink-0 shadow-xs">
                    <Check size={10} strokeWidth={3.5} />
                  </span>
                ) : isNow ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-admin-accent animate-pulse" />
                ) : null}
              </div>
              <span className="block truncate text-admin-xs leading-tight font-medium">
                {title}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
