"use client"

import React from "react"
import type { CampaignCounts } from "@/lib/waCampaignShared"

/**
 * The two readouts the builder and the report both show.
 *
 * They live here rather than in either page because a `page.tsx` may only
 * export a default component plus Next's own route config — a shared named
 * export from a page fails the build.
 */

export function CountRow({ counts, total }: { counts: CampaignCounts; total: number }) {
  const cells: [string, number, string][] = [
    ["Total", total, "text-slate-700"],
    ["Sent", counts.sent, "text-blue-600"],
    ["Delivered", counts.delivered, "text-indigo-600"],
    ["Read", counts.read, "text-emerald-600"],
    ["Failed", counts.failed, "text-rose-600"],
    ["Pending", counts.pending, "text-amber-600"],
  ]
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {cells.map(([label, value, tone]) => (
        <div key={label} className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className={`text-lg font-black ${tone}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    queued: "bg-slate-100 text-slate-600",
    running: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-amber-100 text-amber-700",
    failed: "bg-rose-100 text-rose-700",
    pending: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    delivered: "bg-indigo-100 text-indigo-700",
    read: "bg-emerald-100 text-emerald-700",
    skipped: "bg-slate-100 text-slate-400",
  }
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
        tones[status] || tones.queued
      }`}
    >
      {status}
    </span>
  )
}
