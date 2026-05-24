"use client"

import React, { useState } from "react"
import { useLeads } from "@/lib/hooks/useLeads"
import { 
  IndianRupee, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Download,
  Calendar,
  Search,
  ChevronDown
} from "lucide-react"

export default function PayoutsPage() {
  const { leads, loading } = useLeads()
  const [searchTerm, setSearchTerm] = useState("")

  // Filter for disbursed leads (Converted) as they generate payouts
  const disbursedLeads = leads.filter(l => l.status === 'Converted')

  const totalDisbursed = disbursedLeads.reduce((acc, curr) => acc + parseInt(curr.amount || "0"), 0)
  const totalCommission = totalDisbursed * 0.02 // Mock 2% commission
  const pendingPayouts = totalCommission * 0.4 // Mock 40% pending

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Commissions & Payouts</h2>
          <p className="text-slate-500 font-medium tracking-tight">Track revenue share and agent commissions across all branches.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-secondary rounded-2xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Finance KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-colors" />
          <div className="relative z-10">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
              <TrendingUp size={24} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Commission Earned</p>
            <h3 className="text-3xl font-black text-secondary tracking-tight">₹ {totalCommission.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
              <ArrowUpRight size={14} /> 12.5% vs last month
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-50 rounded-full blur-3xl group-hover:bg-amber-100 transition-colors" />
          <div className="relative z-10">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
              <Clock size={24} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pending Partner Payouts</p>
            <h3 className="text-3xl font-black text-secondary tracking-tight">₹ {pendingPayouts.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-amber-500 mt-2 flex items-center gap-1">
              Next cycle: 15th July
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors" />
          <div className="relative z-10">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
              <Wallet size={24} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Loan Disbursement</p>
            <h3 className="text-3xl font-black text-secondary tracking-tight">₹ {(totalDisbursed/100000).toFixed(1)}L</h3>
            <p className="text-[10px] font-bold text-blue-500 mt-2">Volume across {disbursedLeads.length} cases</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-black text-secondary">Commission Breakdown</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search agent or lead..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
              <Calendar size={16} />
              <span>This Month</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent / Branch</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Disbursed Amt</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {disbursedLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">No disbursement records found.</td>
                </tr>
              ) : disbursedLeads.map((lead, i) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-secondary text-sm">{lead.assignedToName || 'Direct'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{lead.branch || 'Head Office'}</p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="font-bold text-secondary text-sm">{lead.name}</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{lead.type}</p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="font-bold text-secondary text-sm italic">₹ {parseInt(lead.amount || "0").toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="font-black text-emerald-600 text-sm italic">₹ {(parseInt(lead.amount || "0") * 0.02).toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">2.0% Slab</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 inline-flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
