"use client"

import React, { useMemo, useState } from "react"
import { Users, TrendingUp, Search, CheckCircle2, Globe } from "lucide-react"
import { Lead } from "@/lib/hooks/useLeads"
import { AdminUser } from "@/lib/hooks/useUsers"

interface PortalAnalyticsTabProps {
  leads: Lead[]
  staffList: AdminUser[]
}

export function PorterAnalyticsTab({ leads, staffList }: PortalAnalyticsTabProps) {
  const [selectedPortalUser, setSelectedPortalUser] = useState<string>("")
  const [search, setSearch] = useState("")

  // Filter Portal Customer Leads (Website / Portal registered users)
  const portalLeads = useMemo(() => {
    return leads.filter(l => {
      const src = (l.source || "").toLowerCase()
      const isPortal = src.includes("portal") || src.includes("landing") || src.includes("website") || !!(l as any).userId
      if (!isPortal) return false

      if (selectedPortalUser) {
        const match =
          (l as any).userId === selectedPortalUser ||
          l.fullName?.toLowerCase().includes(selectedPortalUser.toLowerCase()) ||
          l.name?.toLowerCase().includes(selectedPortalUser.toLowerCase())
        if (!match) return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          l.fullName?.toLowerCase().includes(q) ||
          l.name?.toLowerCase().includes(q) ||
          l.mobileNumber?.includes(q) ||
          l.phone?.includes(q) ||
          l.city?.toLowerCase().includes(q)
        )
      }

      return true
    })
  }, [leads, selectedPortalUser, search])

  // Portal Customer Metrics Calculation
  const totalPortalLeads = portalLeads.length
  const assigned = portalLeads.filter(l => l.assignedTo).length
  const contacted = portalLeads.filter(l => l.status === "Contacted").length
  const followUp = portalLeads.filter(l => l.status === "Interested" || l.status === "Contacted").length
  const login = portalLeads.filter(l => l.status === "Bank Processing" || l.status === "Login").length
  const sanction = portalLeads.filter(l => l.status === "Pending Approval" || l.status === "Sanctioned").length
  const disbursed = portalLeads.filter(l => l.status === "Disbursed").length
  const rejected = portalLeads.filter(l => l.status === "Rejected").length

  const conversionRate = totalPortalLeads > 0 ? Math.round((disbursed / totalPortalLeads) * 100) : 0
  const disbursementRate = login > 0 ? Math.round((disbursed / login) * 100) : 0

  return (
    <div className="space-y-4">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
          <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Total Portal Customer Leads</p>
          <p className="text-admin-base font-extrabold text-admin-text mt-0.5">{totalPortalLeads}</p>
        </div>
        <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
          <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Assigned</p>
          <p className="text-admin-base font-extrabold text-indigo-600 mt-0.5">{assigned}</p>
        </div>
        <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
          <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Contacted</p>
          <p className="text-admin-base font-extrabold text-admin-text mt-0.5">{contacted}</p>
        </div>
        <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
          <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Login</p>
          <p className="text-admin-base font-extrabold text-amber-600 mt-0.5">{login}</p>
        </div>
        <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
          <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Disbursed</p>
          <p className="text-admin-base font-extrabold text-emerald-600 mt-0.5">{disbursed}</p>
        </div>
        <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
          <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Conversion %</p>
          <p className="text-admin-base font-extrabold text-emerald-600 mt-0.5">{conversionRate}%</p>
        </div>
      </div>

      {/* Filter Bar for Portal Users */}
      <div className="p-3.5 bg-admin-surface border border-admin-border rounded-admin flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Globe size={16} className="text-admin-accent shrink-0" />
          <h4 className="text-admin-xs font-bold text-admin-text">
            Portal Registered Customer Leads Analytics
          </h4>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-subtle" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search portal customer name, phone..."
              className="w-full h-8 pl-8 pr-2.5 rounded-admin-sm border border-admin-border bg-admin-bg text-admin-xs font-semibold outline-none"
            />
          </div>
        </div>
      </div>

      {/* Portal Leads Data Table */}
      <div className="bg-admin-surface border border-admin-border rounded-admin overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-admin-xs">
            <thead className="bg-admin-surface-2 border-b border-admin-border font-bold text-admin-subtle uppercase">
              <tr>
                <th className="p-2.5">Customer Name</th>
                <th className="p-2.5">Source</th>
                <th className="p-2.5">Phone</th>
                <th className="p-2.5">City</th>
                <th className="p-2.5">Assigned Staff</th>
                <th className="p-2.5">Stage / Status</th>
                <th className="p-2.5 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border font-medium text-admin-text">
              {portalLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-admin-muted font-bold">
                    No Portal Customer leads matched the criteria.
                  </td>
                </tr>
              ) : (
                portalLeads.map((l, i) => (
                  <tr key={l.id || i} className="hover:bg-admin-bg/50">
                    <td className="p-2.5 font-bold">{l.fullName || l.name || "Portal Customer"}</td>
                    <td className="p-2.5 text-indigo-600 font-bold">
                      {l.source || "Portal Website"}
                    </td>
                    <td className="p-2.5 text-admin-muted">{l.mobileNumber || l.phone || "—"}</td>
                    <td className="p-2.5">{l.city || l.district || "—"}</td>
                    <td className="p-2.5 font-bold">{l.assignedToName || "Unassigned"}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-admin-accent-soft text-admin-accent font-bold">
                        {l.status || "New Lead"}
                      </span>
                    </td>
                    <td className="p-2.5 text-right text-admin-subtle">
                      {l.createdAt ? new Date((l as any).createdAt).toLocaleDateString() : "Recently"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
