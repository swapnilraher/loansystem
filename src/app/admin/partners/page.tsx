"use client"

import React, { useMemo, useState, useEffect } from "react"
import {
  Banknote,
  Briefcase,
  Building2,
  CheckCircle2,
  Network,
  ShieldCheck,
  Edit,
  Eye,
  Phone,
  Mail,
  AlertTriangle,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  X,
  FileText,
  UserPlus,
} from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useLeads } from "@/lib/hooks/useLeads"
import { formatINR, formatINRShort, toAmount } from "@/lib/hooks/useBanks"
import { STATUS_DISBURSED } from "@/lib/disbursement"
import { formatDayShort } from "@/lib/dates"
import {
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  Sheet,
  StatCard,
  StatusBadge,
  Toolbar,
  useToast,
} from "@/components/admin/ui"
import { FactRow, SectionCard, Select } from "@/components/admin/leads/fields"
import DocumentViewerModal from "@/components/ui/DocumentViewerModal"
import EditPartnerModal from "@/components/admin/EditPartnerModal"

import { usePartners } from "@/lib/hooks/usePartners"

const ALL_TYPES = "All types"
const ALL_STATUSES = "All statuses"

function partnerName(partner: any): string {
  return partner.fullName || partner.contactPersonName || partner.kycData?.name || partner.panData?.name || "Unnamed partner"
}

function formatAddress(address: unknown): string {
  if (!address) return "—"
  if (typeof address === "string") return address
  if (typeof address === "object") {
    const parts = address as Record<string, string>
    return (
      [
        parts.house,
        parts.street,
        parts.landmark,
        parts.vtc,
        parts.district,
        parts.state,
        parts.pincode,
      ]
        .filter(Boolean)
        .join(", ") || "—"
    )
  }
  return "—"
}

export default function PartnersPage() {
  const { partners: firestorePartners, loading: firestoreLoading } = usePartners()
  const { leads } = useLeads()
  const toast = useToast()

  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES)
  const [selected, setSelected] = useState<any | null>(null)
  const [tab, setTab] = useState<"overview" | "leads">("overview")

  // Modals & Side Inspector
  const [sideDoc, setSideDoc] = useState<{ title: string; url?: string; fileName?: string } | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showQueryModal, setShowQueryModal] = useState(false)
  const [querySection, setQuerySection] = useState("KYC Documents")
  const [queryMessage, setQueryMessage] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPartnersData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/partner-applications?status=all")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data?.applications)) {
          setPartners(data.applications)
          return
        }
      }
      if (firestorePartners && firestorePartners.length > 0) {
        setPartners(firestorePartners)
      }
    } catch (e) {
      console.warn("Fetch partner applications API warning, using Firestore fallback:", e)
      if (firestorePartners && firestorePartners.length > 0) {
        setPartners(firestorePartners)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartnersData()
  }, [])

  useEffect(() => {
    if (firestorePartners && firestorePartners.length > 0 && partners.length === 0) {
      setPartners(firestorePartners)
      setLoading(false)
    }
  }, [firestorePartners])

  /** Lead counts and commission per partner, from confirmed disbursals only. */
  const stats = useMemo(() => {
    const byPartner: Record<string, { leads: number; disbursed: number; commission: number; volume: number }> = {}
    leads.forEach(lead => {
      if (!lead.partnerId) return
      const row = byPartner[lead.partnerId] || { leads: 0, disbursed: 0, commission: 0, volume: 0 }
      row.leads += 1
      if (lead.status === STATUS_DISBURSED) {
        row.disbursed += 1
        row.commission += Number(lead.connectorCommissionAmount) || 0
        row.volume += toAmount(lead.disbursedAmount)
      }
      byPartner[lead.partnerId] = row
    })
    return byPartner
  }, [leads])

  const businessTypes = useMemo(
    () => Array.from(new Set(partners.map(p => p.partnerType || p.businessType).filter(Boolean))).sort(),
    [partners]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return partners.filter(partner => {
      if (
        term &&
        !`${partnerName(partner)} ${partner.dsaCode || ""} ${partner.mobileNumber || ""} ${partner.email || ""} ${partner.panNumber || ""}`
          .toLowerCase()
          .includes(term)
      ) {
        return false
      }
      if (typeFilter !== ALL_TYPES && (partner.partnerType || partner.businessType) !== typeFilter) return false

      if (statusFilter !== ALL_STATUSES) {
        const currentSt = partner.dsaStatus || partner.status || "Active"
        if (statusFilter === "under_review" && currentSt !== "under_review" && currentSt !== "submitted") return false
        if (statusFilter === "draft" && currentSt !== "draft") return false
        if (statusFilter === "Active" && currentSt !== "Active" && currentSt !== "approved") return false
        if (statusFilter === "query_raised" && currentSt !== "query_raised") return false
        if (statusFilter === "rejected" && currentSt !== "rejected") return false
        if (statusFilter === "Inactive" && currentSt !== "Inactive") return false
      }
      return true
    })
  }, [partners, search, typeFilter, statusFilter])

  const partnerLeads = useMemo(
    () => (selected ? leads.filter(lead => lead.partnerId === selected.id || lead.partnerId === selected.mobileNumber) : []),
    [selected, leads]
  )

  const updateStatus = async (partnerId: string, dsaStatus: string) => {
    try {
      await updateDoc(doc(db, "users", partnerId), {
        dsaStatus,
        updatedAt: new Date(),
      })
      toast.push({ tone: "success", title: `Partner status set to ${dsaStatus}` })
      fetchPartnersData()
    } catch {
      toast.push({ tone: "danger", title: "Failed to update partner status" })
    }
  }

  // Action: Approve Partner
  const handleApprove = async (partner: any) => {
    if (!confirm(`Are you sure you want to APPROVE ${partnerName(partner)} as an official Techstar Money DSA Partner?`)) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          id: partner.id || partner.mobileNumber,
          mobileNumber: partner.mobileNumber,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Approval failed")

      toast.push({
        tone: "success",
        title: "Partner Approved Successfully",
        description: `Generated DSA Code: ${data.dsaCode}`,
      })
      setSelected(null)
      setSideDoc(null)
      fetchPartnersData()
    } catch (err: any) {
      toast.push({ tone: "danger", title: err.message || "Failed to approve partner" })
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Raise Query
  const handleRaiseQuery = async () => {
    if (!selected || !queryMessage.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "query",
          id: selected.id || selected.mobileNumber,
          mobileNumber: selected.mobileNumber,
          querySection,
          queryMessage,
        }),
      })

      if (!res.ok) throw new Error("Failed to raise query")

      toast.push({ tone: "warn", title: "Query raised successfully", description: "Partner notified via WhatsApp" })
      setShowQueryModal(false)
      setQueryMessage("")
      setSelected(null)
      setSideDoc(null)
      fetchPartnersData()
    } catch (err: any) {
      toast.push({ tone: "danger", title: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Reject
  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          id: selected.id || selected.mobileNumber,
          mobileNumber: selected.mobileNumber,
          reason: rejectReason,
        }),
      })

      if (!res.ok) throw new Error("Failed to reject application")

      toast.push({ tone: "danger", title: "Application Rejected" })
      setShowRejectModal(false)
      setRejectReason("")
      setSelected(null)
      setSideDoc(null)
      fetchPartnersData()
    } catch (err: any) {
      toast.push({ tone: "danger", title: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const columns: Column<any>[] = useMemo(
    () => [
      {
        id: "partner",
        header: "Partner / Applicant",
        card: "title",
        sortValue: p => partnerName(p),
        cell: p => (
          <span className="min-w-0 block">
            <span className="block font-semibold text-admin-text truncate">{partnerName(p)}</span>
            <span className="admin-num block text-admin-2xs text-admin-subtle font-mono">
              {p.dsaCode ? `${p.dsaCode}` : p.applicationId || `+91 ${p.mobileNumber}`}
            </span>
          </span>
        ),
      },
      {
        id: "mobile",
        header: "Mobile & Email",
        card: "meta",
        cell: p => (
          <span className="text-admin-muted truncate block">
            <a
              href={`tel:${p.mobileNumber}`}
              onClick={e => e.stopPropagation()}
              className="admin-num text-admin-accent hover:underline flex items-center gap-1 font-semibold"
            >
              <Phone size={12} /> +91 {p.mobileNumber}
            </a>
            {p.email && <span className="text-admin-2xs text-admin-subtle block truncate">{p.email}</span>}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type & PAN",
        card: "meta",
        cell: p => (
          <span className="text-admin-muted truncate block">
            <span className="font-semibold text-admin-text block">
              {p.partnerType || p.businessType || "Individual"} {p.firmType ? `(${p.firmType})` : ""}
            </span>
            <span className="font-mono text-admin-2xs text-admin-subtle">
              {p.panNumber || p.panData?.panNumber || "PAN Pending"}
            </span>
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        card: "trailing",
        sortValue: p => p.dsaStatus || p.status || "Active",
        cell: p => {
          const st = p.dsaStatus || p.status || "Active"
          if (st === "Active" || st === "approved") return <StatusBadge status="Active / Approved" tone="success" dot />
          if (st === "under_review" || st === "submitted") return <StatusBadge status="Under Review" tone="info" dot />
          if (st === "query_raised") return <StatusBadge status="Query Raised" tone="warn" dot />
          if (st === "rejected") return <StatusBadge status="Rejected" tone="danger" dot />
          if (st === "draft") return <StatusBadge status={`Draft (${p.currentStep || 1}/8)`} tone="subtle" dot />
          return <StatusBadge status="Inactive" tone="subtle" dot />
        },
      },
      {
        id: "disbursed",
        header: "Disbursed",
        card: "meta",
        sortValue: p => stats[p.id]?.volume ?? 0,
        cell: p => {
          const s = stats[p.id]
          if (!s || s.disbursed === 0) return <span className="text-admin-subtle">—</span>
          return (
            <span className="admin-num text-admin-text font-medium">{formatINRShort(s.volume)}</span>
          )
        },
      },
    ],
    [stats]
  )

  const underReviewCount = partners.filter(p => (p.dsaStatus || p.status) === "under_review" || (p.dsaStatus || p.status) === "submitted").length
  const draftCount       = partners.filter(p => (p.dsaStatus || p.status) === "draft").length
  const activeCount      = partners.filter(p => (p.dsaStatus || p.status) === "Active" || (p.dsaStatus || p.status) === "approved").length

  return (
    <div className="partner-root min-h-screen bg-admin-bg p-4 sm:p-6 space-y-4">
      {/* Header */}
      <PageHeader
        title="DSA Partner Network & Onboarding"
        subtitle="Manage active DSA connectors, verify pending onboarding applications side-by-side, edit details, and approve partners."
        actions={
          <button
            onClick={fetchPartnersData}
            className="admin-focus py-1.5 px-3 bg-admin-surface border border-admin-border hover:bg-admin-bg text-admin-text text-admin-xs font-semibold rounded-admin-sm flex items-center gap-1.5 shadow-admin-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Registered" value={partners.length} icon={Network} tone="info" loading={loading} />
        <StatCard label="Pending Approval" value={underReviewCount} hint="Requires Admin Sign-off" icon={Clock} tone="warn" loading={loading} />
        <StatCard label="Active Connectors" value={activeCount} hint="Verified DSA Partners" icon={CheckCircle2} tone="success" loading={loading} />
        <StatCard label="Incomplete Drafts" value={draftCount} hint="Onboarding drop-offs" icon={Users} tone="neutral" loading={loading} />
      </div>

      {/* Toolbar */}
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, DSA code, mobile or PAN…"
        chips={[
          { id: ALL_STATUSES, label: "All", count: partners.length },
          { id: "under_review", label: "Under Review", count: underReviewCount },
          { id: "draft", label: "Drafts / Drop-offs", count: draftCount },
          { id: "Active", label: "Active / Approved", count: activeCount },
          { id: "query_raised", label: "Query Raised", count: partners.filter(p => (p.dsaStatus || p.status) === "query_raised").length },
          { id: "rejected", label: "Rejected", count: partners.filter(p => (p.dsaStatus || p.status) === "rejected").length },
          { id: "Inactive", label: "Inactive", count: partners.filter(p => (p.dsaStatus || p.status) === "Inactive").length },
        ]}
        activeChip={statusFilter}
        onChipChange={setStatusFilter}
        actions={
          businessTypes.length > 0 ? (
            <Select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-auto h-8 text-admin-xs"
            >
              <option value={ALL_TYPES}>{ALL_TYPES}</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />

      {/* Split Main Layout: DataTable + Side-by-Side Verification Inspector */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Main Table */}
        <div className="flex-1 w-full min-w-0">
          <DataTable
            columns={columns}
            rows={filtered}
            getRowId={partner => partner.id || partner.mobileNumber}
            loading={loading}
            onRowClick={partner => {
              setSelected(partner)
              setTab("overview")
              setSideDoc(null)
            }}
            emptyTitle="No partners found"
            emptyDescription="DSA connectors who register through the portal appear here."
          />
        </div>

        {/* Selected Partner / Applicant Inspector Drawer */}
        {selected && (
          <div className="w-full lg:w-[480px] xl:w-[520px] bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-2 p-5 space-y-4 shrink-0 max-h-[88vh] overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-start justify-between border-b border-admin-border pb-3">
              <div>
                <h3 className="text-admin-base font-bold text-admin-text leading-tight">{partnerName(selected)}</h3>
                <p className="text-admin-2xs text-admin-subtle admin-num mt-0.5 font-mono">
                  {selected.dsaCode ? `DSA Code: ${selected.dsaCode}` : `Application ID: ${selected.applicationId || selected.mobileNumber}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelected(null)
                  setSideDoc(null)
                }}
                className="p-1 text-admin-subtle hover:text-admin-text rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Bar & Status Controls */}
            <div className="flex items-center justify-between bg-admin-bg border border-admin-border rounded-admin p-3 text-admin-xs">
              <div className="flex items-center gap-2">
                <Select
                  value={selected.dsaStatus || selected.status || "Active"}
                  onChange={e => updateStatus(selected.id, e.target.value)}
                  className="w-auto h-7 text-admin-2xs font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="under_review">Under Review</option>
                  <option value="draft">Draft</option>
                  <option value="query_raised">Query Raised</option>
                  <option value="rejected">Rejected</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="admin-focus text-admin-xs font-bold text-admin-accent hover:underline flex items-center gap-1"
              >
                <Edit size={13} /> Edit Details
              </button>
            </div>

            {/* Approval Action Bar for Pending Applicants */}
            {((selected.dsaStatus || selected.status) === "under_review" || (selected.dsaStatus || selected.status) === "submitted" || (selected.dsaStatus || selected.status) === "draft") && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-admin space-y-2">
                <p className="text-admin-2xs font-bold text-emerald-900">⚡ Pending Partner Action</p>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowQueryModal(true)}
                    className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-admin-2xs rounded-admin transition-all"
                  >
                    Raise Query
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-admin-2xs rounded-admin transition-all"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selected)}
                    disabled={actionLoading}
                    className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-admin-2xs rounded-admin shadow-admin-1 transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    <span>Approve Partner</span>
                  </button>
                </div>
              </div>
            )}

            {/* Fact Rows */}
            <div className="space-y-3">
              <SectionCard title="1. Basic & Entity Info">
                <div className="divide-y divide-admin-border">
                  <FactRow label="Partner Name" value={partnerName(selected)} />
                  <FactRow label="Mobile Number" value={`+91 ${selected.mobileNumber}`} />
                  <FactRow label="Email Address" value={selected.email || "—"} />
                  <FactRow label="Business Type" value={`${selected.partnerType || selected.businessType || "Individual"} ${selected.firmType ? `(${selected.firmType})` : ""}`} />
                  <FactRow label="PAN Number" value={<span className="font-mono font-bold">{selected.panNumber || selected.panData?.panNumber || "—"}</span>} />
                  <FactRow label="Registered" value={formatDayShort(selected.createdAt) || "Recently"} />
                </div>
              </SectionCard>

              <SectionCard title="2. Office Address">
                <div className="divide-y divide-admin-border">
                  <FactRow label="Address Line 1" value={selected.addressLine1 || selected.address?.line1 || "—"} />
                  <FactRow label="City & State" value={`${selected.city || selected.address?.city || ''}, ${selected.stateName || selected.address?.state || ''} - ${selected.pinCode || selected.address?.pincode || ''}`} />
                  <FactRow label="GST Status" value={`${selected.isGstRegistered || "No"} ${selected.gstin ? `(${selected.gstin})` : ""}`} />
                </div>
              </SectionCard>

              <SectionCard title="3. KYC Documents & Signed MOA Agreement">
                <div className="space-y-2 pt-1">
                  {/* Aadhaar Front */}
                  <div className="flex items-center justify-between p-2 bg-admin-bg border border-admin-border rounded-admin text-admin-xs">
                    <div>
                      <p className="font-semibold text-admin-text">Aadhaar Document</p>
                      <p className="text-admin-2xs text-admin-subtle">KYC Verification</p>
                    </div>
                    {(() => {
                      const docObj = selected.documents?.aadhaarFrontDoc || selected.documents?.aadhaarDoc
                      const url = docObj?.base64Data || (selected.mobileNumber ? `/api/document/proxy?mobile=${selected.mobileNumber}&type=aadhaarFrontDoc` : docObj?.fileUrl)
                      return (docObj || url) ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSideDoc({
                              title: "Aadhaar Card",
                              url: url || docObj?.fileUrl,
                              fileName: docObj?.fileName || "Aadhaar_Document.pdf",
                            })
                          }
                          className="py-1 px-2 rounded bg-admin-accent-soft text-admin-accent hover:bg-admin-accent hover:text-white font-bold text-admin-2xs transition-colors flex items-center gap-1"
                        >
                          <Eye size={12} /> View Document
                        </button>
                      ) : (
                        <span className="text-admin-subtle text-admin-2xs">Not uploaded</span>
                      )
                    })()}
                  </div>

                  {/* PAN Card */}
                  <div className="flex items-center justify-between p-2 bg-admin-bg border border-admin-border rounded-admin text-admin-xs">
                    <div>
                      <p className="font-semibold text-admin-text">PAN Card Document</p>
                      <p className="text-admin-2xs text-admin-subtle font-mono">{selected.panNumber || selected.panData?.panNumber || "PAN"}</p>
                    </div>
                    {(() => {
                      const docObj = selected.documents?.panDoc
                      const url = docObj?.base64Data || (selected.mobileNumber ? `/api/document/proxy?mobile=${selected.mobileNumber}&type=panDoc` : docObj?.fileUrl)
                      return (docObj || url) ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSideDoc({
                              title: "PAN Card",
                              url: url || docObj?.fileUrl,
                              fileName: docObj?.fileName || "PAN_Card.pdf",
                            })
                          }
                          className="py-1 px-2 rounded bg-admin-accent-soft text-admin-accent hover:bg-admin-accent hover:text-white font-bold text-admin-2xs transition-colors flex items-center gap-1"
                        >
                          <Eye size={12} /> View Document
                        </button>
                      ) : (
                        <span className="text-admin-subtle text-admin-2xs">Not uploaded</span>
                      )
                    })()}
                  </div>

                  {/* Signed MOA PDF */}
                  <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-admin text-admin-xs">
                    <div>
                      <p className="font-bold text-emerald-900">Signed MOA Agreement (PDF)</p>
                      <p className="text-admin-2xs text-emerald-700">
                        {selected.agreementSigned || selected.agreementData?.signedAt ? "✅ OTP Verified & Executed" : "Pending Signature"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSideDoc({
                          title: `Signed MOA Agreement - ${partnerName(selected)}`,
                          url: `/api/partner/agreement/pdf?mobile=${selected.mobileNumber}`,
                          fileName: `MOA_Agreement_${selected.dsaCode || selected.mobileNumber}.pdf`,
                        })
                      }
                      className="py-1 px-2.5 rounded bg-emerald-600 text-white font-bold text-admin-2xs hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Eye size={12} /> View Signed MOA PDF
                    </button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="4. Bank Account & Settlement Details">
                {selected.bankDetails ? (
                  <div className="divide-y divide-admin-border">
                    <FactRow label="Account Holder" value={selected.bankDetails.accountHolderName || selected.bankDetails.nameAtBank || "—"} />
                    <FactRow label="Bank Name" value={selected.bankDetails.bankName || "—"} />
                    <FactRow label="IFSC Code" value={<span className="font-mono font-bold text-admin-accent">{selected.bankDetails.ifsc || "—"}</span>} />
                    <FactRow label="Account Number" value={<span className="font-mono font-bold">{selected.bankDetails.accountNumber || "—"}</span>} />
                  </div>
                ) : (
                  <EmptyState
                    size="sm"
                    icon={Banknote}
                    title="No bank details on file"
                    description="Commission cannot be settled until the partner adds an account."
                  />
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {/* Attached Side-by-Side Document Preview Panel */}
        {sideDoc && selected && (
          <DocumentViewerModal
            isOpen={!!sideDoc}
            title={sideDoc.title}
            fileUrl={sideDoc.url}
            fileName={sideDoc.fileName}
            isSideBySide={true}
            onClose={() => setSideDoc(null)}
          />
        )}
      </div>

      {/* Raise Query Modal */}
      {showQueryModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-admin-surface border border-admin-border rounded-admin-lg p-6 space-y-4 text-admin-text">
            <h3 className="text-admin-base font-bold">Raise Query to Applicant</h3>
            <div>
              <label className="block text-admin-xs font-semibold text-admin-muted mb-1">Section *</label>
              <select
                value={querySection}
                onChange={e => setQuerySection(e.target.value)}
                className="w-full p-2.5 bg-admin-bg border border-admin-border rounded-admin text-admin-xs text-admin-text"
              >
                <option value="Basic Details">1. Basic Details</option>
                <option value="Business Details">2. Business Details</option>
                <option value="PAN Details">2. PAN Details</option>
                <option value="Office Address">4. Office Address</option>
                <option value="GST Details">5. GST Details</option>
                <option value="KYC Documents">6. KYC Documents (Aadhaar/PAN)</option>
                <option value="Bank Account Details">7. Bank Account Details</option>
                <option value="General">Other / General</option>
              </select>
            </div>

            <div>
              <label className="block text-admin-xs font-semibold text-admin-muted mb-1">Query Message</label>
              <textarea
                rows={3}
                value={queryMessage}
                onChange={e => setQueryMessage(e.target.value)}
                placeholder="Explain what correction or re-upload is required..."
                className="w-full p-2.5 bg-admin-bg border border-admin-border rounded-admin text-admin-xs text-admin-text"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowQueryModal(false)} className="py-2 px-4 bg-admin-bg text-admin-xs font-bold rounded-admin">
                Cancel
              </button>
              <button onClick={handleRaiseQuery} className="py-2 px-5 bg-amber-600 hover:bg-amber-700 text-white text-admin-xs font-bold rounded-admin">
                Send Query
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-admin-surface border border-admin-border rounded-admin-lg p-6 space-y-4 text-admin-text">
            <h3 className="text-admin-base font-bold text-tone-danger-fg">Reject Partner Application</h3>
            <div>
              <label className="block text-admin-xs font-semibold text-admin-muted mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full p-2.5 bg-admin-bg border border-admin-border rounded-admin text-admin-xs text-admin-text"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="py-2 px-4 bg-admin-bg text-admin-xs font-bold rounded-admin">
                Cancel
              </button>
              <button onClick={handleReject} className="py-2 px-5 bg-red-600 hover:bg-red-700 text-white text-admin-xs font-bold rounded-admin">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Partner Modal */}
      {showEditModal && selected && (
        <EditPartnerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          application={selected}
          onSaved={() => fetchPartnersData()}
        />
      )}
    </div>
  )
}
