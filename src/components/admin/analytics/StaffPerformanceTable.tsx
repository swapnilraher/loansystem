"use client"

import React, { useMemo, useState } from "react"
import {
  Download,
  FileSpreadsheet,
  FileText,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Award,
  SlidersHorizontal,
} from "lucide-react"
import {
  StaffPerformanceMetrics,
  exportStaffPerformanceCsv,
  exportStaffPerformancePdf,
} from "@/lib/analyticsEngine"
import { AdminButton } from "@/components/admin/ui"

interface StaffPerformanceTableProps {
  metrics: StaffPerformanceMetrics[]
  onSelectStaff: (staff: StaffPerformanceMetrics) => void
}

export function StaffPerformanceTable({ metrics, onSelectStaff }: StaffPerformanceTableProps) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<keyof StaffPerformanceMetrics>("totalLeads")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showColumnToggle, setShowColumnToggle] = useState(false)

  // Column visibility flags
  const [visibleCols, setVisibleCols] = useState({
    role: true,
    totalLeads: true,
    newLeads: true,
    contacted: true,
    calls: true,
    chats: true,
    followUps: true,
    updates: true,
    login: true,
    sanction: true,
    disbursed: true,
    rejected: true,
    conversion: true,
    disbursement: true,
    score: true,
    actions: true,
  })

  // Filter & Sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return metrics.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    )
  }, [metrics, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA
      }
      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })
  }, [filtered, sortKey, sortOrder])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const firstIndex = (currentPage - 1) * pageSize
  const lastIndex = Math.min(firstIndex + pageSize, sorted.length)
  const paginated = useMemo(() => sorted.slice(firstIndex, lastIndex), [sorted, firstIndex, lastIndex])

  const toggleSort = (key: keyof StaffPerformanceMetrics) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("desc")
    }
  }

  const fieldCls = "h-8 px-2.5 rounded-admin-sm border border-admin-border bg-admin-bg text-admin-xs font-semibold text-admin-text outline-none"

  return (
    <div className="bg-admin-surface border border-admin-border rounded-admin shadow-xs space-y-3 p-3.5">
      {/* Table Header Controls & Search & Export */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Award size={18} className="text-admin-accent shrink-0" />
          <h3 className="text-admin-sm font-bold text-admin-text">
            Staff Performance Metrics Table
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-subtle" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search staff name, role..."
              className={`${fieldCls} pl-8 w-full`}
            />
          </div>

          {/* Column Toggle Button */}
          <button
            type="button"
            onClick={() => setShowColumnToggle(prev => !prev)}
            className="h-8 px-2.5 rounded-admin-sm border border-admin-border bg-admin-bg hover:bg-admin-surface text-admin-xs font-semibold text-admin-muted flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            <span>Columns</span>
          </button>

          {/* Export CSV */}
          <AdminButton
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={() => exportStaffPerformanceCsv(sorted)}
            className="h-8 text-admin-xs"
          >
            CSV
          </AdminButton>

          {/* Export PDF */}
          <AdminButton
            variant="ghost"
            size="sm"
            icon={FileText}
            onClick={() => exportStaffPerformancePdf(sorted)}
            className="h-8 text-admin-xs"
          >
            PDF / Print
          </AdminButton>
        </div>
      </div>

      {/* Column Visibility Selector Panel */}
      {showColumnToggle && (
        <div className="p-3 bg-admin-bg border border-admin-border rounded-admin-sm grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-admin-xs font-bold text-admin-text">
          {Object.keys(visibleCols).map(colKey => (
            <label key={colKey} className="flex items-center gap-1.5 cursor-pointer capitalize">
              <input
                type="checkbox"
                checked={(visibleCols as any)[colKey]}
                onChange={e =>
                  setVisibleCols(prev => ({ ...prev, [colKey]: e.target.checked }))
                }
                className="rounded text-admin-accent focus:ring-admin-accent"
              />
              <span>{colKey}</span>
            </label>
          ))}
        </div>
      )}

      {/* Scrollable Data Table */}
      <div className="overflow-x-auto border border-admin-border rounded-admin-sm">
        <table className="w-full text-left text-admin-xs border-collapse">
          <thead className="bg-admin-surface-2 border-b border-admin-border font-bold text-admin-subtle uppercase tracking-wider">
            <tr>
              <th className="p-2.5 cursor-pointer" onClick={() => toggleSort("name")}>Staff Member</th>
              {visibleCols.role && <th className="p-2.5 cursor-pointer" onClick={() => toggleSort("role")}>Role</th>}
              {visibleCols.totalLeads && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("totalLeads")}>Leads</th>}
              {visibleCols.newLeads && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("newLeads")}>New</th>}
              {visibleCols.contacted && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("contactedLeads")}>Contacted</th>}
              {visibleCols.calls && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("callsCount")}>Calls</th>}
              {visibleCols.chats && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("chatsCount")}>Chats</th>}
              {visibleCols.followUps && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("followUpsCount")}>Follow-ups</th>}
              {visibleCols.login && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("loginLeads")}>Login</th>}
              {visibleCols.sanction && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("sanctionLeads")}>Sanction</th>}
              {visibleCols.disbursed && <th className="p-2.5 text-center cursor-pointer text-emerald-600" onClick={() => toggleSort("disbursedLeads")}>Disbursed</th>}
              {visibleCols.rejected && <th className="p-2.5 text-center cursor-pointer text-red-600" onClick={() => toggleSort("rejectedLeads")}>Rejected</th>}
              {visibleCols.conversion && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("conversionRate")}>Conversion %</th>}
              {visibleCols.disbursement && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("disbursementRate")}>Disbursed %</th>}
              {visibleCols.score && <th className="p-2.5 text-center cursor-pointer" onClick={() => toggleSort("performanceScore")}>Score</th>}
              {visibleCols.actions && <th className="p-2.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border font-medium text-admin-text">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={16} className="p-6 text-center text-admin-muted font-bold">
                  No staff performance records found.
                </td>
              </tr>
            ) : (
              paginated.map(m => (
                <tr
                  key={m.id}
                  onClick={() => onSelectStaff(m)}
                  className="hover:bg-admin-accent-soft/40 cursor-pointer transition-colors"
                >
                  <td className="p-2.5 font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-admin-accent-soft text-admin-accent flex items-center justify-center text-[10px] font-bold uppercase">
                      {m.name.substring(0, 2)}
                    </span>
                    <span>{m.name}</span>
                  </td>
                  {visibleCols.role && <td className="p-2.5 text-admin-muted">{m.role}</td>}
                  {visibleCols.totalLeads && <td className="p-2.5 text-center font-bold">{m.totalLeads}</td>}
                  {visibleCols.newLeads && <td className="p-2.5 text-center text-admin-muted">{m.newLeads}</td>}
                  {visibleCols.contacted && <td className="p-2.5 text-center text-admin-muted">{m.contactedLeads}</td>}
                  {visibleCols.calls && <td className="p-2.5 text-center text-indigo-600 font-bold">{m.callsCount}</td>}
                  {visibleCols.chats && <td className="p-2.5 text-center text-emerald-600 font-bold">{m.chatsCount}</td>}
                  {visibleCols.followUps && <td className="p-2.5 text-center text-amber-600 font-bold">{m.followUpsCount}</td>}
                  {visibleCols.login && <td className="p-2.5 text-center">{m.loginLeads}</td>}
                  {visibleCols.sanction && <td className="p-2.5 text-center">{m.sanctionLeads}</td>}
                  {visibleCols.disbursed && <td className="p-2.5 text-center text-emerald-600 font-bold">{m.disbursedLeads}</td>}
                  {visibleCols.rejected && <td className="p-2.5 text-center text-red-600 font-bold">{m.rejectedLeads}</td>}
                  {visibleCols.conversion && (
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-bold">
                        {m.conversionRate}%
                      </span>
                    </td>
                  )}
                  {visibleCols.disbursement && (
                    <td className="p-2.5 text-center font-bold text-admin-muted">
                      {m.disbursementRate}%
                    </td>
                  )}
                  {visibleCols.score && (
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-black text-xs ${
                        m.performanceScore >= 75
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200"
                          : m.performanceScore >= 40
                          ? "bg-amber-500/10 text-amber-600 border border-amber-200"
                          : "bg-red-500/10 text-red-600 border border-red-200"
                      }`}>
                        {m.performanceScore}/100
                      </span>
                    </td>
                  )}
                  {visibleCols.actions && (
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          onSelectStaff(m)
                        }}
                        className="px-2.5 py-1 rounded bg-admin-accent text-white text-admin-2xs font-bold hover:bg-admin-accent/90 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky Bottom Pagination Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-admin border border-admin-border bg-admin-surface/95 backdrop-blur-sm text-admin-xs text-admin-muted sticky bottom-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="h-8 px-2 rounded-admin-sm border border-admin-border bg-admin-bg font-bold text-admin-text outline-none"
          >
            {[10, 25, 50, 100].map(sz => (
              <option key={sz} value={sz}>{sz}</option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="font-semibold text-admin-text text-center">
          Showing {sorted.length > 0 ? firstIndex + 1 : 0} to {lastIndex} of {sorted.length} entries
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded-admin-sm border border-admin-border bg-admin-bg hover:bg-admin-surface disabled:opacity-40 font-semibold cursor-pointer"
          >
            Prev
          </button>
          <span className="px-2 text-admin-text font-bold">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 rounded-admin-sm border border-admin-border bg-admin-bg hover:bg-admin-surface disabled:opacity-40 font-semibold cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
