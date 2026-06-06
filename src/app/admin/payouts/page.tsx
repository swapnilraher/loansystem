"use client"

import React, { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { IndianRupee, CheckCircle2, Search, TrendingUp, Clock, Wallet, ShieldAlert } from "lucide-react"

export default function PayoutsSettlement() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Settlement Form State
  const [selectedLedger, setSelectedLedger] = useState<any>(null)
  const [utrNumber, setUtrNumber] = useState("")
  const [remarks, setRemarks] = useState("")

  useEffect(() => {
    const q = query(collection(db, "commission_ledger"))
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
  }, [])

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLedger) return
    try {
      await updateDoc(doc(db, "commission_ledger", selectedLedger.id), {
        status: "Settled",
        utrNumber,
        settlementRemarks: remarks,
        settledAt: serverTimestamp()
      })
      setSelectedLedger(null)
      setUtrNumber("")
      setRemarks("")
      alert("Settlement marked as Done.")
    } catch (e) {
      alert("Failed to settle.")
    }
  }

  const handleReject = async (ledgerId: string) => {
    if(!window.confirm("Are you sure you want to reject this payout?")) return
    try {
      await updateDoc(doc(db, "commission_ledger", ledgerId), {
        status: "Rejected",
        updatedAt: serverTimestamp()
      })
    } catch (e) {
      alert("Failed to reject.")
    }
  }

  const filtered = commissions.filter(c => 
    (c.partnerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.customerName || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalDisbursed = commissions.reduce((acc, curr) => acc + parseInt(curr.disbursedAmount || "0"), 0)
  const totalCommission = commissions.reduce((acc, curr) => acc + parseInt(curr.commissionAmount || "0"), 0)
  const pendingPayouts = commissions.filter(c => c.status === "Under Settlement").reduce((acc, curr) => acc + parseInt(curr.commissionAmount || "0"), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Partner Settlements</h2>
          <p className="text-slate-500 font-medium">Manage DSA payouts and commissions.</p>
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
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Commission Generated</p>
            <h3 className="text-3xl font-black text-secondary tracking-tight">₹ {totalCommission.toLocaleString()}</h3>
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
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors" />
          <div className="relative z-10">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
              <Wallet size={24} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Partner Disbursed Volume</p>
            <h3 className="text-3xl font-black text-secondary tracking-tight">₹ {(totalDisbursed/100000).toFixed(2)}L</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-black text-secondary">Commission Breakdown</h3>
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <input 
              type="text" 
              placeholder="Search Partner or Customer" 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer (Lead)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Disbursed Amt</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-bold">Loading records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-bold">No settlements found.</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-secondary text-sm">{c.partnerName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.dsaCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-secondary text-sm">{c.customerName}</p>
                      <p className="text-[10px] font-bold text-slate-400">{c.productType}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-500 italic">₹{parseInt(c.disbursedAmount || "0").toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-emerald-600 text-sm italic">₹{parseInt(c.commissionAmount || "0").toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.commissionPercentage || '2'}% Slab</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        c.status === 'Settled' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        c.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {c.status}
                      </span>
                      {c.utrNumber && <p className="text-[9px] font-bold text-slate-400 mt-1">UTR: {c.utrNumber}</p>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status === "Under Settlement" && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedLedger(c)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-[10px] font-black uppercase transition-all"
                          >
                            Settle
                          </button>
                          <button 
                            onClick={() => handleReject(c.id)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[10px] font-black uppercase transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedLedger(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative z-10">
            <h3 className="text-xl font-black text-secondary mb-6">Settle Payout</h3>
            <p className="text-sm font-bold text-slate-500 mb-6">
              Processing payout of <span className="text-primary font-black">₹{parseInt(selectedLedger.commissionAmount).toLocaleString()}</span> to {selectedLedger.partnerName}.
            </p>
            <form onSubmit={handleSettle} className="space-y-4">
              <input 
                type="text" 
                required
                placeholder="Bank UTR Number / TXN ID" 
                className="w-full h-14 px-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-sm outline-none"
                value={utrNumber}
                onChange={e => setUtrNumber(e.target.value)}
              />
              <textarea 
                placeholder="Admin Remarks (Optional)" 
                className="w-full h-24 p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-sm outline-none resize-none"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setSelectedLedger(null)} className="flex-1 h-14 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Cancel</button>
                <button type="submit" className="flex-[2] h-14 bg-primary text-white rounded-2xl font-black uppercase text-xs">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
