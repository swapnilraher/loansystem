"use client"

import React from "react"
import { ArrowLeft, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepDef {
  id: number
  title: string
  desc: string
  done: boolean
}

/**
 * The one step header for all three panes.
 *
 * Previously each step drew its own title block and the sidebar drew a second,
 * separate stepper, so "which step am I on" was answered in two places that
 * could disagree and neither said "2 of 3". This is the single source: back
 * affordance, position, title, and a progress bar that is the same height on
 * every step so moving between them does not reflow the page.
 */
export function OnboardingStepHeader({
  steps,
  currentStep,
  title,
  subtitle,
  onBack,
  backLabel = "Back",
}: {
  steps: StepDef[]
  currentStep: number
  title: string
  subtitle: string
  onBack?: () => void
  backLabel?: string
}) {
  const total = steps.length
  const index = steps.findIndex(s => s.id === currentStep)
  const position = index >= 0 ? index + 1 : 1
  // Fills as steps complete, not as they are merely opened, so the bar tracks
  // work done rather than clicks made.
  const completed = steps.filter(s => s.done).length
  const pct = Math.round((completed / total) * 100)

  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="admin-focus admin-touch inline-flex h-11 items-center gap-1.5 rounded-admin-sm border border-admin-border bg-admin-surface px-3 text-admin-xs font-semibold text-admin-muted transition-colors hover:bg-admin-surface-2 hover:text-admin-text sm:h-9"
            >
              <ArrowLeft size={14} />
              {backLabel}
            </button>
          ) : (
            // Holds the row's height when there is nothing to go back to, so
            // step 1 and step 2 headers sit at the same y position.
            <span className="block h-11 sm:h-9" aria-hidden="true" />
          )}
        </div>

        <span className="admin-num shrink-0 rounded-full bg-admin-surface-2 px-2.5 py-1 text-admin-2xs font-bold uppercase tracking-wide text-admin-muted">
          Step {position} of {total}
        </span>
      </div>

      <div className="space-y-1">
        <h2 className="text-admin-2xl font-bold tracking-tight text-admin-text">{title}</h2>
        <p className="text-admin-sm text-admin-muted">{subtitle}</p>
      </div>

      {/* Progress. aria-hidden because the "Step N of N" chip above already
          announces position; a second reading is noise. */}
      <div className="flex items-center gap-2" aria-hidden="true">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-admin-surface-3">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="admin-num text-admin-2xs font-bold text-admin-subtle">{pct}%</span>
      </div>

      <ol className="flex items-center gap-1.5">
        {steps.map(s => (
          <li key={s.id} className="flex flex-1 items-center gap-1.5">
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-admin-2xs font-bold transition-colors",
                s.done
                  ? "bg-tone-success text-tone-success-fg"
                  : s.id === currentStep
                    ? "bg-brand text-brand-fg"
                    : "bg-admin-surface-3 text-admin-subtle"
              )}
            >
              {s.done ? <Check size={11} /> : s.id}
            </span>
            <span
              className={cn(
                "truncate text-admin-2xs font-semibold",
                s.id === currentStep ? "text-admin-text" : "text-admin-subtle"
              )}
            >
              {s.title}
            </span>
          </li>
        ))}
      </ol>
    </header>
  )
}
