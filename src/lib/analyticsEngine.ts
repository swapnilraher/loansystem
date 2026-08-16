import { Lead } from "@/lib/hooks/useLeads"
import { AdminUser } from "@/lib/hooks/useUsers"
import { STATUS_DISBURSED, STATUS_PENDING_APPROVAL } from "@/lib/disbursement"
import { ownsLead, viewerIdentity } from "@/lib/permissions"
import { startOfDay, endOfDay, toMillis } from "@/lib/dates"

export interface AnalyticsFilterState {
  datePreset: string // "All Time" | "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "This Month" | "Last Month" | "Custom Date"
  startDate?: string
  endDate?: string
  staffId?: string
  role?: string
  source?: string
  loanType?: string
  state?: string
  district?: string
  city?: string
  status?: string
  stage?: string
  assignedState?: "all" | "assigned" | "unassigned"
  disbursementState?: "all" | "disbursed" | "rejected"
  porterUser?: string
}

export const INITIAL_ANALYTICS_FILTERS: AnalyticsFilterState = {
  datePreset: "All Time",
  startDate: "",
  endDate: "",
  staffId: "",
  role: "",
  source: "",
  loanType: "",
  state: "",
  district: "",
  city: "",
  status: "",
  stage: "",
  assignedState: "all",
  disbursementState: "all",
  porterUser: "",
}

export interface KpiSummary {
  totalStaff: number
  activeStaff: number
  totalAssignedLeads: number
  newLeads: number
  inProgressLeads: number
  followUpLeads: number
  loginLeads: number
  sanctionLeads: number
  disbursedLeads: number
  rejectedLeads: number
  totalCalls: number
  connectedCalls: number
  totalChats: number
  totalFollowUps: number
  totalStatusUpdates: number
  overallConversionRate: number
  overallDisbursementRate: number
}

export interface StaffPerformanceMetrics {
  id: string
  name: string
  email: string
  role: string
  phone: string
  status: string
  totalLeads: number
  newLeads: number
  contactedLeads: number
  followUpsCount: number
  callsCount: number
  connectedCallsCount: number
  chatsCount: number
  statusUpdatesCount: number
  documentsCollectedCount: number
  loginLeads: number
  sanctionLeads: number
  disbursedLeads: number
  rejectedLeads: number
  disbursedVolume: number
  conversionRate: number
  disbursementRate: number
  avgResponseTimeMin: number
  avgStageTimeHours: number
  avgProcessingTimeHours: number
  lastActivityTime: string
  performanceScore: number
}

// 1. Date Range Evaluator
export function isWithinDateRange(timestamp: any, filter: AnalyticsFilterState): boolean {
  if (filter.datePreset === "All Time") return true
  const ms = toMillis(timestamp)
  if (!ms) return false

  const now = new Date()
  let startMs = 0
  let endMs = Date.now()

  if (filter.datePreset === "Today") {
    startMs = startOfDay(now).getTime()
    endMs = endOfDay(now).getTime()
  } else if (filter.datePreset === "Yesterday") {
    const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    startMs = startOfDay(yest).getTime()
    endMs = endOfDay(yest).getTime()
  } else if (filter.datePreset === "Last 7 Days") {
    startMs = now.getTime() - 7 * 24 * 60 * 60 * 1000
  } else if (filter.datePreset === "Last 30 Days") {
    startMs = now.getTime() - 30 * 24 * 60 * 60 * 1000
  } else if (filter.datePreset === "This Month") {
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    startMs = startMonth.getTime()
  } else if (filter.datePreset === "Last Month") {
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    startMs = startLastMonth.getTime()
    endMs = endLastMonth.getTime()
  } else if (filter.datePreset === "Custom Date" && filter.startDate && filter.endDate) {
    startMs = new Date(filter.startDate).getTime()
    endMs = new Date(filter.endDate).getTime() + 24 * 60 * 60 * 1000 - 1
  }

  return ms >= startMs && ms <= endMs
}

// 2. Filter Leads Function
export function filterLeads(leads: Lead[], filter: AnalyticsFilterState): Lead[] {
  return leads.filter(lead => {
    // Date filter
    if (!isWithinDateRange(lead.createdAt || lead.date, filter)) return false

    // Staff filter
    if (filter.staffId) {
      const matchStaff =
        lead.assignedTo === filter.staffId ||
        lead.assignedToName?.toLowerCase().includes(filter.staffId.toLowerCase())
      if (!matchStaff) return false
    }

    // Source filter
    if (filter.source && filter.source !== "All Sources") {
      const src = (lead.source || "").toLowerCase()
      if (!src.includes(filter.source.toLowerCase())) return false
    }

    // Loan Type filter
    if (filter.loanType && filter.loanType !== "All Types") {
      const t = (lead.type || "").toLowerCase()
      if (!t.includes(filter.loanType.toLowerCase())) return false
    }

    // State filter
    if (filter.state && lead.state && lead.state.toLowerCase() !== filter.state.toLowerCase()) {
      return false
    }

    // City / District filter
    if (filter.city && lead.city && lead.city.toLowerCase() !== filter.city.toLowerCase()) {
      return false
    }

    // Status filter
    if (filter.status && filter.status !== "All Statuses") {
      if (lead.status !== filter.status) return false
    }

    // Assigned State
    if (filter.assignedState === "assigned" && !lead.assignedTo) return false
    if (filter.assignedState === "unassigned" && lead.assignedTo) return false

    // Disbursement State
    if (filter.disbursementState === "disbursed" && lead.status !== STATUS_DISBURSED) return false
    if (filter.disbursementState === "rejected" && lead.status !== "Rejected") return false

    // Porter User filter
    if (filter.porterUser) {
      const porterMatch =
        (lead as any).porterUserId === filter.porterUser ||
        (lead as any).porterUserName?.toLowerCase().includes(filter.porterUser.toLowerCase()) ||
        lead.source?.toLowerCase().includes("porter")
      if (!porterMatch) return false
    }

    return true
  })
}

// 3. Performance Score Weight Formula (0-100)
export function calculatePerformanceScore(metrics: {
  conversionRate: number
  disbursementRate: number
  callsCount: number
  chatsCount: number
  followUpsCount: number
  statusUpdatesCount: number
  avgResponseTimeMin: number
}): number {
  // Conversion weight: 30%
  const conversionPart = Math.min(metrics.conversionRate * 0.3, 30)

  // Disbursement weight: 25%
  const disbursementPart = Math.min(metrics.disbursementRate * 0.25, 25)

  // Activity weight (Calls, Chats, Follow-ups): 25%
  const totalActions = metrics.callsCount + metrics.chatsCount + metrics.followUpsCount + metrics.statusUpdatesCount
  const actionPart = Math.min((totalActions / 50) * 25, 25)

  // Response Time Speed weight: 20%
  // < 15 min = 20 pts, < 60 min = 15 pts, < 180 min = 10 pts, else 5 pts
  let speedPart = 10
  if (metrics.avgResponseTimeMin > 0) {
    if (metrics.avgResponseTimeMin <= 15) speedPart = 20
    else if (metrics.avgResponseTimeMin <= 60) speedPart = 15
    else if (metrics.avgResponseTimeMin <= 180) speedPart = 10
    else speedPart = 5
  }

  return Math.round(conversionPart + disbursementPart + actionPart + speedPart)
}

// 4. Calculate Staff Metrics Array
export function computeStaffMetrics(
  staffList: AdminUser[],
  leads: Lead[],
  activities: any[],
  filter: AnalyticsFilterState
): StaffPerformanceMetrics[] {
  const filtered = filterLeads(leads, filter)

  return staffList.map(member => {
    const memberName = member.name.trim().toLowerCase()
    const memberIds = [member.id, member.uid].filter(Boolean)

    // Leads assigned to this staff member
    const memberLeads = filtered.filter(lead => {
      if (lead.assignedTo && memberIds.includes(lead.assignedTo)) return true
      if (lead.assignedToName && lead.assignedToName.trim().toLowerCase() === memberName) return true
      return false
    })

    const totalLeads = memberLeads.length
    const newLeads = memberLeads.filter(l => l.status === "New Lead" || l.status === "New").length
    const contactedLeads = memberLeads.filter(l => l.status === "Contacted").length
    const loginLeads = memberLeads.filter(l => l.status === "Bank Processing" || l.status === "Login").length
    const sanctionLeads = memberLeads.filter(l => l.status === STATUS_PENDING_APPROVAL || l.status === "Sanctioned").length
    const disbursedLeads = memberLeads.filter(l => l.status === STATUS_DISBURSED).length
    const rejectedLeads = memberLeads.filter(l => l.status === "Rejected").length

    const disbursedVolume = memberLeads
      .filter(l => l.status === STATUS_DISBURSED)
      .reduce((sum, l) => sum + (Number(l.disbursedAmount) || Number(l.amount) || 0), 0)

    // Activities by this staff member
    const memberActivities = activities.filter(act => {
      const actUser = (act.userName || act.staffName || "").trim().toLowerCase()
      if (actUser && actUser.includes(memberName)) return true
      if (act.staffId && memberIds.includes(act.staffId)) return true
      return false
    })

    const callsCount = memberActivities.filter(a => a.type === "Call" || (a.details || "").toLowerCase().includes("call")).length
    const connectedCallsCount = memberActivities.filter(
      a => (a.details || "").toLowerCase().includes("connected") || (a.status || "").toLowerCase().includes("connected")
    ).length
    const chatsCount = memberActivities.filter(a => a.type === "Chat" || (a.details || "").toLowerCase().includes("whatsapp")).length
    const followUpsCount = memberActivities.filter(a => a.type === "FollowUp" || (a.details || "").toLowerCase().includes("follow")).length
    const statusUpdatesCount = memberActivities.filter(a => a.type === "Status Update" || (a.details || "").toLowerCase().includes("status")).length
    const documentsCollectedCount = memberActivities.filter(a => (a.details || "").toLowerCase().includes("doc")).length

    // Conversion & Disbursement rates
    const conversionRate = totalLeads > 0 ? Math.round((disbursedLeads / totalLeads) * 100) : 0
    const disbursementRate = loginLeads > 0 ? Math.round((disbursedLeads / loginLeads) * 100) : 0

    // Timing averages
    const avgResponseTimeMin = 25 // Default estimated response time in minutes
    const avgStageTimeHours = 12 // Default stage duration in hours
    const avgProcessingTimeHours = 48 // Default total lead processing duration

    // Last activity timestamp
    let lastActivityTime = "—"
    if (memberActivities.length > 0) {
      const latest = memberActivities.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp))[0]
      lastActivityTime = latest.timestamp ? new Date(toMillis(latest.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"
    }

    const performanceScore = calculatePerformanceScore({
      conversionRate,
      disbursementRate,
      callsCount,
      chatsCount,
      followUpsCount,
      statusUpdatesCount,
      avgResponseTimeMin,
    })

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role || "Staff",
      phone: member.phone || "—",
      status: member.status || "Active",
      totalLeads,
      newLeads,
      contactedLeads,
      followUpsCount,
      callsCount,
      connectedCallsCount,
      chatsCount,
      statusUpdatesCount,
      documentsCollectedCount,
      loginLeads,
      sanctionLeads,
      disbursedLeads,
      rejectedLeads,
      disbursedVolume,
      conversionRate,
      disbursementRate,
      avgResponseTimeMin,
      avgStageTimeHours,
      avgProcessingTimeHours,
      lastActivityTime,
      performanceScore,
    }
  })
}

// 5. Compute Top-Level KPI Summary
export function computeKpiSummary(
  staffList: AdminUser[],
  leads: Lead[],
  activities: any[],
  filter: AnalyticsFilterState
): KpiSummary {
  const filtered = filterLeads(leads, filter)
  const staffMetrics = computeStaffMetrics(staffList, leads, activities, filter)

  const activeStaff = staffList.filter(s => s.status !== "Inactive").length
  const totalAssigned = filtered.filter(l => l.assignedTo).length

  const newLeads = filtered.filter(l => l.status === "New Lead" || l.status === "New").length
  const inProgressLeads = filtered.filter(l => ["Contacted", "Interested", "Bank Processing"].includes(l.status)).length
  const followUpLeads = filtered.filter(l => l.status === "Interested" || l.status === "Contacted").length
  const loginLeads = filtered.filter(l => l.status === "Bank Processing" || l.status === "Login").length
  const sanctionLeads = filtered.filter(l => l.status === STATUS_PENDING_APPROVAL || l.status === "Sanctioned").length
  const disbursedLeads = filtered.filter(l => l.status === STATUS_DISBURSED).length
  const rejectedLeads = filtered.filter(l => l.status === "Rejected").length

  const totalCalls = staffMetrics.reduce((sum, s) => sum + s.callsCount, 0)
  const connectedCalls = staffMetrics.reduce((sum, s) => sum + s.connectedCallsCount, 0)
  const totalChats = staffMetrics.reduce((sum, s) => sum + s.chatsCount, 0)
  const totalFollowUps = staffMetrics.reduce((sum, s) => sum + s.followUpsCount, 0)
  const totalStatusUpdates = staffMetrics.reduce((sum, s) => sum + s.statusUpdatesCount, 0)

  const overallConversionRate = totalAssigned > 0 ? Math.round((disbursedLeads / totalAssigned) * 100) : 0
  const overallDisbursementRate = loginLeads > 0 ? Math.round((disbursedLeads / loginLeads) * 100) : 0

  return {
    totalStaff: staffList.length,
    activeStaff,
    totalAssignedLeads: totalAssigned,
    newLeads,
    inProgressLeads,
    followUpLeads,
    loginLeads,
    sanctionLeads,
    disbursedLeads,
    rejectedLeads,
    totalCalls,
    connectedCalls,
    totalChats,
    totalFollowUps,
    totalStatusUpdates,
    overallConversionRate,
    overallDisbursementRate,
  }
}

// 6. CSV Export Helper
export function exportStaffPerformanceCsv(metrics: StaffPerformanceMetrics[]) {
  const headers = [
    "Staff Name",
    "Role",
    "Total Leads",
    "New Leads",
    "Contacted",
    "Calls",
    "Connected Calls",
    "Chats",
    "Follow-ups",
    "Status Updates",
    "Login Leads",
    "Sanction Leads",
    "Disbursed Leads",
    "Rejected Leads",
    "Conversion %",
    "Disbursement %",
    "Performance Score",
  ]

  const rows = metrics.map(m => [
    `"${m.name}"`,
    `"${m.role}"`,
    m.totalLeads,
    m.newLeads,
    m.contactedLeads,
    m.callsCount,
    m.connectedCallsCount,
    m.chatsCount,
    m.followUpsCount,
    m.statusUpdatesCount,
    m.loginLeads,
    m.sanctionLeads,
    m.disbursedLeads,
    m.rejectedLeads,
    `"${m.conversionRate}%"`,
    `"${m.disbursementRate}%"`,
    m.performanceScore,
  ])

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `Staff_Performance_Report_${new Date().toISOString().split("T")[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 7. Print / PDF Export Helper
export function exportStaffPerformancePdf(metrics: StaffPerformanceMetrics[]) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const rowsHtml = metrics
    .map(
      m => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;"><b>${m.name}</b> (${m.role})</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${m.totalLeads}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${m.callsCount}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${m.chatsCount}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${m.followUpsCount}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: green;"><b>${m.disbursedLeads}</b></td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: red;">${m.rejectedLeads}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><b>${m.conversionRate}%</b></td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${m.performanceScore}/100</td>
    </tr>`
    )
    .join("")

  const html = `
    <html>
      <head>
        <title>Staff Performance Summary Report</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; color: #1e293b; }
          h2 { color: #0f172a; margin-bottom: 4px; }
          p { color: #64748b; font-size: 13px; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background: #f8fafc; padding: 10px; border: 1px solid #ddd; text-align: left; }
        </style>
      </head>
      <body>
        <h2>Staff Performance Summary Report</h2>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Assigned Leads</th>
              <th>Calls</th>
              <th>Chats</th>
              <th>Follow-ups</th>
              <th>Disbursed</th>
              <th>Rejected</th>
              <th>Conversion %</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}
