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
    </div>
  )
}
