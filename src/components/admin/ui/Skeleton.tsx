"use client"

import React from "react"
import { cn } from "@/lib/utils"

/**
 * Loading placeholder. `animate-pulse` only — no shimmer sweep, which repaints
 * a gradient every frame and is the kind of thing that made the CRM crawl on
 * mobile. Honours prefers-reduced-motion via `motion-reduce:animate-none`.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-admin-surface-3 rounded-admin-sm animate-pulse motion-reduce:animate-none",
        className
      )}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  )
}

/** Row placeholders sized to match DataTable's 44px rows. */
export function SkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-admin-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="h-11 flex items-center gap-4 px-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-3", c === 0 ? "w-40" : "w-24")} />
          ))}
        </div>
      ))}
    </div>
  )
}
