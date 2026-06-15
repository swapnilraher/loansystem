"use client"

import React from "react"
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Calendar, 
  Filter, 
  PieChart, 
  BarChart3,
  CreditCard,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'

const revenueData = [
  { name: 'Week 1', revenue: 120000 },
  { name: 'Week 2', revenue: 190000 },
  { name: 'Week 3', revenue: 150000 },
  { name: 'Week 4', revenue: 210000 },
  { name: 'Week 5', revenue: 240000 },
  { name: 'Week 6', revenue: 180000 },
]

const channelData = [
  { name: 'Home Loan', value: 400 },
  { name: 'Personal Loan', value: 300 },
  { name: 'Business Loan', value: 200 },
  { name: 'Others', value: 100 },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

const reportTemplates = [
  { name: "Monthly Revenue Report", lastGenerated: "Oct 01, 2026", size: "2.4 MB", type: "PDF" },
  { name: "Lead Conversion Summary", lastGenerated: "Oct 15, 2026", size: "1.1 MB", type: "XLSX" },
  { name: "Agent Performance Audit", lastGenerated: "Sep 30, 2026", size: "4.8 MB", type: "PDF" },
  { name: "Quarterly Financial Statement", lastGenerated: "Jul 01, 2026", size: "12.2 MB", type: "PDF" },
]

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Revenue & Reports</h2>
          <p className="text-slate-500 font-medium">Analyze your business performance and export detailed data.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <FileText size={18} />
            <span>Generate Custom Report</span>
          </button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Monthly Revenue</p>
            <h3 className="text-4xl font-black text-secondary mb-4">₹42.50L</h3>
            <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
              <ArrowUpRight size={18} />
              <span>+14.2%</span>
              <span className="text-slate-400 font-bold ml-1">vs last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Commission Earned</p>
            <h3 className="text-4xl font-black text-secondary mb-4">₹8.12L</h3>
            <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
              <ArrowUpRight size={18} />
              <span>+6.5%</span>
              <span className="text-slate-400 font-bold ml-1">vs last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Projected Revenue</p>
            <h3 className="text-4xl font-black text-secondary mb-4">₹55.00L</h3>
            <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
              <ArrowDownRight size={18} />
              <span>-2.1%</span>
              <span className="text-slate-400 font-bold ml-1">forecast adjustment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Growth Chart */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-secondary">Revenue Growth</h3>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
              <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-xs font-black text-primary">Revenue</button>
              <button className="px-4 py-1.5 text-xs font-bold text-slate-500">Expenses</button>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <ReTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Product */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-secondary mb-8">Revenue by Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {channelData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-xs font-bold text-secondary">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-primary">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export Reports */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-secondary">Export & Downloads</h3>
          <button className="text-primary text-sm font-bold hover:underline">View All Files</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportTemplates.map((report, i) => (
            <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary mb-4 shadow-sm transition-colors">
                <FileText size={24} />
              </div>
              <h4 className="font-bold text-secondary text-sm mb-1">{report.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-6">{report.lastGenerated} • {report.size}</p>
              <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2">
                <Download size={14} /> Download {report.type}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
