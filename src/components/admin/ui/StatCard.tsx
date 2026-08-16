"use client"

import React from "react"
import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tone, TONE_CLASSES } from "./status"
import { Skeleton } from "./Skeleton"

/**
 * Hand-rolled SVG sparkline instead of Recharts.
 * Recharts mounts a ResponsiveContainer with a ResizeObserver per chart; a
 * dashboard with 6 stat cards paid that cost 6 times for 40px of decoration.
 */
function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = 100 / (data.length - 1)
  const points = data.map((v, i) => `${(i * step).toFixed(2)},${(28 - ((v - min) / span) * 26).toFixed(2)}`)

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("w-full h-7 overflow-visible", className)}
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export interface StatDelta {
  /** Already-formatted, e.g. "+12.4%". */
  value: string
  direction: "up" | "down" | "flat"
  /** "vs last week" */
  label?: string
  /** Down is good for things like "overdue follow-ups". */
  invert?: boolean
}

interface StatCardProps {
  label: string
  value: React.ReactNode
  /** Small text under the value, e.g. "of 240 leads". */
  hint?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  tone?: Tone
  delta?: StatDelta
  spark?: number[]
  href?: string
  /** Turns the card into a button — used where a KPI doubles as a filter. */
  onClick?: () => void
  /** Reflects the filter this card applies being the one currently on. */
  active?: boolean
  /** Wash the whole card in the tone instead of only the icon chip. */
  tint?: boolean
  /**
   * Header mode. Below `md` the card keeps only its label and its number — no
   * icon chip, no hint, no delta — so a six-card strip costs ~56px of a phone
   * screen instead of ~130px. From `md` up it is the ordinary card. Use it
   * where the strip is page furniture above a list, not the page's content.
   */
  dense?: boolean
  loading?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  delta,
  spark,
  href,
  onClick,
  active = false,
  tint = false,
  dense = false,
  loading = false,
  className,
}: StatCardProps) {
  const t = TONE_CLASSES[tone]

  const deltaGood =
    delta?.direction === "flat" ? null : delta ? (delta.direction === "up") !== !!delta.invert : null

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "font-medium text-admin-muted uppercase tracking-wide",
            dense ? "text-admin-2xs md:text-admin-xs truncate" : "text-admin-xs"
          )}
        >
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "w-9 h-9 rounded-full border items-center justify-center shrink-0",
              // A tinted dense card already carries the tone across its whole
              // surface, so the chip is the first thing to go on a phone.
              dense ? "hidden md:flex" : "flex",
              t.soft
            )}
          >
            <Icon size={16} />
          </span>
        )}
      </div>

      <div className={dense ? "mt-0.5 md:mt-1.5" : "mt-1.5"}>
        {loading ? (
          <Skeleton className={dense ? "h-6 w-16 md:h-7 md:w-24" : "h-7 w-24"} />
        ) : (
          <p
            className={cn(
              "admin-num font-semibold text-admin-text truncate",
              dense ? "text-admin-lg md:text-admin-2xl" : "text-admin-2xl"
            )}
          >
            {value}
          </p>
        )}
        {hint && !loading && (
          <p className={cn("text-admin-xs text-admin-subtle mt-0.5", dense && "hidden md:block")}>
            {hint}
          </p>
        )}
      </div>

      {(delta || spark) && !loading && (
        <div
          className={cn(
            "mt-2 items-end justify-between gap-3",
            dense ? "hidden md:flex" : "flex"
          )}
        >
          {delta && (
            <span className="inline-flex items-center gap-1 text-admin-xs font-medium">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5",
                  deltaGood === null
                    ? "text-admin-subtle"
                    : deltaGood
                      ? TONE_CLASSES.success.text
                      : TONE_CLASSES.danger.text
                )}
              >
                {delta.direction === "up" ? (
                  <ArrowUpRight size={13} />
                ) : delta.direction === "down" ? (
                  <ArrowDownRight size={13} />
                ) : (
                  <Minus size={13} />
                )}
                <span className="admin-num">{delta.value}</span>
              </span>
              {delta.label && <span className="text-admin-subtle">{delta.label}</span>}
            </span>
          )}
          {spark && spark.length > 1 && (
            <div className={cn("w-20 shrink-0", t.text)}>
              <Sparkline data={spark} />
            </div>
          )}
        </div>
      )}
    </>
  )

  const interactive = !!href || !!onClick

  const shell = cn(
    "rounded-admin shadow-admin-1 min-w-0 border",
    dense ? "p-2.5 md:p-3" : "p-3",
    // The tinted variant washes the card in its tone; `t.soft` already carries a
    // matching border, so it must not also get the neutral admin border.
    tint ? t.soft : "bg-admin-surface border-admin-border",
    interactive &&
      "block w-full text-left transition-colors admin-focus hover:shadow-admin-2 hover:border-admin-border-strong",
    active && "ring-2 ring-[var(--admin-focus)] border-admin-accent",
    className
  )

  if (href) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={shell}>
        {body}
      </button>
    )
  }

  return <div className={shell}>{body}</div>
}
