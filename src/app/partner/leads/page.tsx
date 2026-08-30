"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore"
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  Clock, 
  Upload, 
  Plus, 
  Phone, 
  MessageCircle, 
  FileText, 
  ChevronRight, 
  Send, 
  X, 
  CheckCircle2, 
  Building2, 
  IndianRupee,
  Layers,
  User
} from "lucide-react"
import Link from "next/link"

import { 
  AdminButton, 
  AdminLinkButton, 
  EmptyState, 
  PageHeader, 
  Skeleton, 
  StatusBadge, 
  toneForStatus 
} from "@/components/admin/ui"
import { BulkUploadModal } from "@/components/ui/BulkUploadModal"
import { formatINR, toAmount } from "@/lib/hooks/useBanks"
import { timeAgo, toDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

export default function PartnerLeadsPage() {
  const { user, profile } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  
  // WhatsApp Modal
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waTarget, setWaTarget] = useState<any>(null)
  const [waMessage, setWaMessage] = useState("")
  const [sendingWA, setSendingWA] = useState(false)
  
  // Bulk Upload Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  // Follow-up Prompt
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false)
  const [promptLeadId, setPromptLeadId] = useState("")
  const [promptType, setPromptType] = useState("")
  const [followUpRemarkText, setFollowUpRemarkText] = useState("")
  const [isSavingPromptFollowUp, setIsSavingPromptFollowUp] = useState(false)

  // Subscribe to Partner's Leads in Firestore
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "leads"),
      where("partnerId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      data.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0)
        const tB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0)
        return tB - tA
      })
      setLeads(data)
      setLoading(false)
    }, (err) => {
      console.warn("Leads fetch error:", err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Listen to window focus for automated follow-up remark prompts
  useEffect(() => {
    const handleFocus = () => {
      const pendingStr = localStorage.getItem("pendingFollowUp")
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr)
          if (Date.now() - pending.time < 10 * 60 * 1000) {
            setPromptLeadId(pending.leadId)
            setPromptType(pending.type)
            setFollowUpRemarkText("")
            setShowFollowUpPrompt(true)
          }
        } catch (e) {
          console.error(e)
        }
        localStorage.removeItem("pendingFollowUp")
      }
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const handleOpenWA = (lead: any) => {
    setWaTarget(lead)
    setWaMessage(`Hello ${lead.name || "Sir/Madam"}, this is ${profile?.name || "TechStar Partner"}. I am reaching out regarding your ${lead.type || "loan"} application with Techstar Money.`)
    setWaModalOpen(true)
  }

  const handleSendWA = async () => {
    const targetPhone = waTarget?.mobile || waTarget?.phone
    if (!targetPhone) return alert("No mobile number available for this lead.")
    if (!user) return
    setSendingWA(true)
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          name: waTarget.name,
          message: waMessage
        })
      })
      const data = await res.json()
      if (data.success) {
        alert("WhatsApp message dispatched successfully!")
        setWaModalOpen(false)

        const remarksRef = collection(db, `leads/${waTarget.id}/remarks`)
        await addDoc(remarksRef, {
          note: `Sent WhatsApp: ${waMessage}`,
          type: "WhatsApp",
          addedBy: user.uid,
          createdAt: serverTimestamp()
        })

        const leadRef = doc(db, "leads", waTarget.id)
        await updateDoc(leadRef, {
          lastActivityNote: `Sent WhatsApp: ${waMessage}`,
          lastActivityType: "WhatsApp",
          lastActivityUser: profile?.name || user.displayName || user.email || "Partner",
          lastActivityTime: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      } else {
        alert("Error: " + (data.error || "Failed to send"))
      }
    } catch {
      alert("Failed to send WhatsApp message")
    }
    setSendingWA(false)
  }

  const handleSavePromptFollowUp = async () => {
    if (!promptLeadId || !followUpRemarkText.trim() || !user) return
    setIsSavingPromptFollowUp(true)
    try {
      const remarkNote = followUpRemarkText.trim()
      const remarksRef = collection(db, `leads/${promptLeadId}/remarks`)
      await addDoc(remarksRef, {
        note: remarkNote,
        type: promptType,
        addedBy: user.uid,
        createdAt: serverTimestamp()
      })

      const leadRef = doc(db, "leads", promptLeadId)
      const targetLead = leads.find(l => l.id === promptLeadId)
      const updatePayload: any = {
        lastActivityNote: remarkNote,
        lastActivityType: promptType,
        lastActivityUser: profile?.name || user.displayName || "Partner",
        lastActivityTime: serverTimestamp(),
        lastNote: remarkNote,
        lastNoteUser: profile?.name || user.displayName || "Partner",
        lastNoteTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      if (targetLead && (targetLead.status === "New Lead" || targetLead.status === "New")) {
        updatePayload.status = "Contacted"
      }
      await updateDoc(leadRef, updatePayload)

      setShowFollowUpPrompt(false)
      setFollowUpRemarkText("")
      alert("Follow-up remark saved successfully!")
    } catch (err) {
      console.error(err)
      alert("Failed to save follow-up")
    }
    setIsSavingPromptFollowUp(false)
  }

  // Available Status Options
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>()
    leads.forEach(l => {
      if (l.status) set.add(l.status)
    })
    return Array.from(set)
  }, [leads])

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch = q === "" || 
        String(lead.name || "").toLowerCase().includes(q) ||
        String(lead.phone || lead.mobile || "").includes(q) ||
        String(lead.city || "").toLowerCase().includes(q)

      const matchesStatus = statusFilter === "All" || lead.status === statusFilter
      const matchesType = typeFilter === "All" || (lead.type || lead.loanType) === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [leads, searchTerm, statusFilter, typeFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ── Top Header with Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-admin-border">
        <div>
          <h1 className="text-admin-xl font-bold tracking-tight text-admin-text">
            Lead Management
          </h1>
          <p className="text-admin-xs text-admin-muted mt-0.5">
            Track live underwriting, bank login statuses, and disbursals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <AdminButton
            variant="secondary"
            size="md"
            icon={Upload}
            onClick={() => setBulkModalOpen(true)}
          >
            Bulk Excel Upload
          </AdminButton>

          <AdminLinkButton
            href="/partner/leads/new"
            variant="primary"
            size="md"
            icon={Plus}
          >
            New Lead
          </AdminLinkButton>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="p-3.5 bg-admin-surface rounded-admin border border-admin-border shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-admin-xs bg-admin-surface-2 border border-admin-border rounded-admin text-admin-text placeholder:text-admin-subtle focus:outline-none focus:border-admin-accent transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Loan Product Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-2 px-3 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-medium text-admin-text outline-none focus:border-admin-accent"
          >
            <option value="All">All Loan Types</option>
            <option value="Personal Loan">Personal Loan</option>
            <option value="Business Loan">Business Loan</option>
            <option value="Home Loan">Home Loan</option>
            <option value="Loan Against Property">Loan Against Property</option>
            <option value="Gold Loan">Gold Loan</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-medium text-admin-text outline-none focus:border-admin-accent"
          >
            <option value="All">All Statuses ({leads.length})</option>
            {uniqueStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Content Area: Desktop Table & Mobile Cards ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-admin-surface border border-admin-border rounded-admin animate-pulse" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-admin border border-admin-border bg-admin-surface p-12 text-center shadow-sm">
          <EmptyState
            title={leads.length === 0 ? "No Customer Leads Sourced Yet" : "No Matching Leads Found"}
            description={
              leads.length === 0 
                ? "Start sourcing customer loans or upload an Excel batch to track commissions."
                : "Try clearing your search query or status filters."
            }
            action={
              <AdminLinkButton href="/partner/leads/new" variant="primary" size="md" icon={Plus}>
                Create New Lead
              </AdminLinkButton>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── DESKTOP VIEW: High-Density DataTable (hidden on mobile) ── */}
          <div className="hidden md:block rounded-admin border border-admin-border bg-admin-surface shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-admin-xs border-collapse">
                <thead>
                  <tr className="border-b border-admin-border bg-admin-surface-2/60 text-admin-muted text-admin-2xs uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Product Type</th>
                    <th className="py-3 px-4">Loan Amount</th>
                    <th className="py-3 px-4">Live Status</th>
                    <th className="py-3 px-4">Latest Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {filteredLeads.map(lead => {
                    const leadAmt = toAmount(lead.amount || 0)
                    const cleanPhone = String(lead.mobile || lead.phone || "").replace(/\D/g, "")
                    return (
                      <tr key={lead.id} className="hover:bg-admin-surface-hover transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-admin bg-admin-surface-2 border border-admin-border flex items-center justify-center font-bold text-admin-text shrink-0 text-admin-xs">
                              {lead.name?.[0]?.toUpperCase() || "L"}
                            </div>
                            <div>
                              <p className="font-bold text-admin-text group-hover:text-admin-accent transition-colors">
                                {lead.name || "Customer Applicant"}
                              </p>
                              <p className="text-admin-2xs text-admin-muted font-mono admin-num">
                                {cleanPhone || "—"} {lead.city ? `• ${lead.city}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-admin-sm bg-admin-surface-2 border border-admin-border text-admin-text font-medium text-admin-2xs">
                            {lead.type || lead.loanType || "Personal Loan"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold font-mono text-admin-text admin-num">
                            {formatINR(leadAmt)}
                          </p>
                          {lead.disbursedAmount && (
                            <p className="text-admin-2xs text-tone-success-fg font-mono admin-num">
                              Disbursed: {formatINR(toAmount(lead.disbursedAmount))}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={lead.status || "New Lead"} dot size="sm" />
                        </td>

                        <td className="py-3 px-4">
                          <p className="text-admin-xs text-admin-text truncate max-w-[22ch]">
                            {lead.lastActivityNote || lead.remarks || "Application created"}
                          </p>
                          <p className="text-admin-2xs text-admin-muted font-mono admin-num mt-0.5">
                            {lead.createdAt ? timeAgo(lead.createdAt) : "Recently"}
                          </p>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {cleanPhone && (
                              <button
                                type="button"
                                onClick={() => handleOpenWA(lead)}
                                className="p-1.5 rounded-admin bg-tone-success-bg text-tone-success-fg hover:opacity-80 transition-opacity border border-tone-success-bd"
                                title="Send WhatsApp Update"
                              >
                                <MessageCircle size={14} />
                              </button>
                            )}
                            {cleanPhone && (
                              <a
                                href={`tel:${cleanPhone}`}
                                className="p-1.5 rounded-admin bg-admin-surface-2 text-admin-muted hover:text-admin-text transition-colors border border-admin-border"
                                title="Call Customer"
                              >
                                <Phone size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── MOBILE VIEW: High-Performance Touch Cards (visible on mobile only) ── */}
          <div className="md:hidden space-y-3">
            {filteredLeads.map(lead => {
              const leadAmt = toAmount(lead.amount || 0)
              const cleanPhone = String(lead.mobile || lead.phone || "").replace(/\D/g, "")
              return (
                <div 
                  key={lead.id} 
                  className="rounded-admin border border-admin-border bg-admin-surface p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-admin bg-admin-surface-2 border border-admin-border flex items-center justify-center font-bold text-admin-text shrink-0 text-admin-sm">
                        {lead.name?.[0]?.toUpperCase() || "L"}
                      </div>
                      <div>
                        <h3 className="font-bold text-admin-sm text-admin-text">
                          {lead.name || "Customer Applicant"}
                        </h3>
                        <p className="text-admin-2xs text-admin-muted font-mono admin-num">
                          {cleanPhone} {lead.city ? `• ${lead.city}` : ""}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={lead.status || "New Lead"} dot size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-admin-surface-2 rounded-admin text-admin-xs">
                    <div>
                      <span className="text-admin-2xs text-admin-muted uppercase font-bold">Loan Amount</span>
                      <p className="font-bold font-mono text-admin-text admin-num mt-0.5">
                        {formatINR(leadAmt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-admin-2xs text-admin-muted uppercase font-bold">Product</span>
                      <p className="font-semibold text-admin-text mt-0.5 truncate">
                        {lead.type || lead.loanType || "Personal Loan"}
                      </p>
                    </div>
                  </div>

                  {lead.lastActivityNote && (
                    <p className="text-admin-2xs text-admin-muted italic truncate">
                      "{lead.lastActivityNote}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-admin-border/60 text-admin-2xs text-admin-muted">
                    <span className="font-mono admin-num">
                      {lead.createdAt ? timeAgo(lead.createdAt) : "Just now"}
                    </span>
                    <div className="flex items-center gap-2">
                      {cleanPhone && (
                        <button
                          type="button"
                          onClick={() => handleOpenWA(lead)}
                          className="h-8 px-2.5 rounded-admin bg-tone-success-bg text-tone-success-fg font-bold flex items-center gap-1.5 border border-tone-success-bd text-admin-2xs hover:opacity-90 transition-opacity"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </button>
                      )}
                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="h-8 px-2.5 rounded-admin bg-admin-surface-2 text-admin-text border border-admin-border flex items-center gap-1.5 text-admin-2xs font-bold hover:bg-admin-surface-hover transition-colors"
                        >
                          <Phone size={13} />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── WhatsApp Modal ── */}
      {waModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-admin-surface border border-admin-border rounded-admin max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-admin-border">
              <div className="flex items-center gap-2 text-tone-success-fg font-bold text-admin-sm">
                <MessageCircle size={18} />
                <span>Send WhatsApp to {waTarget?.name}</span>
              </div>
              <button
                onClick={() => setWaModalOpen(false)}
                className="text-admin-muted hover:text-admin-text p-1"
              >
                <X size={16} />
              </button>
            </div>

            <textarea
              rows={4}
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              placeholder="Type customer message..."
              className="w-full p-3 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs text-admin-text outline-none focus:border-admin-accent resize-none"
            />

            <div className="flex justify-end gap-2">
              <AdminButton variant="secondary" size="sm" onClick={() => setWaModalOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                icon={Send}
                loading={sendingWA}
                onClick={handleSendWA}
              >
                Send via WhatsApp API
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Follow-up Prompt Modal ── */}
      {showFollowUpPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-admin-surface border border-admin-border rounded-admin max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-admin-border">
              <span className="font-bold text-admin-sm text-admin-text">
                Add Call / Communication Remark
              </span>
              <button
                onClick={() => setShowFollowUpPrompt(false)}
                className="text-admin-muted hover:text-admin-text p-1"
              >
                <X size={16} />
              </button>
            </div>
            <textarea
              rows={3}
              value={followUpRemarkText}
              onChange={(e) => setFollowUpRemarkText(e.target.value)}
              placeholder="What was discussed with the applicant? (e.g. docs requested, interested, followup tomorrow)"
              className="w-full p-3 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs text-admin-text outline-none focus:border-admin-accent resize-none"
            />
            <div className="flex justify-end gap-2">
              <AdminButton variant="secondary" size="sm" onClick={() => setShowFollowUpPrompt(false)}>
                Skip
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                loading={isSavingPromptFollowUp}
                onClick={handleSavePromptFollowUp}
              >
                Save Remark
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Upload Modal ── */}
      <BulkUploadModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        partnerId={user?.uid || ""}
        partnerName={profile?.name || "Partner"}
      />
    </div>
  )
}
