"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminButton } from "./Button"

export interface FilterChip {
  id: string
  label: string
  count?: number
}

interface ToolbarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  /** Single-select chip row — pass `null`/"" as an id for the "All" chip. */
  chips?: FilterChip[]
  activeChip?: string
  onChipChange?: (id: string) => void
  /** Selects, date range, export button — anything trailing. */
  actions?: React.ReactNode
  /** Row ids currently selected; drives the bulk action bar. */
  selectedCount?: number
  onClearSelection?: () => void
  bulkActions?: React.ReactNode
  /**
   * Rows rendered between the search row and the chip row — segmented
   * controls, stat strips, anything that belongs to the same header block but
   * is not a chip. Inherits the toolbar's own vertical rhythm.
   */
  children?: React.ReactNode
  className?: string
}

export function Toolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  chips,
  activeChip,
  onChipChange,
  actions,
  selectedCount = 0,
  onClearSelection,
  bulkActions,
  children,
  className,
}: ToolbarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {onSearchChange && (
          <div className="relative flex-1 min-w-0 sm:max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle pointer-events-none"
            />
            <input
              value={search ?? ""}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="admin-focus w-full h-9 pl-9 pr-8 bg-admin-surface border border-admin-border rounded-admin-sm text-admin-sm text-admin-text placeholder:text-admin-subtle transition-colors"
            />
            {!!search && (
              <button
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="admin-focus absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-admin-subtle hover:text-admin-text"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {actions && <div className="flex items-center gap-2 sm:ml-auto shrink-0">{actions}</div>}
      </div>

      {children}

      {chips && chips.length > 0 && (
        /* The chip row is far wider than a phone screen. The right-edge fade
           tells the user it scrolls; `snap` keeps chips from stopping
           half-clipped. */
        <div className="relative">
          <div
            role="tablist"
            className="flex items-center gap-1.5 overflow-x-auto snap-x scroll-px-3 pb-1 -mb-1 pr-6 custom-scrollbar"
          >
            {chips.map(chip => {
              const isActive = (activeChip ?? "") === chip.id
              return (
                <button
                  key={chip.id || "all"}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChipChange?.(chip.id)}
                  className={cn(
                    "admin-focus shrink-0 snap-start min-h-9 sm:min-h-0 sm:h-7 px-3 sm:px-2.5 rounded-admin-sm border text-admin-xs font-medium transition-colors inline-flex items-center gap-1.5",
                    isActive
                      ? "bg-admin-accent-soft border-admin-accent text-admin-accent"
                      : "bg-admin-surface border-admin-border text-admin-muted hover:text-admin-text hover:border-admin-border-strong"
                  )}
                >
                  {chip.label}
                  {chip.count !== undefined && (
                    <span className="admin-num text-admin-subtle">{chip.count}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 bottom-1 w-6 bg-linear-to-l from-admin-bg to-transparent"
          />
        </div>
      )}

      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 px-3 h-11 bg-admin-accent-soft border border-admin-accent/40 rounded-admin"
          >
            <span className="admin-num text-admin-sm font-semibold text-admin-text">
              {selectedCount} selected
            </span>
            <div className="ml-auto flex items-center gap-2">
              {bulkActions}
              {onClearSelection && (
                <AdminButton variant="ghost" size="sm" onClick={onClearSelection}>
                  Clear
                </AdminButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
