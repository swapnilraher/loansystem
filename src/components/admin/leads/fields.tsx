"use client"

import React from "react"
import { cn } from "@/lib/utils"

/** Label + control pair used across every leads sheet. */
export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">
        {label}
      </span>
      {children}
      {hint && <span className="block text-admin-2xs text-admin-subtle">{hint}</span>}
    </label>
  )
}

const CONTROL =
  "admin-focus w-full bg-admin-surface border border-admin-border rounded-admin-sm text-admin-sm text-admin-text placeholder:text-admin-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return <input {...rest} className={cn(CONTROL, "h-9 px-3", className)} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props
  return (
    <select {...rest} className={cn(CONTROL, "h-9 px-2.5 cursor-pointer", className)}>
      {children}
    </select>
  )
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return <textarea {...rest} className={cn(CONTROL, "px-3 py-2 resize-none", className)} />
}

/** Read-only label/value row used in the detail sheet's fact tables. */
export function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2">
      <span className="text-admin-xs text-admin-muted shrink-0">{label}</span>
      <span className="text-admin-sm text-admin-text text-right truncate">{value}</span>
    </div>
  )
}

export function SectionCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn("bg-admin-surface border border-admin-border rounded-admin overflow-hidden", className)}
    >
      <div className="px-3.5 py-2 bg-admin-surface-2 border-b border-admin-border">
        <h4 className="text-admin-2xs font-semibold uppercase tracking-wide text-admin-muted">
          {title}
        </h4>
      </div>
      {children}
    </section>
  )
}
