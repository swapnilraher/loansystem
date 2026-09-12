"use client"

/**
 * Modern Fintech Design Primitives for Techstar DSA Partner Portal.
 *
 * Provides unified, premium, responsive UI elements for:
 * - Login
 * - Onboarding Step 1 (Personal & Business Details)
 * - Onboarding Step 2 (KYC & Bank Setup)
 * - Onboarding Step 3 (Review & Submit)
 * - Status & Success Screens
 *
 * Adheres strictly to the Techstar design system:
 * - Inter/Plus Jakarta Sans typography
 * - Slate-900 primary text, Slate-500 secondary text
 * - Indigo brand accents (#4f46e5)
 * - Emerald success (#16a34a)
 * - White cards with subtle borders (#e2e8f0) and soft elevation
 * - 52-56px input and CTA touch targets
 * - Mobile-first sticky action bar with safe-area padding
 */

import React, { useId, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  FileText,
  Info,
  Loader2,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react"

import { validateDocFile } from "@/components/onboarding/ImageCropModal"
import { cn } from "@/lib/utils"

/* ─── Typography & Page Headings ─────────────────────────────────────────── */

/**
 * StepHeading: Primary page title block for onboarding steps.
 */
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
    <header className="space-y-1.5">
      {eyebrow && (
        <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600">
          {eyebrow}
        </span>
      )}
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
        {description}
      </p>
    </header>
  )
}

/* ─── Cards & Containers ─────────────────────────────────────────────────── */

/**
 * SectionCard: Global white card grouping related inputs with consistent elevation and radius.
 */
export function SectionCard({
  title,
  hint,
  children,
  action,
  className,
}: {
  title?: string
  hint?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-4 sm:space-y-5",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 pb-1 border-b border-slate-100/80">
          <div className="min-w-0 space-y-0.5">
            {title && (
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            {hint && <p className="text-xs text-slate-500 leading-relaxed">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Legacy alias for SectionCard */
export const Section = SectionCard

/**
 * Two-column responsive field grid for desktop, collapsing to single-column on mobile.
 */
export function FieldGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5 sm:gap-y-4", className)}>
      {children}
    </div>
  )
}

export function Full({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>
}

/* ─── Form Fields & Inputs ───────────────────────────────────────────────── */

export interface FieldProps {
  id: string
  label: string
  hint?: string
  required?: boolean
  optional?: boolean
  error?: string | null
  aside?: React.ReactNode
  children: React.ReactNode
}

/**
 * FormField: Standardized field wrapper with compact label, red required asterisk, error text, and hint.
 */
export function FormField({
  id,
  label,
  hint,
  required,
  optional,
  error,
  aside,
  children,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-xs sm:text-sm font-semibold text-slate-800 select-none"
        >
          {label}
          {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
          {optional && (
            <span className="text-[11px] sm:text-xs font-normal text-slate-400 ml-1">
              (optional)
            </span>
          )}
        </label>
        {aside}
      </div>

      {children}

      <div className="min-h-4">
        {error ? (
          <span
            role="alert"
            className="flex items-center gap-1 text-xs font-medium text-rose-500 animate-fadeIn"
          >
            <AlertCircle size={12} className="shrink-0" />
            {error}
          </span>
        ) : hint ? (
          <span className="block text-[11px] sm:text-xs text-slate-400">{hint}</span>
        ) : null}
      </div>
    </div>
  )
}

/** Legacy alias */
export const Field = FormField

const INPUT_BASE =
  "w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"

export function TextInput({
  invalid,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={cn(
        INPUT_BASE,
        invalid && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10",
        className
      )}
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
    <div className="relative">
      <select
        {...rest}
        aria-invalid={invalid || undefined}
        className={cn(
          INPUT_BASE,
          "pr-10 appearance-none cursor-pointer text-slate-700",
          invalid && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10",
          className
        )}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  )
}

/**
 * PrefixedInput: Form input with a fixed country or currency prefix (+91, ₹, etc.).
 */
export function PrefixedInput({
  prefix,
  invalid,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { prefix: string; invalid?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-11 sm:h-12 overflow-hidden rounded-xl border border-slate-200 bg-white transition-all focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10",
        invalid && "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/10"
      )}
    >
      <span className="flex select-none items-center border-r border-slate-200 bg-slate-50/90 px-3.5 text-xs font-semibold text-slate-800 shrink-0">
        {prefix}
      </span>
      <input
        {...rest}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full bg-transparent px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none",
          className
        )}
      />
    </div>
  )
}

/**
 * ChoiceGroup: Modern fintech selection cards (used for Applying as Individual vs Firm, GST Yes vs No).
 */
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
    <div className="space-y-2">
      <span id={labelId} className="block text-xs sm:text-sm font-semibold text-slate-800 select-none">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={cn(
          "grid gap-2.5",
          columns === 5
            ? "grid-cols-2 sm:grid-cols-5"
            : columns === 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {options.map((option) => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option)}
              className={cn(
                "flex min-h-[56px] flex-col items-start justify-center gap-1 rounded-xl border p-3.5 sm:p-4 text-left transition-all cursor-pointer select-none",
                active
                  ? "border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600/20 shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">{option}</span>
                {active ? (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check size={13} className="stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border border-slate-300 bg-white shrink-0" />
                )}
              </div>
              {descriptions?.[option] && (
                <span className="text-xs text-slate-500 font-normal leading-relaxed">
                  {descriptions[option]}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * CheckRow: Accessible large-tap checkbox card with high contrast and clear focus.
 */
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
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 sm:p-4 transition-all select-none",
        checked
          ? "border-indigo-600/60 bg-indigo-50/40 text-slate-900"
          : "border-slate-200 bg-white hover:bg-slate-50/60 text-slate-700"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
      />
      <span className="text-xs sm:text-sm leading-relaxed text-slate-700">
        {children}
      </span>
    </label>
  )
}

/* ─── Feedback & Status Affordances ──────────────────────────────────────── */

type Tone = "info" | "success" | "warn" | "danger"

const TONE_STYLES: Record<Tone, { box: string; text: string; Icon: typeof Info }> = {
  info: { box: "border-blue-200 bg-blue-50/80", text: "text-blue-900", Icon: Info },
  success: { box: "border-emerald-200 bg-emerald-50/80", text: "text-emerald-900", Icon: CheckCircle2 },
  warn: { box: "border-amber-200 bg-amber-50/80", text: "text-amber-900", Icon: AlertTriangle },
  danger: { box: "border-rose-200 bg-rose-50/80", text: "text-rose-900", Icon: AlertCircle },
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
  const { box, text, Icon } = TONE_STYLES[tone]
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border p-3.5 text-xs", box, text)}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <div className="font-bold text-xs sm:text-sm">{title}</div>}
        {children && <div className="leading-relaxed">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  )
}

/**
 * VerifyPill: Status badge displaying verification state.
 */
export function VerifyPill({
  state,
  label,
}: {
  state: "verified" | "pending" | "failed"
  label?: string
}) {
  const look = {
    verified: {
      box: "bg-emerald-50 text-emerald-700 border-emerald-200",
      text: label || "Verified",
      Icon: CheckCircle2,
    },
    pending: {
      box: "bg-slate-100 text-slate-600 border-slate-200",
      text: label || "Not verified",
      Icon: Info,
    },
    failed: {
      box: "bg-rose-50 text-rose-700 border-rose-200",
      text: label || "Verification failed",
      Icon: AlertCircle,
    },
  }[state]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
        look.box
      )}
    >
      <look.Icon size={12} className="shrink-0" />
      {look.text}
    </span>
  )
}

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
      className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40 cursor-pointer"
    >
      {loading && <Loader2 size={11} className="animate-spin" />}
      {children}
    </button>
  )
}

/* ─── Navigation & Sticky Bottom Action Bar ──────────────────────────────── */

/**
 * StepNav / StickyActionBar: Reusable sticky mobile CTA footer that respects safe-area
 * and ensures the primary action button is always reachable without obscuring form fields.
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
  // Determine icon according to prompt rules:
  // Continue -> ArrowRight
  // Verify & Continue -> CheckCircle2 / ShieldCheck
  // Submit Application -> Send
  const isSubmit = continueLabel.toLowerCase().includes("submit")
  const isVerify = continueLabel.toLowerCase().includes("verify")

  return (
    <div className="sticky bottom-0 z-30 -mx-3 sm:mx-0 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#f8fafc]/90 backdrop-blur-md border-t border-slate-200/80 sm:border-t-0 sm:bg-transparent">
      <div className="flex flex-col gap-2">
        {secondary}
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled || loading}
          className="w-full h-12 sm:h-13 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm sm:text-base font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Processing…</span>
            </>
          ) : (
            <>
              <span>{continueLabel}</span>
              {isSubmit ? (
                <Send size={16} className="shrink-0" />
              ) : isVerify ? (
                <CheckCircle2 size={17} className="shrink-0" />
              ) : (
                <ArrowRight size={17} className="shrink-0" />
              )}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/* ─── Document Upload Card ───────────────────────────────────────────────── */

export function formatBytes(bytes?: number): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * DocumentUploadCard: Standardized card slot for uploading, previewing, replacing, and deleting documents.
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
  onPick?: (file: File) => void
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
        "rounded-2xl border p-4 transition-all",
        uploaded
          ? "border-emerald-200 bg-emerald-50/20"
          : failed
            ? "border-rose-200 bg-rose-50/40"
            : dragging
              ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
              : "border-slate-200 bg-white"
      )}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) acceptDropped(e.dataTransfer.files?.[0])
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800">
            {label}
            {required && <span className="text-rose-500">*</span>}
          </span>
          <p className="text-[11px] sm:text-xs text-slate-500">{hint}</p>
        </div>
        {uploaded ? <VerifyPill state="verified" label="Uploaded" /> : null}
      </div>

      <div className="mt-3">
        {uploading ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Uploading…</span>
              <span className="font-mono">{progress ?? 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </div>
        ) : failed ? (
          <button
            type="button"
            onClick={onRetry}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} /> Retry upload
          </button>
        ) : uploaded ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <FileText size={16} className="shrink-0 text-slate-400" />
              <span
                className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800"
                title={fileName}
              >
                {fileName}
              </span>
              {fileSize ? (
                <span className="shrink-0 text-xs font-mono text-slate-500">
                  {formatBytes(fileSize)}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Eye size={13} /> View
                </a>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={onOpenPicker}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload size={13} /> Replace
              </button>
              {onRemove && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onRemove}
                  aria-label={`Remove ${label}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
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
            className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center transition-colors hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Upload size={14} className="text-indigo-600" />
              Take a photo, or choose a file
            </span>
            <span className="text-[11px] text-slate-400">JPG, PNG, WEBP or PDF · up to 5 MB</span>
          </button>
        )}
      </div>
    </div>
  )
}

/** Reusable alias for DocumentUploadCard */
export const DocumentUploadCard = UploadTile

/* ─── Review Accordion & Fact Summary ─────────────────────────────────────── */

export function Fact({
  label,
  value,
  mono,
}: {
  label: string
  value?: React.ReactNode
  mono?: boolean
}) {
  const empty = value === undefined || value === null || value === "" || value === false
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 text-xs sm:text-sm">
      <span className="shrink-0 font-medium text-slate-500">{label}</span>
      <span
        className={cn(
          "min-w-0 text-right font-semibold",
          empty ? "text-slate-400 italic" : "text-slate-900",
          mono && !empty && "font-mono"
        )}
      >
        {empty ? "Not provided" : value}
      </span>
    </div>
  )
}

/**
 * AccordionReviewSection: Collapsible section card for Step 3 Review & Submit.
 * Displays a clean summary when collapsed and complete facts when expanded, with an [Edit] shortcut.
 */
export function ReviewCard({
  step,
  title,
  onEdit,
  complete,
  summary,
  children,
  defaultExpanded = true,
}: {
  step: number
  title: string
  onEdit: () => void
  complete: boolean
  summary?: string
  children: React.ReactNode
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden transition-all">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-50/60 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer group"
          aria-expanded={expanded}
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              complete
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            )}
          >
            {complete ? <Check size={12} strokeWidth={3} /> : step}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {title}
            </h3>
            {!expanded && summary && (
              <p className="truncate text-[11px] text-slate-500 font-normal">{summary}</p>
            )}
          </div>
          <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
        >
          Edit
        </button>
      </header>

      {expanded && (
        <div className="divide-y divide-slate-100 px-4 sm:px-6 py-1 animate-fadeIn">
          {children}
        </div>
      )}
    </section>
  )
}
