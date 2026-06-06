"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Mail, 
  MapPin, 
  Briefcase, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  Send,
  User
} from "lucide-react"

export default function LeadCRMView() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [lead, setLead] = useState<any>(null)
  const [remarks, setRemarks] = useState<any[]>([])
  const [newRemark, setNewRemark] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingRemark, setSendingRemark] = useState(false)

  // Fetch Lead & Remarks
  useEffect(() => {
    if (!user || !id) return

    const leadRef = doc(db, "leads", id as string)
    const unsubscribeLead = onSnapshot(leadRef, (docSnap) => {
      if (docSnap.exists()) {
        setLead({ id: docSnap.id, ...docSnap.data() })
      } else {
        router.push("/partner/leads") // Not found
      }
      setLoading(false)
    })

    const remarksRef = collection(db, `leads/${id}/remarks`)
    const q = query(remarksRef, orderBy("createdAt", "desc"))
    
    const unsubscribeRemarks = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setRemarks(data)
    })

    return () => {
      unsubscribeLead()
      unsubscribeRemarks()
    }
  }, [id, user, router])

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRemark.trim() || !user) return

    setSendingRemark(true)
    try {
      const remarksRef = collection(db, `leads/${id}/remarks`)
      await addDoc(remarksRef, {
        note: newRemark,
        type: "Note", // Note, Call, WhatsApp
        addedBy: user.uid,
        createdAt: serverTimestamp()
      })
      setNewRemark("")
    } catch (err) {
      console.error(err)
      alert("Failed to save remark")
    }
    setSendingRemark(false)
  }

  const trackAction = async (type: "Call" | "WhatsApp" | "Email") => {
    if (!user) return
    try {
      const remarksRef = collection(db, `leads/${id}/remarks`)
      await addDoc(remarksRef, {
        note: `Partner initiated ${type}`,
        type: type,
        addedBy: user.uid,
        createdAt: serverTimestamp()
      })
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!lead) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 md:pb-0">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-secondary tracking-tight">Lead Details</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage follow-ups for this customer.</p>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
          
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl uppercase">
              {lead.name?.[0] || "C"}
            </div>
            <div>
              <h3 className="text-xl font-black text-secondary">{lead.name}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
                <MapPin size={12} /> {lead.city || "Unknown City"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:items-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-slate-400" />
              <p className="text-sm font-bold text-secondary">{lead.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee size={16} className="text-slate-400" />
              <p className="text-sm font-black text-primary">₹{parseInt(lead.amount || "0").toLocaleString()}</p>
            </div>
            <div className="mt-2">
              <select 
                className={`text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl outline-none cursor-pointer border transition-colors ${
                  lead.status === 'Disbursed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  lead.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  'bg-slate-50 text-slate-600 border-slate-200 focus:border-primary'
                }`}
                value={lead.status}
                onChange={async (e) => {
                  const selectedStatus = e.target.value;
                  if (!user) return;

                  let finalStatus = selectedStatus;
                  let disbursedAmt = lead.amount;

                  if (selectedStatus === 'Disbursed') {
                    const amt = window.prompt("Please enter the Disbursed Amount:");
                    if (!amt || isNaN(Number(amt))) {
                      alert("A valid disbursed amount is required.");
                      return; // Cancel update
                    }
                    disbursedAmt = amt;
                    finalStatus = 'Disbursement Approval Pending'; // Route to admin
                    alert("Status changed to Pending Approval. The admin will verify and approve the disbursement.");
                  }

                  try {
                    // Update main document
                    const { updateDoc } = await import("firebase/firestore");
                    await updateDoc(doc(db, "leads", lead.id), { 
                      status: finalStatus,
                      ...(selectedStatus === 'Disbursed' && { disbursedAmount: disbursedAmt }),
                      updatedAt: serverTimestamp() 
                    });
                    
                    // Log status change in timeline
                    const remarksRef = collection(db, `leads/${lead.id}/remarks`);
                    await addDoc(remarksRef, {
                      note: `Status changed to: ${finalStatus}${selectedStatus === 'Disbursed' ? ` (Amount: ₹${disbursedAmt})` : ''}`,
                      type: "Status",
                      addedBy: user.uid,
                      createdAt: serverTimestamp()
                    });
                  } catch (err) {
                    console.error("Failed to update status", err);
                    alert("Failed to update status");
                  }
                }}
              >
                {['New Lead', 'Contacted', 'Documents Pending', 'Under Process', 'Login to Bank', 'Approved', 'Sanctioned', 'Disbursement Approval Pending', 'Disbursed', 'Rejected', 'Not Interested'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        <a 
          href={`tel:${lead.mobile}`}
          onClick={() => trackAction("Call")}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-blue-200 hover:bg-blue-50 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Phone size={20} />
          </div>
          <span className="text-xs font-black text-secondary">Call</span>
        </a>
        <a 
          href={`https://wa.me/91${lead.mobile}?text=Hello ${lead.name},`}
          target="_blank" rel="noreferrer"
          onClick={() => trackAction("WhatsApp")}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare size={20} />
          </div>
          <span className="text-xs font-black text-secondary">WhatsApp</span>
        </a>
        <a 
          href={`mailto:${lead.email || ""}`}
          onClick={() => trackAction("Email")}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-purple-200 hover:bg-purple-50 transition-all group"
        >
          <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mail size={20} />
          </div>
          <span className="text-xs font-black text-secondary">Email</span>
        </a>
      </div>

      {/* CRM Remarks & Timeline */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h3 className="text-lg font-black text-secondary flex items-center gap-2">
            <Clock size={20} className="text-primary" /> Follow-ups & Remarks
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
          {remarks.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="mx-auto w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-400">No remarks added yet.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {remarks.map((remark, idx) => (
                <div key={remark.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  
                  {/* Timeline Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                    {remark.type === 'Call' ? <Phone size={14} className="text-blue-500" /> :
                     remark.type === 'WhatsApp' ? <MessageSquare size={14} className="text-emerald-500" /> :
                     <CheckCircle2 size={14} className="text-primary" />}
                  </div>

                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        remark.type === 'Call' ? 'text-blue-500' :
                        remark.type === 'WhatsApp' ? 'text-emerald-500' : 'text-primary'
                      }`}>{remark.type}</span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {remark.createdAt?.toDate ? new Date(remark.createdAt.toDate()).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : 'Just now'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-secondary">{remark.note}</p>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
          <form onSubmit={handleAddRemark} className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Add a follow-up remark..." 
              className="flex-1 h-12 px-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold text-sm outline-none transition-all"
              value={newRemark}
              onChange={e => setNewRemark(e.target.value)}
            />
            <button 
              type="submit"
              disabled={sendingRemark || !newRemark.trim()}
              className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20 shrink-0"
            >
              <Send size={18} className={sendingRemark ? "animate-pulse" : ""} />
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}
