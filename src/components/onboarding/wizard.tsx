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
  loading = false,
  disabled = false,
  onSubmit,
}: {
  onBack?: () => void
  submitLabel?: string
  loading?: boolean
  disabled?: boolean
  /** Omit for a `type="submit"` button inside a <form>. */
  onSubmit?: () => void
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
                "admin-focus inline-flex items-center justify-center gap-2 min-h-11 px-3 rounded-admin-sm border text-admin-sm font-semibold transition-colors",
                active
                  ? "bg-admin-accent-soft border-admin-accent text-admin-accent"
                  : "bg-admin-surface-2 border-admin-border text-admin-muted hover:text-admin-text hover:border-admin-border-strong"
              )}
            >
              {Icon && <Icon size={15} />}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export type DocMeta = { fileName: string; sizeBytes: number; uploadedAt: string; fileUrl?: string }

/** One KYC document: an empty dropzone, or the uploaded file with its actions. */
export function DocSlot({
  label,
  doc,
  onPick,
  onRemove,
}: {
  label: string
  doc: DocMeta | null
  onPick: () => void
  onRemove: () => void
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">
        {label}
      </span>
      {doc ? (
        <div className="p-3 bg-admin-surface border border-admin-border rounded-admin-sm space-y-2">
          <p className="flex items-center gap-2 text-admin-sm text-admin-text">
            <FileText size={15} className="shrink-0 text-admin-accent" />
            <span className="truncate">{doc.fileName}</span>
          </p>
          <div className="flex items-center gap-1 pt-1 border-t border-admin-border">
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-focus inline-flex items-center gap-1 min-h-11 sm:min-h-8 px-2 rounded-admin-sm text-admin-xs font-semibold text-admin-accent hover:underline"
              >
                <Eye size={13} /> View
              </a>
            )}
            <button
              type="button"
              onClick={onPick}
              className="admin-focus inline-flex items-center min-h-11 sm:min-h-8 px-2 rounded-admin-sm text-admin-xs font-semibold text-admin-muted hover:text-admin-text"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="admin-focus inline-flex items-center min-h-11 sm:min-h-8 px-2 rounded-admin-sm text-admin-xs font-semibold text-tone-danger-fg hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className="admin-focus w-full min-h-11 py-6 px-3 border border-dashed border-admin-border-strong rounded-admin-sm flex flex-col items-center justify-center gap-1.5 text-admin-muted hover:border-admin-accent hover:bg-admin-accent-soft transition-colors"
        >
          <Upload size={20} className="text-admin-accent" />
          <span className="text-admin-sm font-semibold text-admin-text">Upload {label}</span>
          <span className="text-admin-2xs text-admin-subtle">Image or PDF</span>
        </button>
      )}
    </div>
  )
}

/** Small status pill used beside a document group heading. */
export function DocStatus({ state }: { state: "complete" | "partial" | "missing" }) {
  const MAP = {
    complete: { cls: "bg-tone-success text-tone-success-fg border-tone-success-bd", text: "Complete" },
    partial: { cls: "bg-tone-warn text-tone-warn-fg border-tone-warn-bd", text: "Back pending" },
    missing: { cls: "bg-tone-danger text-tone-danger-fg border-tone-danger-bd", text: "Required" },
  } as const
  const it = MAP[state]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-admin-2xs font-semibold",
        it.cls
      )}
    >
      {state === "complete" && <Check size={11} />}
      {it.text}
    </span>
  )
}

/** One reviewed section on the final step, with a jump-back control. */
export function ReviewRow({
  index,
  label,
  children,
  onEdit,
}: {
  index: number
  label: string
  children: React.ReactNode
  onEdit: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-3.5 bg-admin-surface-2 border border-admin-border rounded-admin">
      <div className="min-w-0 space-y-0.5">
        <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">
          {index}. {label}
        </span>
        {children}
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

/** Progress header: step count, percentage, bar, and jump-back pills. */
export function Stepper({
  titles,
  current,
  onJump,
}: {
  titles: readonly string[]
  current: number
  onJump: (step: number) => void
}) {
  const pct = Math.round((current / titles.length) * 100)
  return (
    <div className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 p-4">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-admin-xs font-semibold text-admin-text">
          Step {current} of {titles.length}
          <span className="text-admin-muted font-normal"> · {titles[current - 1]}</span>
        </span>
        <span className="text-admin-2xs text-admin-subtle admin-num">{pct}%</span>
      </div>

      <div
        className="w-full h-1.5 rounded-full bg-admin-surface-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Onboarding progress"
      >
        <div
          className="h-full rounded-full bg-admin-accent transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Completed steps stay reachable; future ones are not yet valid to open. */}
      <div className="hidden sm:grid grid-cols-8 gap-1 mt-3 pt-3 border-t border-admin-border">
        {titles.map((title, idx) => {
          const step = idx + 1
          const past = current > step
          const now = current === step
          return (
            <button
              key={title}
              type="button"
              onClick={() => past && onJump(step)}
              disabled={!past}
              aria-current={now ? "step" : undefined}
              className={cn(
                "admin-focus text-left p-1.5 rounded-admin-sm text-admin-2xs font-semibold truncate transition-colors",
                now && "bg-admin-accent-soft text-admin-accent",
                past && "text-admin-muted hover:bg-admin-surface-2 hover:text-admin-text",
                !past && !now && "text-admin-subtle opacity-50 cursor-not-allowed"
              )}
            >
              <span className="block text-admin-2xs text-admin-subtle">Step {step}</span>
              <span className="block truncate">{title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
