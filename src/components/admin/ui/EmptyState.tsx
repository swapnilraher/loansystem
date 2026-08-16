"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  action?: React.ReactNode
  /** `error` swaps the icon chrome to the danger tone. */
  variant?: "empty" | "error"
  size?: "sm" | "md"
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  variant = "empty",
  size = "md",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "py-10 px-4 gap-2.5" : "py-16 px-6 gap-3",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-admin border",
          size === "sm" ? "w-10 h-10" : "w-12 h-12",
          variant === "error"
            ? "bg-tone-danger border-tone-danger-bd text-tone-danger-fg"
            : "bg-admin-surface-2 border-admin-border text-admin-subtle"
        )}
      >
        <Icon size={size === "sm" ? 18 : 22} />
      </div>
      <div className="space-y-1">
        <p className="text-admin-base font-semibold text-admin-text">{title}</p>
        {description && (
          <p className="text-admin-sm text-admin-muted max-w-sm mx-auto">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
