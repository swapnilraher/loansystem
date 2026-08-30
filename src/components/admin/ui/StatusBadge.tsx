"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { TONE_CLASSES, Tone, toneForStatus } from "./status"

interface StatusBadgeProps {
  /** Raw status string straight out of Firestore. */
  status?: string | null
  /** Override the auto-mapped tone. Use only for non-status pills. */
  tone?: Tone
  /** Text to render when `status` is empty. */
  fallback?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  /** Leading dot instead of an icon — better for dense table rows. */
  dot?: boolean
  size?: "sm" | "md"
  className?: string
}

export function StatusBadge({
  status,
  tone,
  fallback = "—",
  icon: Icon,
  dot = false,
  size = "sm",
  className,
}: StatusBadgeProps) {
  const resolved = tone ?? toneForStatus(status)
  const t = (resolved && TONE_CLASSES[resolved]) ? TONE_CLASSES[resolved] : TONE_CLASSES.neutral
  const label = status?.trim() || fallback

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-admin-sm border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-admin-xs" : "px-2.5 py-1 text-admin-sm",
        t.soft,
        className
      )}
      title={label}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.dot)} />}
      {!dot && Icon && <Icon size={size === "sm" ? 12 : 14} className="shrink-0" />}
      <span className="truncate max-w-[16ch]">{label}</span>
    </span>
  )
}
