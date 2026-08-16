"use client"

import React, { useMemo } from "react"
import {
  User,
  Phone,
  MessageSquare,
  Clock,
  TrendingUp,
  Award,
  CheckCircle2,
  X,
  FileText,
  Activity,
} from "lucide-react"
import { StaffPerformanceMetrics } from "@/lib/analyticsEngine"
import { Sheet, AdminButton } from "@/components/admin/ui"

interface StaffDetailModalProps {
  staff: StaffPerformanceMetrics | null
  activities: any[]
  onClose: () => void
}

export function StaffDetailModal({ staff, activities, onClose }: StaffDetailModalProps) {
  if (!staff) return null

  // Filter activities for this staff member
  const memberActivities = useMemo(() => {
    const name = staff.name.trim().toLowerCase()
    return activities
      .filter(act => {
        const actUser = (act.userName || act.staffName || "").trim().toLowerCase()
        return actUser.includes(name) || act.staffId === staff.id
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [staff, activities])

  return (
    <Sheet
      open={!!staff}
      onClose={onClose}
      side="right"
      size="lg"
      title={`Staff Performance Detail — ${staff.name}`}
    >
      <div className="space-y-5 p-4 text-admin-xs">
        {/* Header Summary Card */}
        <div className="rounded-admin border border-admin-border bg-admin-surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-admin-accent-soft text-admin-accent flex items-center justify-center text-lg font-black uppercase">
              {staff.name.substring(0, 2)}
            </div>
            <div>
              <h3 className="text-admin-base font-bold text-admin-text">
                {staff.name}
              </h3>
              <p className="text-admin-xs text-admin-muted font-medium">
                {staff.role} · {staff.email} · {staff.phone}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-admin-2xs font-bold border border-emerald-200">
                <CheckCircle2 size={12} />
                Status: {staff.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-admin-2xs font-bold text-admin-subtle uppercase tracking-wider">
              Performance Score
            </span>
            <span className={`text-xl font-black ${
              staff.performanceScore >= 75
                ? "text-emerald-600"
                : staff.performanceScore >= 40
                ? "text-amber-600"
                : "text-red-600"
            }`}>
              {staff.performanceScore} / 100
            </span>
          </div>
        </div>

        {/* Staff Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-admin-sm border border-admin-border bg-admin-bg text-center">
            <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Assigned Leads</p>
            <p className="text-admin-base font-extrabold text-admin-text mt-0.5">{staff.totalLeads}</p>
          </div>
          <div className="p-3 rounded-admin-sm border border-admin-border bg-admin-bg text-center">
            <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Disbursed</p>
            <p className="text-admin-base font-extrabold text-emerald-600 mt-0.5">{staff.disbursedLeads}</p>
          </div>
          <div className="p-3 rounded-admin-sm border border-admin-border bg-admin-bg text-center">
            <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Conversion %</p>
            <p className="text-admin-base font-extrabold text-indigo-600 mt-0.5">{staff.conversionRate}%</p>
          </div>
          <div className="p-3 rounded-admin-sm border border-admin-border bg-admin-bg text-center">
            <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Disbursed %</p>
            <p className="text-admin-base font-extrabold text-admin-text mt-0.5">{staff.disbursementRate}%</p>
          </div>
        </div>

        {/* Activity Summary Grid */}
        <div className="rounded-admin border border-admin-border bg-admin-surface p-4 space-y-3 shadow-xs">
          <h4 className="text-admin-sm font-bold text-admin-text flex items-center gap-2">
            <Activity size={16} className="text-admin-accent" />
            <span>Activity Breakdown</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded bg-admin-bg border border-admin-border">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Total Calls</p>
              <p className="text-admin-sm font-bold text-indigo-600 mt-0.5">{staff.callsCount}</p>
            </div>
            <div className="p-2.5 rounded bg-admin-bg border border-admin-border">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">WhatsApp Chats</p>
              <p className="text-admin-sm font-bold text-emerald-600 mt-0.5">{staff.chatsCount}</p>
            </div>
            <div className="p-2.5 rounded bg-admin-bg border border-admin-border">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Follow-ups</p>
              <p className="text-admin-sm font-bold text-amber-600 mt-0.5">{staff.followUpsCount}</p>
            </div>
            <div className="p-2.5 rounded bg-admin-bg border border-admin-border">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Status Updates</p>
              <p className="text-admin-sm font-bold text-admin-text mt-0.5">{staff.statusUpdatesCount}</p>
            </div>
          </div>
        </div>

        {/* Performance Timeline (Exact Timestamp Action Log) */}
        <div className="rounded-admin border border-admin-border bg-admin-surface p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-admin-border pb-2">
            <h4 className="text-admin-sm font-bold text-admin-text flex items-center gap-2">
              <Clock size={16} className="text-admin-accent" />
              <span>Performance Action Log & Timeline</span>
            </h4>
            <span className="text-admin-2xs font-bold text-admin-subtle">
              {memberActivities.length} Operations Logged
            </span>
          </div>

          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
            {memberActivities.length === 0 ? (
              <div className="py-8 text-center text-admin-muted font-bold">
                No recent activity operations logged for {staff.name}.
              </div>
            ) : (
              memberActivities.map((act, index) => {
                const timestamp = act.timestamp ? new Date(act.timestamp) : new Date()
                const formattedTime = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                const formattedDate = timestamp.toLocaleDateString([], { month: "short", day: "numeric" })

                return (
                  <div
                    key={index}
                    className="p-3 rounded-admin-sm border border-admin-border bg-admin-bg flex items-start justify-between gap-3 hover:border-admin-accent/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-admin-xs font-bold text-admin-text leading-snug">
                        {act.details || act.text || act.action || "Staff Action Executed"}
                      </p>
                      {act.leadId && (
                        <p className="text-admin-2xs font-mono text-admin-subtle">
                          Lead ID: {act.leadId.substring(0, 8)}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 font-mono text-admin-2xs font-bold text-admin-accent bg-admin-accent-soft px-2 py-0.5 rounded">
                        <Clock size={10} />
                        {formattedTime}
                      </span>
                      <span className="block text-[10px] text-admin-subtle font-medium mt-0.5">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
