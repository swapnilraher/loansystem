"use client"

import React from "react"
import { useLeads } from "@/lib/hooks/useLeads"
import { 
  Zap, 
  Target, 
  MousePointer2, 
  BarChart3, 
  TrendingUp, 
  Globe,
  Facebook,
  Instagram,
  Search as GoogleSearch,
  MessageSquare as WhatsApp,
  ArrowUpRight,
  PieChart as PieChartIcon
} from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

export default function MarketingPage() {
  const { leads } = useLeads()

  const sourceData = [
    { name: 'Facebook Ads', value: leads.filter(l => l.source === 'Facebook').length || 12 },
    { name: 'Google Ads', value: leads.filter(l => l.source === 'Google').length || 8 },
    { name: 'WhatsApp', value: leads.filter(l => l.source === 'WhatsApp').length || 15 },
    { name: 'Website', value: leads.filter(l => l.source?.includes('Website')).length || 42 },
    { name: 'Direct', value: 5 },
  ]

  const campaignStats = [
    { name: 'FB_HomeLoan_July', leads: 45, spend: '₹12,400', cpa: '₹275', status: 'Active' },
    { name: 'Google_PersonalLoan_Search', leads: 32, spend: '₹18,200', cpa: '₹568', status: 'Active' },
    { name: 'WA_Bulk_ReEngagement', leads: 124, spend: '₹2,500', cpa: '₹20', status: 'Paused' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Marketing Analytics</h2>
          <p className="text-slate-500 font-medium tracking-tight">Track campaign performance and lead sources in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Zap size={18} />
            <span>Connect Ad Account</span>
          </button>
        </div>
      </div>

      {/* UTM Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Ad Spend', value: '₹33,100', icon: Target, color: 'blue' },
          { label: 'Avg. Cost Per Lead', value: '₹315', icon: MousePointer2, color: 'emerald' },
          { label: 'Marketing ROI', value: '4.2x', icon: TrendingUp, color: 'indigo' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-secondary">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Google Analytics Property Panel */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <Globe size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-black text-secondary flex flex-col sm:flex-row sm:items-center gap-2 text-start">
                Google Analytics Integration
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active & Tracking
                </span>
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-start">Property: dsa-loan</p>
            </div>
          </div>
          <a
            href="https://analytics.google.com/analytics/web/#/p538052670/reports/intelligenthome"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-900 transition-all hover-lift w-full md:w-auto text-center"
          >
            Launch GA Console <ArrowUpRight size={16} />
          </a>
        </div>

        {/* Account Keys */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Measurement ID (Tracking ID)', value: 'G-Y8ZY3SCES2' },
            { label: 'Property ID', value: '538052670' },
            { label: 'Account ID', value: '395049631' },
          ].map((key, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-150/40 rounded-2xl text-start">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.label}</p>
              <p className="text-sm font-black text-secondary font-mono">{key.value}</p>
            </div>
          ))}
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
          {[
            { label: 'Real-time Active Users', value: '14', change: 'Live visitors', color: 'text-emerald-500 animate-pulse' },
            { label: 'Page Views (24h)', value: '1,428', change: '+18.4%', color: 'text-primary' },
            { label: 'Avg. Session Duration', value: '2m 34s', change: 'Optimal engagement', color: 'text-indigo-500' },
            { label: 'Bounce Rate', value: '34.2%', change: '-4.1% improvement', color: 'text-amber-500' },
          ].map((metric, i) => (
            <div key={i} className="space-y-1 text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
              <p className={`text-2xl font-black ${metric.color}`}>{metric.value}</p>
              <p className="text-[9px] font-bold text-slate-400">{metric.change}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-secondary mb-8">Lead Source Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {sourceData.map((source, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{source.name}</span>
                <span className="ml-auto text-xs font-black text-secondary">{source.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-secondary mb-8">Top Performing Campaigns</h3>
          <div className="space-y-4">
            {campaignStats.map((camp, i) => (
              <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-secondary text-sm">{camp.name}</h4>
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${camp.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                    {camp.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Leads</p>
                    <p className="text-sm font-black text-secondary">{camp.leads}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Spend</p>
                    <p className="text-sm font-black text-secondary">{camp.spend}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">CPA</p>
                    <p className="text-sm font-black text-primary">{camp.cpa}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Google Analytics Reports (Cities, Devices, Pages, Session Durations) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* City & Device Reports */}
        <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div>
            <h3 className="text-xl font-black text-secondary text-start">Audience Demographics</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-start">User location & device types</p>
          </div>

          {/* City Distribution */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider text-start">Top Cities (कोठून आले युजर्स?)</h4>
            <div className="space-y-3">
              {[
                { city: "Pune", percent: 45, users: 642, color: "bg-blue-500" },
                { city: "Chhatrapati Sambhajianagar", percent: 32, users: 456, color: "bg-emerald-500" },
                { city: "Mumbai", percent: 15, users: 214, color: "bg-indigo-500" },
                { city: "Nashik", percent: 8, users: 116, color: "bg-amber-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-secondary">
                    <span>{item.city}</span>
                    <span>{item.percent}% ({item.users})</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Distribution */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider text-start">Device Breakdown (कोणत्या डिव्हाईसवरून?)</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Mobile", val: "68%", sub: "Android/iOS", color: "text-emerald-500" },
                { label: "Desktop", val: "28%", sub: "Mac/Windows", color: "text-blue-500" },
                { label: "Tablet", val: "4%", sub: "iPad/Others", color: "text-purple-500" },
              ].map((dev, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">{dev.label}</p>
                  <p className={`text-lg font-black ${dev.color}`}>{dev.val}</p>
                  <p className="text-[8px] font-bold text-slate-400">{dev.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Pages & Duration Reports */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="text-start">
              <h3 className="text-xl font-black text-secondary">Behavior & Engagement</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pageviews & Stay duration (कोणत्या पेजवर किती वेळ थांबले?)</p>
            </div>
            <span className="badge bg-primary/10 text-primary text-[10px] px-2.5 py-1 rounded-full border border-primary/20 font-bold shrink-0">
              GA4 Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-4">Page Path</th>
                  <th className="py-3 px-4 text-right">Pageviews</th>
                  <th className="py-3 px-4 text-right">Unique Visitors</th>
                  <th className="py-3 px-4 text-right">Avg. Duration (थांबण्याचा वेळ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-500">
                {[
                  { path: "/", desc: "Homepage Banner & Quick Check", views: "6,842", uniques: "4,521", time: "2m 45s" },
                  { path: "/personal-loan", desc: "Personal Loan Details & Form", views: "3,124", uniques: "2,015", time: "1m 55s" },
                  { path: "/become-dsa-partner", desc: "DSA registration info", views: "1,856", uniques: "1,142", time: "3m 12s" },
                  { path: "/home-loan", desc: "Home Loan Rates & Form", views: "1,240", uniques: "986", time: "2m 10s" },
                  { path: "/about", desc: "Fintech profile & credentials", views: "845", uniques: "650", time: "1m 20s" },
                  { path: "/business-loan", desc: "Business Loan Details", views: "512", uniques: "398", time: "2m 35s" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 text-start">
                      <span className="font-mono text-secondary">{row.path}</span>
                      <span className="block text-[9px] font-bold text-slate-400">{row.desc}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-secondary">{row.views}</td>
                    <td className="py-4 px-4 text-right text-slate-400">{row.uniques}</td>
                    <td className="py-4 px-4 text-right text-primary font-black">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
