"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore"
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
  const { user, profile } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waTarget, setWaTarget] = useState<any>(null)
  const [waMessage, setWaMessage] = useState("")
  const [sendingWA, setSendingWA] = useState(false)
  
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  // 💬 Follow-up Prompt states
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false)
  const [promptLeadId, setPromptLeadId] = useState("")
  const [promptType, setPromptType] = useState("")
  const [followUpRemarkText, setFollowUpRemarkText] = useState("")
  const [isSavingPromptFollowUp, setIsSavingPromptFollowUp] = useState(false)

  const handleOpenWA = (lead: any) => {
    setWaTarget(lead)
    setWaMessage(`Hello ${lead.name}, this is ${profile?.name || "TechStar Partner"}. I am reaching out regarding your ${lead.type} application.`)
    setWaModalOpen(true)
  }

  const handleSendWA = async () => {
    if (!waTarget?.mobile && !waTarget?.phone) return alert("No mobile number available")
    if (!user) return
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

        // Log remark in remarks subcollection
        const remarksRef = collection(db, `leads/${waTarget.id}/remarks`)
        await addDoc(remarksRef, {
          note: `Sent WhatsApp: ${waMessage}`,
          type: "WhatsApp",
          addedBy: user.uid,
          createdAt: serverTimestamp()
        })

        // Update parent lead document
        const leadRef = doc(db, 'leads', waTarget.id)
        await updateDoc(leadRef, {
          lastActivityNote: `Sent WhatsApp: ${waMessage}`,
          lastActivityType: "WhatsApp",
          lastActivityUser: user.displayName || user.email || "Partner",
          lastActivityTime: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
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

  // 🕒 Listen to window focus for automated follow-up remark prompts
  useEffect(() => {
    const handleFocus = () => {
      const pendingStr = localStorage.getItem('pendingFollowUp');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (Date.now() - pending.time < 10 * 60 * 1000) {
            setPromptLeadId(pending.leadId);
            setPromptType(pending.type);
            setFollowUpRemarkText("");
            setShowFollowUpPrompt(true);
          }
        } catch (e) {
          console.error(e);
        }
        localStorage.removeItem('pendingFollowUp');
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSavePromptFollowUp = async () => {
    if (!promptLeadId || !followUpRemarkText.trim() || !user) return;
    setIsSavingPromptFollowUp(true);
    try {
      const remarkNote = followUpRemarkText.trim();
      const remarksRef = collection(db, `leads/${promptLeadId}/remarks`)
      await addDoc(remarksRef, {
        note: remarkNote,
        type: promptType,
        addedBy: user.uid,
        createdAt: serverTimestamp()
      });

      // Update parent lead document
      const leadRef = doc(db, 'leads', promptLeadId);
      const targetLead = leads.find(l => l.id === promptLeadId);
      const updatePayload: any = {
        lastActivityNote: remarkNote,
        lastActivityType: promptType,
        lastActivityUser: user.displayName || user.email || "Partner",
        lastActivityTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      if (targetLead && (targetLead.status === 'New Lead' || targetLead.status === 'New')) {
        updatePayload.status = 'Contacted';
      }
      await updateDoc(leadRef, updatePayload);

      setShowFollowUpPrompt(false);
      setFollowUpRemarkText("");
      alert("रिमार्क सेव्ह झाला!");
    } catch (err) {
      console.error(err);
      alert("Failed to save follow-up");
    }
    setIsSavingPromptFollowUp(false);
  };

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
          {filteredLeads.map(lead => {
            const isUntouched = (lead.status === 'New Lead' || lead.status === 'New') && !lead.lastActivityNote;
            return (
              <div key={lead.id} className="block">
                {/* Desktop Card (hidden on mobile) */}
                <Link href={`/partner/leads/${lead.id}`} className="hidden md:block">
                  <div className={`rounded-[1.5rem] border shadow-sm px-5 py-3.5 hover:border-primary/30 hover:shadow-md transition-all flex items-center justify-between gap-3 group ${
                    isUntouched ? 'border-rose-200 bg-rose-50/5 shadow-[inset_0_0_12px_rgba(244,63,94,0.02)]' : 'border-slate-100 bg-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-secondary uppercase text-lg group-hover:bg-primary/5 group-hover:text-primary transition-colors relative shrink-0">
                        {isUntouched && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-20">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
                          </span>
                        )}
                        {lead.name?.[0] || "C"}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-secondary group-hover:text-primary transition-colors">{lead.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400">{lead.mobile || lead.phone}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[10px] font-black text-primary tracking-widest uppercase">{lead.type}</span>
                        </div>
                        {lead.lastActivityNote && (
                          <p className="text-[10px] text-indigo-650 bg-indigo-50 border border-indigo-100/65 rounded-lg px-2 py-0.5 font-bold mt-1.5 inline-block max-w-[200px] truncate" title={lead.lastActivityNote}>
                            💬 {lead.lastActivityNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center gap-2">
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

                {/* Mobile Partner Lead Card Layout (visible only on mobile) */}
                <div className={`flex md:hidden flex-col gap-2.5 rounded-2xl border shadow-sm px-3.5 py-3.5 hover:border-primary/30 hover:shadow-md transition-all relative ${
                  isUntouched ? 'border-rose-200 bg-rose-50/5 shadow-[inset_0_0_12px_rgba(244,63,94,0.02)]' : 'border-slate-100 bg-white'
                }`}>
                  {/* SLA indicator bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    lead.slaStatus === 'Overdue' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`} />

                  {/* Header Row: Client Name and Icon */}
                  <div className="flex items-center justify-between w-full pl-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-secondary uppercase text-md relative shrink-0">
                        {isUntouched && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2 z-20">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
                        {lead.name?.[0] || "C"}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-secondary">{lead.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{lead.mobile || lead.phone}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800">
                        ₹{parseInt(lead.amount || "0").toLocaleString()}
                      </p>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">{lead.type}</p>
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="h-px bg-slate-100/60 my-0.5 ml-1.5" />

                  {/* Comment Bubble (If exists) */}
                  {lead.lastActivityNote ? (
                    <div className="bg-indigo-50/50 border border-indigo-100/40 rounded-xl px-2.5 py-1.5 ml-1.5 flex items-start gap-1.5">
                      <span className="text-xs shrink-0 mt-0.5">💬</span>
                      <p className="text-[10px] text-indigo-655 font-bold leading-normal line-clamp-2" title={lead.lastActivityNote}>
                        {lead.lastActivityNote}
                      </p>
                    </div>
                  ) : (
                    isUntouched && (
                      <div className="bg-rose-50/30 border border-rose-100/45 rounded-xl px-2.5 py-1.5 ml-1.5 flex items-center gap-1.5 animate-pulse">
                        <span className="text-xs shrink-0">⚠️</span>
                        <p className="text-[9px] text-rose-500 font-black tracking-wide uppercase">
                          Action Pending
                        </p>
                      </div>
                    )
                  )}

                  {/* Action Row: Status badge & Send WhatsApp button */}
                  <div className="flex items-center justify-between w-full mt-1 pl-1.5 gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[lead.status] || 'bg-slate-50 text-slate-400'}`}>
                      {lead.status || 'New Lead'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleOpenWA(lead); }}
                        className="p-2 text-emerald-500 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/35 rounded-xl transition-all flex items-center gap-1 shrink-0"
                        title="Send WhatsApp"
                      >
                        <MessageSquare size={13} />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider pr-1">WhatsApp</span>
                      </button>

                      {/* Detail View Button */}
                      <Link href={`/partner/leads/${lead.id}`} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                        <Eye size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
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

      {/* ⚠️ Quick Follow-up Popup Prompt */}
      {showFollowUpPrompt && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFollowUpPrompt(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <Clock size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-secondary uppercase tracking-wider">Follow-up / Remark नोंदा</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">ग्राहकाला केलेल्या {promptType === 'Call' ? 'कॉल' : 'WhatsApp'} बाबत माहिती लिहा</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">रिमार्क (Remark) / चर्चा</label>
                <textarea
                  placeholder="उदा. ग्राहक उद्या बोलण्यास सांगितले, डॉक्युमेंट्स पाठवणार आहे, इ."
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-rose-350 focus:bg-white rounded-2xl p-4 text-xs font-bold shadow-sm transition-all focus:outline-none min-h-[100px]"
                  value={followUpRemarkText}
                  onChange={(e) => setFollowUpRemarkText(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFollowUpPrompt(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
                >
                  रद्द करा
                </button>
                <button
                  type="button"
                  disabled={isSavingPromptFollowUp || !followUpRemarkText.trim()}
                  onClick={handleSavePromptFollowUp}
                  className="flex-[2] py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingPromptFollowUp ? "सेव्ह होत आहे..." : "रिमार्क सेव्ह करा"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
