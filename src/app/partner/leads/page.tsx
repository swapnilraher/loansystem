"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { 
  Search, 
  Filter,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload
} from "lucide-react"
import Link from "next/link"
import { BulkUploadModal } from "@/components/ui/BulkUploadModal"

const STATUS_COLORS: any = {
  'New Lead': 'bg-blue-50 text-blue-600 border-blue-100',
  'Contacted': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  'Documents Pending': 'bg-orange-50 text-orange-600 border-orange-100',
  'Under Process': 'bg-slate-50 text-slate-600 border-slate-100',
  'Login to Bank': 'bg-cyan-50 text-cyan-600 border-cyan-100',
  'Approved': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Sanctioned': 'bg-green-50 text-green-600 border-green-100',
  'Disbursed': 'bg-green-100 text-green-700 border-green-200',
  'Rejected': 'bg-rose-50 text-rose-600 border-rose-100',
  'Not Interested': 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function PartnerLeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waTarget, setWaTarget] = useState<any>(null)
  const [waMessage, setWaMessage] = useState("")
  const [sendingWA, setSendingWA] = useState(false)
  
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  const handleOpenWA = (lead: any) => {
    setWaTarget(lead)
    setWaMessage(`Hello ${lead.name}, this is ${profile?.name || "TechStar Partner"}. I am reaching out regarding your ${lead.type} application.`)
    setWaModalOpen(true)
  }

  const handleSendWA = async () => {
    if (!waTarget?.mobile && !waTarget?.phone) return alert("No mobile number available")
    setSendingWA(true)
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: waTarget.mobile || waTarget.phone,
          name: waTarget.name,
          message: waMessage
        })
      })
      const data = await res.json()
      if (data.success) {
        alert("WhatsApp message sent!")
        setWaModalOpen(false)
      } else {
        alert("Error: " + data.error)
      }
    } catch (e) {
      alert("Failed to send WhatsApp message")
    }
    setSendingWA(false)
  }

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "leads"),
      where("partnerId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (lead.phone || lead.mobile || "").includes(searchTerm)
    const matchesStatus = statusFilter === "All" || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Group leads for mobile friendly display
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-secondary tracking-tight">My Leads</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Track the live status of your submissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-secondary rounded-2xl font-black text-sm hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
          >
            <Upload size={16} /> Excel Bulk Upload
          </button>
          <Link 
            href="/partner/leads/new"
            className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg text-center"
          >
            + New Lead
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by name or mobile..." 
            className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-primary transition-all min-w-[150px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 h-24 border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100">
          <Filter className="mx-auto w-12 h-12 text-slate-200 mb-4" />
          <h3 className="text-lg font-black text-secondary">No Leads Found</h3>
          <p className="text-slate-400 font-medium mt-1">Try adjusting your filters or add a new lead.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map(lead => (
            <Link key={lead.id} href={`/partner/leads/${lead.id}`} className="block">
              <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-secondary uppercase text-lg group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    {lead.name?.[0] || "C"}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-secondary group-hover:text-primary transition-colors">{lead.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400">{lead.mobile || lead.phone}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-black text-primary tracking-widest uppercase">{lead.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-2 md:mt-0">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.preventDefault(); handleOpenWA(lead); }}
                      className="p-1.5 text-emerald-500 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                      title="Send WhatsApp"
                    >
                      <MessageSquare size={14} />
                    </button>
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[lead.status] || 'bg-slate-50 text-slate-400'}`}>
                      {lead.status || 'New Lead'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    ₹{parseInt(lead.amount || "0").toLocaleString()} <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary ml-1" />
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* WhatsApp Modal */}
      {waModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setWaModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative z-10">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-black text-secondary mb-2">Message via WhatsApp</h3>
            <p className="text-sm font-bold text-slate-500 mb-6">
              Send an official update to <span className="text-secondary">{waTarget?.name}</span>
            </p>
            <div className="space-y-4">
              <textarea 
                className="w-full h-32 p-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-sm outline-none resize-none"
                value={waMessage}
                onChange={e => setWaMessage(e.target.value)}
              />
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setWaModalOpen(false)} 
                  disabled={sendingWA}
                  className="flex-1 h-14 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendWA} 
                  disabled={sendingWA}
                  className="flex-[2] h-14 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {sendingWA ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal 
        isOpen={bulkModalOpen} 
        onClose={() => setBulkModalOpen(false)} 
        onSuccess={() => setBulkModalOpen(false)} 
      />
    </div>
  )
}
