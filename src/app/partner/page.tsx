"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  IndianRupee,
  Activity,
  ArrowUpRight,
  Plus
} from "lucide-react"
import Link from "next/link"

export default function PartnerDashboard() {
  const { user, profile } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "leads"),
      where("partnerId", "==", user.uid)
      // orderBy("createdAt", "desc") // Requires compound index, omitting for now to avoid error
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Sort client side since we omitted orderBy
      data.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || 0
        const tB = b.createdAt?.toMillis?.() || 0
        return tB - tA
      })
      setLeads(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Calculate Metrics
  const totalLeads = leads.length
  const approved = leads.filter(l => l.status === "Approved" || l.status === "Sanctioned").length
  const disbursed = leads.filter(l => l.status === "Disbursed").length
  const underProcess = leads.filter(l => l.status === "Under Process" || l.status === "Documents Pending" || l.status === "Login to Bank").length
  const rejected = leads.filter(l => l.status === "Rejected" || l.status === "Not Interested").length
  
  const totalBusiness = leads
    .filter(l => l.status === "Disbursed")
    .reduce((sum, l) => sum + parseInt(l.amount || "0"), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="bg-primary rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Welcome back, {profile?.name || "Partner"}! 👋</h2>
            <p className="text-white/80 font-medium text-sm mt-1">Here is what's happening with your business today.</p>
          </div>
          <Link 
            href="/partner/leads/new"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            <Plus size={18} /> Add New Lead
          </Link>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
            <Users size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Leads</p>
          <p className="text-2xl font-black text-secondary">{totalLeads}</p>
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Disbursed</p>
          <p className="text-2xl font-black text-secondary">{disbursed}</p>
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
            <Clock size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Process</p>
          <p className="text-2xl font-black text-secondary">{underProcess}</p>
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <IndianRupee size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Business</p>
          <p className="text-xl font-black text-primary">₹{(totalBusiness / 100000).toFixed(2)}L</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-secondary flex items-center gap-2">
            <Activity className="text-primary" size={20} /> Recent Leads
          </h3>
          <Link href="/partner/leads" className="text-xs font-bold text-primary hover:underline">View All</Link>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-sm font-bold text-slate-400">You haven't added any leads yet.</p>
            <Link href="/partner/leads/new" className="inline-block mt-4 text-sm font-bold text-primary">Start Adding Leads &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.slice(0, 5).map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-secondary">
                    {lead.name?.[0] || "L"}
                  </div>
                  <div>
                    <p className="text-sm font-black text-secondary">{lead.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                      {lead.type} • ₹{parseInt(lead.amount || "0").toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    lead.status === 'Disbursed' || lead.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    lead.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {lead.status || 'New'}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">
                    {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString('en-GB') : 'Just now'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
