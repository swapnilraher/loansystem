"use client";

import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_TIME, DATE_PRESETS, type LeadFilters } from "./leadFilters";

interface DateRangeFilterProps {
  preset: string;
  range: { start: string; end: string };
  onChange: (patch: Partial<LeadFilters>) => void;
  className?: string;
}

/**
 * The created-at window, lifted out of the filter sheet and onto the page.
 * It is the one filter staff change several times an hour ("what came in
 * today?"), and two taps to reach it inside a sheet was two too many.
 */
export function DateRangeFilter({
  preset,
  range,
  onChange,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = preset !== ALL_TIME;
  const label =
    preset === "Custom Range" && range.start && range.end
      ? `${range.start} → ${range.end}`
      : preset;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "admin-focus inline-flex items-center gap-1.5 h-9 px-3 rounded-admin-sm border bg-admin-surface text-admin-xs font-medium transition-colors",
          active
            ? "border-admin-accent text-admin-accent"
            : "border-admin-border text-admin-muted hover:text-admin-text hover:border-admin-border-strong",
        )}
      >
        <CalendarDays size={14} />
        <span className="truncate max-w-[22ch]">{label}</span>
        <ChevronDown size={13} className="opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-30 w-64 bg-admin-surface border border-admin-border rounded-admin shadow-admin-3 p-1.5">
          {DATE_PRESETS.map((option) => (
            <button
              key={option}
              onClick={() => {
                // Only "Custom Range" needs the panel to stay open — every other
                // preset is a complete answer on its own.
                onChange(
                  option === "Custom Range"
                    ? { datePreset: option }
                    : { datePreset: option, dateRange: { start: "", end: "" } },
                );
                if (option !== "Custom Range") setOpen(false);
              }}
              className={cn(
                "admin-focus w-full text-left px-2.5 py-2 rounded-admin-sm text-admin-xs transition-colors",
                option === preset
                  ? "bg-admin-accent-soft text-admin-accent font-semibold"
                  : "text-admin-text hover:bg-admin-surface-2",
              )}
            >
              {option}
            </button>
          ))}

          {preset === "Custom Range" && (
            <div className="mt-1.5 pt-2 border-t border-admin-border grid grid-cols-2 gap-2 px-1 pb-1">
              <label className="space-y-1">
                <span className="block text-admin-2xs uppercase tracking-wide text-admin-subtle">
                  From
                </span>
                <input
                  type="date"
                  value={range.start}
                  max={range.end || undefined}
                  onChange={(e) =>
                    onChange({ dateRange: { ...range, start: e.target.value } })
                  }
                  className="admin-focus w-full h-9 px-2 bg-admin-surface border border-admin-border rounded-admin-sm text-admin-xs text-admin-text"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-admin-2xs uppercase tracking-wide text-admin-subtle">
                  To
                </span>
                <input
                  type="date"
                  value={range.end}
                  min={range.start || undefined}
                  onChange={(e) =>
                    onChange({ dateRange: { ...range, end: e.target.value } })
                  }
                  className="admin-focus w-full h-9 px-2 bg-admin-surface border border-admin-border rounded-admin-sm text-admin-xs text-admin-text"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
