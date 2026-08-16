"use client"

import React, { useState } from "react"
import { Filter, RotateCcw, Calendar, User, Layers, MapPin, Tag } from "lucide-react"
import { AnalyticsFilterState, INITIAL_ANALYTICS_FILTERS } from "@/lib/analyticsEngine"
import { AdminUser } from "@/lib/hooks/useUsers"
import { AdminButton } from "@/components/admin/ui"

interface GlobalAnalyticsFilterBarProps {
  filters: AnalyticsFilterState
  onChange: (filters: AnalyticsFilterState) => void
  staffList: AdminUser[]
  sources?: string[]
  loanTypes?: string[]
}

export function GlobalAnalyticsFilterBar({
  filters,
  onChange,
  staffList,
  sources = ["Landing", "Portal", "Bulk", "Chatbot", "Whatsapp ads", "Porter"],
  loanTypes = ["Personal Loan", "Business Loan", "Home Loan", "Loan Against Property", "Gold Loan"],
}: GlobalAnalyticsFilterBarProps) {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilterState>(filters)

  const handlePresetChange = (preset: string) => {
    const updated = { ...localFilters, datePreset: preset }
    setLocalFilters(updated)
    onChange(updated)
  }

  const handleApply = () => {
    onChange(localFilters)
  }

  const handleReset = () => {
    setLocalFilters(INITIAL_ANALYTICS_FILTERS)
    onChange(INITIAL_ANALYTICS_FILTERS)
  }

  const fieldCls =
    "h-8 px-2.5 rounded-admin-sm border border-admin-border bg-admin-bg text-admin-xs font-semibold text-admin-text outline-none focus:border-admin-accent"

  return (
    <div className="rounded-admin border border-admin-border bg-admin-surface p-3.5 space-y-3 shadow-xs">
      {/* Header & Quick Date Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-admin-border pb-2.5">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-admin-accent" />
          <h3 className="text-admin-sm font-bold text-admin-text">
            Global Analytics Filters
          </h3>
        </div>

        {/* Date Presets Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            "All Time",
            "Today",
            "Yesterday",
            "Last 7 Days",
            "Last 30 Days",
            "This Month",
            "Last Month",
            "Custom Date",
          ].map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetChange(preset)}
              className={`px-2.5 py-1 rounded-admin-sm text-admin-2xs font-bold transition-colors cursor-pointer shrink-0 ${
                localFilters.datePreset === preset
                  ? "bg-admin-accent text-white"
                  : "bg-admin-bg border border-admin-border text-admin-muted hover:text-admin-text"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 items-end">
        {/* Custom Date Range if selected */}
        {localFilters.datePreset === "Custom Date" && (
          <>
            <div>
              <label className="block text-admin-2xs font-bold text-admin-subtle mb-1">Start Date</label>
              <input
                type="date"
                value={localFilters.startDate || ""}
                onChange={e => setLocalFilters(f => ({ ...f, startDate: e.target.value }))}
                className={fieldCls}
              />
            </div>
            <div>
              <label className="block text-admin-2xs font-bold text-admin-subtle mb-1">End Date</label>
              <input
                type="date"
                value={localFilters.endDate || ""}
                onChange={e => setLocalFilters(f => ({ ...f, endDate: e.target.value }))}
                className={fieldCls}
              />
            </div>
          </>
        )}

        {/* Staff Filter */}
        <div>
          <label className="block text-admin-2xs font-bold text-admin-subtle mb-1">Staff Member</label>
          <select
            value={localFilters.staffId || ""}
            onChange={e => setLocalFilters(f => ({ ...f, staffId: e.target.value }))}
            className={fieldCls}
          >
            <option value="">All Staff</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>

        {/* Lead Source */}
        <div>
          <label className="block text-admin-2xs font-bold text-admin-subtle mb-1">Lead Source</label>
          <select
            value={localFilters.source || ""}
            onChange={e => setLocalFilters(f => ({ ...f, source: e.target.value }))}
            className={fieldCls}
          >
            <option value="">All Sources</option>
            {sources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>

        {/* Loan Type */}
        <div>
          <label className="block text-admin-2xs font-bold text-admin-subtle mb-1">Loan Type</label>
          <select
            value={localFilters.loanType || ""}
            onChange={e => setLocalFilters(f => ({ ...f, loanType: e.target.value }))}
            className={fieldCls}
          >
            <option value="">All Loan Types</option>
            {loanTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-admin-2xs font-bold text-admin-subtle mb-1">Lead Status</label>
          <select
            value={localFilters.status || ""}
            onChange={e => setLocalFilters(f => ({ ...f, status: e.target.value }))}
            className={fieldCls}
          >
            <option value="">All Statuses</option>
            {["New Lead", "System Qualified", "Contacted", "Interested", "Bank Processing", "Pending Approval", "Disbursed", "Rejected"].map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Assignment Filter */}
        <div>
          <label className="block text-admin-2xs font-bold text-admin-subtle mb-1">Assignment</label>
          <select
            value={localFilters.assignedState || "all"}
            onChange={e => setLocalFilters(f => ({ ...f, assignedState: e.target.value as any }))}
            className={fieldCls}
          >
            <option value="all">All (Assigned & Unassigned)</option>
            <option value="assigned">Assigned Only</option>
            <option value="unassigned">Unassigned Only</option>
          </select>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
          <AdminButton
            variant="primary"
            onClick={handleApply}
            className="h-8 text-admin-xs font-bold flex-1 justify-center"
          >
            Apply Filters
          </AdminButton>
          <button
            type="button"
            onClick={handleReset}
            className="h-8 px-2.5 rounded-admin-sm border border-admin-border bg-admin-bg hover:bg-admin-surface text-admin-muted hover:text-admin-text transition-colors flex items-center justify-center cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
