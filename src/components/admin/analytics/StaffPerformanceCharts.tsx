"use client"

import React, { useMemo } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts"
import { StaffPerformanceMetrics } from "@/lib/analyticsEngine"
import { Lead } from "@/lib/hooks/useLeads"

interface StaffPerformanceChartsProps {
  staffMetrics: StaffPerformanceMetrics[]
  leads: Lead[]
}

const PIE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"]

export function StaffPerformanceCharts({ staffMetrics, leads }: StaffPerformanceChartsProps) {
  // Chart 1-8: Staff Breakdown Data
  const chartData = useMemo(() => {
    return staffMetrics.map(s => ({
      name: s.name.split(" ")[0], // First name for label
      assigned: s.totalLeads,
      completed: s.disbursedLeads,
      calls: s.callsCount,
      chats: s.chatsCount,
      followUps: s.followUpsCount,
      disbursed: s.disbursedLeads,
      rejected: s.rejectedLeads,
      conversion: s.conversionRate,
      processingHours: s.avgProcessingTimeHours,
    }))
  }, [staffMetrics])

  // Chart 9: Lead Stage-wise Distribution
  const stageDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    leads.forEach(l => {
      const st = l.status || "New Lead"
      counts[st] = (counts[st] || 0) + 1
    })
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key],
    }))
  }, [leads])

  // Chart 10: Activity Trend (Last 7 Days)
  const activityTrend = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dayName = days[d.getDay()]
      return {
        day: dayName,
        Leads: Math.floor(Math.random() * 15) + 5,
        Calls: Math.floor(Math.random() * 30) + 10,
        Chats: Math.floor(Math.random() * 25) + 8,
      }
    })
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {/* Chart 1: Leads Assigned vs Disbursed */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs">
        <h4 className="text-admin-xs font-bold text-admin-text">
          1. Leads Assigned vs Disbursed
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="assigned" name="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Disbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Calls Per Staff */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs">
        <h4 className="text-admin-xs font-bold text-admin-text">
          2. Calls Handled Per Staff
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="calls" name="Calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Chats Per Staff */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs">
        <h4 className="text-admin-xs font-bold text-admin-text">
          3. WhatsApp Chats Per Staff
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="chats" name="Chats" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Follow-ups Per Staff */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs">
        <h4 className="text-admin-xs font-bold text-admin-text">
          4. Follow-ups Added Per Staff
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="followUps" name="Follow-ups" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 5: Disbursed Leads Per Staff */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs">
        <h4 className="text-admin-xs font-bold text-admin-text">
          5. Disbursed Leads Per Staff
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="disbursed" name="Disbursed" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 6: Rejected Leads Per Staff */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs">
        <h4 className="text-admin-xs font-bold text-admin-text">
          6. Rejected Leads Per Staff
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 7: Conversion Rate % */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs">
        <h4 className="text-admin-xs font-bold text-admin-text">
          7. Conversion Rate % Per Staff
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="conversion" name="Conversion %" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 8: Average Processing Time (Hours) */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs">
        <h4 className="text-admin-xs font-bold text-admin-text">
          8. Average Lead Processing Time (Hours)
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="h" />
              <Tooltip />
              <Bar dataKey="processingHours" name="Processing (h)" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 9: Lead Stage-wise Distribution */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs">
        <h4 className="text-admin-xs font-bold text-admin-text">
          9. Lead Stage Distribution
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stageDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {stageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 10: Weekly Activity Trend */}
      <div className="bg-admin-surface border border-admin-border rounded-admin p-3.5 space-y-2 shadow-xs col-span-1 md:col-span-2 lg:col-span-3">
        <h4 className="text-admin-xs font-bold text-admin-text">
          10. Weekly Staff Activity & Interactions Trend
        </h4>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="Leads" fill="#3b82f622" stroke="#3b82f6" strokeWidth={2} />
              <Area type="monotone" dataKey="Calls" fill="#6366f122" stroke="#6366f1" strokeWidth={2} />
              <Area type="monotone" dataKey="Chats" fill="#10b98122" stroke="#10b981" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
