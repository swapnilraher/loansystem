"use client"

/**
 * The furniture every step of the wizard is built from.
 *
 * All eight steps repeat the same four things: a title block, a grid of
 * labelled fields, a verification affordance, and a Back / Continue pair. They
 * live here so a step file is only ever the fields it owns, and so the eight
 * screens cannot drift apart visually.
 *
 * Everything reads the admin token layer plus the partner brand tokens in
 * app/globals.css — no palette of its own, no raw hex.
 */

import React, { useId, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Paperclip,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react"

import { validateDocFile } from "@/components/onboarding/ImageCropModal"
import { cn } from "@/lib/utils"

/* ─── Layout ─────────────────────────────────────────────────────────────── */

/** Title + one line of explanation, at the top of every step. */
export function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <header className="space-y-1">
      {eyebrow && (
        <span className="block text-admin-2xs font-bold uppercase tracking-widest text-brand">{eyebrow}</span>
      )}
      <h2 className="text-xl sm:text-admin-2xl font-black tracking-tight text-admin-text">{title}</h2>
      <p className="text-admin-xs sm:text-admin-sm text-admin-muted">{description}</p>
    </header>
  )
}

/** A titled group of related fields inside a step. */
export function Section({
  title,
  hint,
  children,
  action,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-admin-lg border border-admin-border bg-admin-surface p-4 sm:p-5 space-y-4 shadow-admin-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-admin-sm font-bold text-admin-text">{title}</h3>
          {hint && <p className="text-admin-xs text-admin-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** The standard two-column field grid. `<Full>` children span both columns. */
export function FieldGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3", className)}>{children}</div>
}

export function Full({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>
}

/* ─── Fields ─────────────────────────────────────────────────────────────── */

const CONTROL =
  "admin-focus w-full rounded-admin border border-admin-border-strong bg-admin-surface px-3.5 text-admin-sm font-medium text-admin-text placeholder:text-admin-subtle transition-colors focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed read-only:bg-admin-surface-2"

interface FieldProps {
  id: string
  label: string
  hint?: string
  required?: boolean
  optional?: boolean
  error?: string | null
  /** Rendered against the right edge of the label row — a Verify button, say. */
  aside?: React.ReactNode
  children: React.ReactNode
}

/**
 * Label, control, and a message slot that is always present.
 *
 * The slot has a minimum height whether or not there is anything in it: a
 * message that appears in a collapsed region pushes every field below it down
 * by its own height, which on a form this long means the control the partner
 * just tapped moves out from under their thumb at the moment they are told
 * something is wrong.
 */
export function Field({ id, label, hint, required, optional, error, aside, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={id} className="block text-admin-2xs font-bold uppercase tracking-wide text-admin-subtle">
          {label}
          {required && <span className="text-tone-danger-fg"> *</span>}
          {optional && <span className="font-semibold normal-case tracking-normal text-admin-subtle"> (optional)</span>}
        </label>
        {aside}
      </div>
      {children}
      <div className="min-h-4">
        {error ? (
          <span role="alert" className="block text-admin-2xs font-semibold text-tone-danger-fg">
            {error}
          </span>
        ) : hint ? (
          <span className="block text-admin-2xs text-admin-subtle">{hint}</span>
        ) : null}
      </div>
    </div>
  )
}

export function TextInput({
  invalid,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, "h-11", invalid && "border-tone-danger-bd", className)}
    />
  )
}

export function SelectInput({
  invalid,
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...rest}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, "h-11 cursor-pointer pr-9", invalid && "border-tone-danger-bd", className)}
    >
      {children}
    </select>
  )
}

/** A control with a fixed prefix, for +91 and the like. */
export function PrefixedInput({
  prefix,
  invalid,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { prefix: string; invalid?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-11 overflow-hidden rounded-admin border border-admin-border-strong bg-admin-surface transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-ring",
        invalid && "border-tone-danger-bd"
      )}
    >
      <span className="flex select-none items-center border-r border-admin-border-strong bg-admin-surface-2 px-3.5 text-admin-xs font-bold text-admin-text">
        {prefix}
      </span>
      <input
        {...rest}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full bg-transparent px-3.5 text-admin-sm font-medium text-admin-text placeholder:text-admin-subtle focus:outline-none",
          className
        )}
      />
    </div>
  )
}

/** Segmented single-choice control — entity type, GST yes/no, account type. */
export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 2,
  descriptions,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (next: T) => void
  columns?: 2 | 3 | 5
  descriptions?: Partial<Record<T, string>>
}) {
  const labelId = useId()
  return (
    <div className="space-y-1.5">
      <span id={labelId} className="block text-admin-2xs font-bold uppercase tracking-wide text-admin-subtle">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={cn(
          "grid gap-2",
          columns === 5 ? "grid-cols-2 sm:grid-cols-5" : columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"
        )}
      >
        {options.map(option => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option)}
              className={cn(
                "admin-focus flex min-h-11 flex-col items-start justify-center gap-0.5 rounded-admin border px-3 py-2 text-left transition-all",
                active
                  ? "border-brand bg-brand-soft text-brand-soft-fg shadow-admin-1 ring-1 ring-brand-ring"
                  : "border-admin-border bg-admin-surface text-admin-muted hover:border-admin-border-strong hover:bg-admin-surface-2"
              )}
            >
              <span className="flex w-full items-center justify-between gap-2 text-admin-sm font-bold">
                <span className="truncate">{option}</span>
                {active && <Check size={14} className="shrink-0" />}
              </span>
              {descriptions?.[option] && (
                <span className="text-admin-2xs font-medium opacity-80">{descriptions[option]}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A declaration or preference the partner ticks. */
export function CheckRow({
  id,
  checked,
  onChange,
  children,
}: {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-admin border p-3.5 transition-colors",
        checked ? "border-brand bg-brand-soft" : "border-admin-border bg-admin-surface hover:bg-admin-surface-2"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="admin-focus mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]"
      />
      <span className={cn("text-admin-xs leading-relaxed", checked ? "text-brand-soft-fg" : "text-admin-muted")}>
        {children}
      </span>
    </label>
  )
}

/* ─── Feedback ───────────────────────────────────────────────────────────── */

type Tone = "info" | "success" | "warn" | "danger"

const TONE: Record<Tone, { box: string; Icon: typeof Info }> = {
  info: { box: "border-tone-info-bd bg-tone-info text-tone-info-fg", Icon: Info },
  success: { box: "border-tone-success-bd bg-tone-success text-tone-success-fg", Icon: CheckCircle2 },
  warn: { box: "border-tone-warn-bd bg-tone-warn text-tone-warn-fg", Icon: AlertTriangle },
  danger: { box: "border-tone-danger-bd bg-tone-danger text-tone-danger-fg", Icon: AlertCircle },
}

export function Callout({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: Tone
  title?: string
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  const { box, Icon } = TONE[tone]
  return (
    <div className={cn("flex items-start gap-2.5 rounded-admin border px-3.5 py-3 text-admin-xs", box)}>
      <Icon size={15} className="mt-px shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <div className="font-bold">{title}</div>}
        {children && <div className="leading-relaxed">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  )
}

/** "Verified" / "Not verified yet" pill next to a field that can be checked. */
export function VerifyPill({ state, label }: { state: "verified" | "pending" | "failed"; label?: string }) {
  const look = {
    verified: { box: "bg-tone-success text-tone-success-fg border-tone-success-bd", text: label || "Verified", Icon: Check },
    pending: { box: "bg-admin-surface-2 text-admin-subtle border-admin-border", text: label || "Not verified", Icon: Info },
    failed: { box: "bg-tone-danger text-tone-danger-fg border-tone-danger-bd", text: label || "Check failed", Icon: AlertCircle },
  }[state]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-admin-2xs font-bold",
        look.box
      )}
    >
      <look.Icon size={11} strokeWidth={3} />
      {look.text}
    </span>
  )
}

/** The small inline button that triggers a verification next to a field. */
export function InlineAction({
  onClick,
  loading,
  disabled,
  children,
}: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="admin-focus inline-flex h-6 items-center gap-1 rounded-admin-sm px-2 text-admin-2xs font-bold text-brand transition-colors hover:bg-brand-soft disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {loading && <Loader2 size={11} className="animate-spin" />}
      {children}
    </button>
  )
}

/* ─── Navigation ─────────────────────────────────────────────────────────── */

/**
 * Back / Continue footer.
 *
 * Sticky to the bottom of the viewport on phones so the primary action stays
 * reachable with the on-screen keyboard up, static from `sm` where the whole
 * step fits on screen anyway.
 */
export function StepNav({
  onBack,
  onContinue,
  continueLabel = "Continue",
  loading,
  disabled,
  secondary,
}: {
  onBack?: () => void
  onContinue: () => void
  continueLabel?: string
  loading?: boolean
  disabled?: boolean
  secondary?: React.ReactNode
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-3.5 sm:mx-0 pt-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#f8fafc]/90 backdrop-blur-md">
      <div className="flex flex-col gap-2">
        {secondary}
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled || loading}
          className="w-full h-12 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          <span>{continueLabel}</span>
        </button>
      </div>
    </div>
  )
}

/* ─── Documents ──────────────────────────────────────────────────────────── */

export function formatBytes(bytes?: number): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * One document slot: idle, uploading, uploaded, or failed.
 *
 * A failure keeps the tile in place with a Retry rather than reverting to the
 * empty state — reverting reads as "nothing happened", which is exactly the
 * wrong message when a 4 MB photo has just been thrown away by a dropped
 * connection.
 *
 * Picking a file goes through the crop/camera dialog rather than a bare file
 * input: most of these documents arrive as a phone photo of a card on a desk,
 * and a straighten-and-crop before upload is the difference between a legible
 * scan and one the operations desk has to ask for again. Dropping a file onto
 * the tile skips straight to the upload, because a file already sitting on a
 * desktop is usually already a scan.
 */
export function UploadTile({
  id,
  label,
  hint,
  required,
  fileName,
  fileSize,
  href,
  progress,
  failed,
  uploading,
  disabled,
  onPick,
  onOpenPicker,
  onRetry,
  onRemove,
  onReject,
}: {
  id: string
  label: string
  hint: string
  required?: boolean
  fileName?: string
  fileSize?: number
  href?: string
  progress?: number
  failed?: boolean
  uploading?: boolean
  disabled?: boolean
  /** A file that arrived by drag-and-drop. */
  onPick?: (file: File) => void
  /** Open the crop/camera dialog for this slot. */
  onOpenPicker: () => void
  onRetry?: () => void
  onRemove?: () => void
  onReject?: (reason: string) => void
}) {
  const [dragging, setDragging] = useState(false)

  const acceptDropped = (file: File | undefined | null) => {
    if (!file) return
    const problem = validateDocFile(file)
    if (problem) {
      onReject?.(problem)
      return
    }
    if (onPick) onPick(file)
  }

  const uploaded = Boolean(fileName) && !uploading && !failed

  return (
    <div
      className={cn(
        "rounded-admin-lg border p-3.5 transition-colors",
        uploaded
          ? "border-tone-success-bd bg-tone-success"
          : failed
            ? "border-tone-danger-bd bg-tone-danger"
            : dragging
              ? "border-brand bg-brand-soft"
              : "border-admin-border bg-admin-surface"
      )}
      onDragOver={e => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) acceptDropped(e.dataTransfer.files?.[0])
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 text-admin-sm font-bold text-admin-text">
            {label}
            {required && <span className="text-tone-danger-fg">*</span>}
          </span>
          <p className="text-admin-2xs text-admin-muted">{hint}</p>
        </div>
        {uploaded ? <VerifyPill state="verified" label="Uploaded" /> : null}
      </div>

      <div className="mt-3">
        {uploading ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex items-center justify-between text-admin-2xs font-bold text-admin-muted">
              <span>Uploading…</span>
              <span className="admin-num">{progress ?? 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-admin-surface-3">
              <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress ?? 0}%` }} />
            </div>
          </div>
        ) : failed ? (
          <button
            type="button"
            onClick={onRetry}
            className="admin-focus flex h-10 w-full items-center justify-center gap-1.5 rounded-admin border border-tone-danger-bd bg-admin-surface text-admin-xs font-bold text-tone-danger-fg"
          >
            <RefreshCw size={14} /> Retry upload
          </button>
        ) : uploaded ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-admin-sm border border-admin-border bg-admin-surface px-2.5 py-1.5">
              <FileText size={14} className="shrink-0 text-admin-subtle" />
              <span className="min-w-0 flex-1 truncate text-admin-2xs font-semibold text-admin-text" title={fileName}>
                {fileName}
              </span>
              {fileSize ? (
                <span className="admin-num shrink-0 text-admin-2xs text-admin-subtle">{formatBytes(fileSize)}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-focus inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-admin border border-admin-border bg-admin-surface text-admin-2xs font-bold text-admin-text hover:bg-admin-surface-2"
                >
                  <Paperclip size={13} /> View
                </a>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={onOpenPicker}
                className="admin-focus inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-admin border border-admin-border bg-admin-surface text-admin-2xs font-bold text-admin-text hover:bg-admin-surface-2 disabled:opacity-50"
              >
                <Upload size={13} /> Replace
              </button>
              {onRemove && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onRemove}
                  aria-label={`Remove ${label}`}
                  className="admin-focus inline-flex h-9 w-9 items-center justify-center rounded-admin border border-admin-border bg-admin-surface text-tone-danger-fg hover:bg-admin-surface-2 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            id={id}
            type="button"
            disabled={disabled}
            onClick={onOpenPicker}
            className="admin-focus flex h-20 w-full flex-col items-center justify-center gap-1 rounded-admin border-2 border-dashed border-admin-border-strong bg-admin-surface-2 text-center transition-colors hover:border-brand hover:bg-brand-soft disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5 text-admin-xs font-bold text-admin-text">
              <Upload size={14} className="text-brand" />
              Take a photo, or choose a file
            </span>
            <span className="text-admin-2xs text-admin-subtle">JPG, PNG, WEBP or PDF · up to 5 MB</span>
          </button>
        )}
      </div>
    </div>
  )
}


/* ─── Review ─────────────────────────────────────────────────────────────── */

/** A labelled value in the review screen's summary cards. */
export function Fact({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  const empty = value === undefined || value === null || value === "" || value === false
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">{label}</span>
      <span
        className={cn(
          "min-w-0 truncate text-right text-admin-xs font-semibold",
          empty ? "text-admin-subtle italic" : "text-admin-text",
          mono && !empty && "admin-num font-mono"
        )}
      >
        {empty ? "Not provided" : value}
      </span>
    </div>
  )
}

/** One review card: a step's answers, with a way back to that step. */
export function ReviewCard({
  step,
  title,
  onEdit,
  complete,
  children,
}: {
  step: number
  title: string
  onEdit: () => void
  complete: boolean
  children: React.ReactNode
}) {
  return (
    <section className="rounded-admin-lg border border-admin-border bg-admin-surface shadow-admin-1">
      <header className="flex items-center justify-between gap-3 border-b border-admin-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "admin-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-admin-2xs font-bold",
              complete ? "bg-tone-success text-tone-success-fg" : "bg-tone-warn text-tone-warn-fg"
            )}
          >
            {complete ? <Check size={12} strokeWidth={3} /> : step}
          </span>
          <h3 className="truncate text-admin-sm font-bold text-admin-text">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="admin-focus shrink-0 rounded-admin-sm px-2 py-1 text-admin-2xs font-bold text-brand transition-colors hover:bg-brand-soft"
        >
          Edit
        </button>
      </header>
      <div className="divide-y divide-admin-border px-4 py-1">{children}</div>
    </section>
  )
}
