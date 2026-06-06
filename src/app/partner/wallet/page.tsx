"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  IndianRupee,
  ShieldAlert
} from "lucide-react"

export default function PartnerWallet() {
  const { user } = useAuth()
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "commission_ledger"),
      where("partnerId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      data.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || 0
        const tB = b.createdAt?.toMillis?.() || 0
        return tB - tA
      })
      setCommissions(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const totalEarned = commissions.reduce((sum, c) => sum + parseInt(c.commissionAmount || "0"), 0)
  const underSettlement = commissions.filter(c => c.status === "Under Settlement").reduce((sum, c) => sum + parseInt(c.commissionAmount || "0"), 0)
  const settled = commissions.filter(c => c.status === "Settled").reduce((sum, c) => sum + parseInt(c.commissionAmount || "0"), 0)
  const hold = commissions.filter(c => c.status === "Hold").reduce((sum, c) => sum + parseInt(c.commissionAmount || "0"), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-secondary tracking-tight">Commission Wallet</h2>
        <p className="text-slate-500 font-medium text-sm mt-1">Track your earnings and settlements.</p>
      </div>

      {/* Wallet Card */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/30 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Wallet className="text-primary" size={24} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Earned</p>
          </div>
          <h3 className="text-5xl font-black tracking-tight mb-8">₹{totalEarned.toLocaleString()}</h3>
          
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={12} /> Under Settlement</p>
              <p className="text-lg font-black text-amber-400">₹{underSettlement.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Settled</p>
              <p className="text-lg font-black text-emerald-400">₹{settled.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldAlert size={12} /> Hold</p>
              <p className="text-lg font-black text-rose-400">₹{hold.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-black text-secondary mb-6">Transaction Ledger</h3>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />)}
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
            <IndianRupee className="mx-auto w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500">No commission entries yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {commissions.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    c.status === 'Settled' ? 'bg-emerald-100 text-emerald-600' : 
                    c.status === 'Under Settlement' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {c.status === 'Settled' ? <ArrowDownRight size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-secondary">{c.customerName || "Customer"}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{c.productType} • Disbursed: ₹{parseInt(c.disbursedAmount || "0").toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-secondary">₹{parseInt(c.commissionAmount || "0").toLocaleString()}</p>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${
                    c.status === 'Settled' ? 'text-emerald-500' : 
                    c.status === 'Under Settlement' ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
