"use client"

import React from "react"
import { AlarmClock, Inbox, LayoutList, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Attention, ATTENTION_LABELS } from "./leadFilters"

const OPTIONS: {
  id: Attention
  icon: React.ComponentType<{ size?: number; className?: string }>
  /** Colour the count when there is work waiting behind this option. */
  urgent?: boolean
}[] = [
  { id: "all", icon: LayoutList },
  { id: "overdue", icon: AlarmClock, urgent: true },
  { id: "untouched", icon: Inbox, urgent: true },
  { id: "unassigned", icon: UserX },
]

interface AttentionFilterProps {
  value: Attention
  counts: Record<Attention, number>
  onChange: (value: Attention) => void
  className?: string
}

/**
 * The "what needs me?" switch. Deliberately a segmented control rather than
 * another chip row: these four are mutually exclusive views of the same list,
 * and a telecaller flips between them dozens of times a shift.
 */
export function AttentionFilter({ value, counts, onChange, className }: AttentionFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Which leads need attention"
      className={cn(
        "inline-flex items-center gap-0.5 p-0.5 rounded-admin-sm border border-admin-border bg-admin-surface-2 overflow-x-auto custom-scrollbar",
        className
      )}
    >
      {OPTIONS.map(option => {
        const isActive = value === option.id
        const count = counts[option.id] ?? 0
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            title={ATTENTION_LABELS[option.id]}
            onClick={() => onChange(option.id)}
            className={cn(
              "admin-focus shrink-0 inline-flex items-center gap-1.5 h-10 sm:h-7 px-2.5 rounded-admin-sm text-admin-xs font-medium transition-colors",
              isActive
                ? "bg-admin-surface text-admin-text shadow-admin-1"
                : "text-admin-muted hover:text-admin-text"
            )}
          >
            <option.icon size={13} />
            <span className="whitespace-nowrap">{ATTENTION_LABELS[option.id]}</span>
            <span
              className={cn(
                "admin-num",
                // A zero is good news here — it should not shout in red.
                option.urgent && count > 0 ? "text-tone-danger-fg font-semibold" : "text-admin-subtle"
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
