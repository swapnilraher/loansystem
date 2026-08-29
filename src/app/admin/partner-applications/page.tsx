"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  FileText,
  Building2,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Download,
  Edit,
  UserPlus,
  ArrowLeft,
  X,
  ExternalLink,
} from "lucide-react"

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
import { formatDayShort } from "@/lib/dates"

const ALL_STATUSES = "All statuses"

export default function AdminPartnerApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApp, setSelectedApp] = useState<any | null>(null)

  // Side-by-Side Document Viewer State
  const [sideDoc, setSideDoc] = useState<{ title: string; url?: string; fileName?: string } | null>(null)

  // Modals
  const [showQueryModal, setShowQueryModal] = useState(false)
  const [querySection, setQuerySection] = useState("KYC Documents")
  const [queryMessage, setQueryMessage] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const toast = useToast()

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/partner-applications?status=${filterStatus}`)
      const data = await res.json()
      if (res.ok && data.applications) {
        setApplications(data.applications)
      }
    } catch (e) {
      console.error(e)
    } flex: {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [filterStatus])

  const handleApprove = async (app: any) => {
    if (!confirm(`Are you sure you want to APPROVE ${app.fullName || app.contactPersonName} as an official Techstar Money DSA Partner?`)) return

    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          id: app.applicationId || app.mobileNumber,
          mobileNumber: app.mobileNumber,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Approval failed")

      toast.push({
        tone: "success",
        title: "Partner Approved Successfully",
        description: `Generated DSA Code: ${data.dsaCode}`,
      })
      setSelectedApp(null)
      setSideDoc(null)
      fetchApplications()
    } catch (err: any) {
      toast.push({ tone: "danger", title: err.message || "Failed to approve partner" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRaiseQuery = async () => {
    if (!selectedApp || !queryMessage.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "query",
          id: selectedApp.applicationId || selectedApp.mobileNumber,
          mobileNumber: selectedApp.mobileNumber,
          querySection,
          queryMessage,
        }),
      })

      if (!res.ok) throw new Error("Failed to raise query")

      toast.push({ tone: "warn", title: "Query raised successfully", description: "Partner notified via WhatsApp" })
      setShowQueryModal(false)
      setQueryMessage("")
      setSelectedApp(null)
      setSideDoc(null)
      fetchApplications()
    } catch (err: any) {
      toast.push({ tone: "danger", title: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedApp || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          id: selectedApp.applicationId || selectedApp.mobileNumber,
          mobileNumber: selectedApp.mobileNumber,
          reason: rejectReason,
        }),
      })

      if (!res.ok) throw new Error("Failed to reject application")

      toast.push({ tone: "danger", title: "Application Rejected" })
      setShowRejectModal(false)
      setRejectReason("")
      setSelectedApp(null)
      setSideDoc(null)
      fetchApplications()
    } catch (err: any) {
      toast.push({ tone: "danger", title: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredApps = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return applications.filter((app) => {
      if (
        term &&
        !`${app.fullName || ""} ${app.contactPersonName || ""} ${app.applicationId || ""} ${app.mobileNumber || ""} ${app.panNumber || ""}`
          .toLowerCase()
          .includes(term)
      ) {
        return false
      }
      return true
    })
  }, [applications, searchTerm])

  const columns: Column<any>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Applicant / Entity",
        card: "title",
        sortValue: app => app.fullName || app.contactPersonName || "",
        cell: app => (
          <span className="min-w-0 block">
            <span className="block font-semibold text-admin-text truncate">
              {app.fullName || app.contactPersonName || `Applicant (+91 ${app.mobileNumber})`}
            </span>
            <span className="admin-num block text-admin-2xs text-admin-subtle truncate">
              {app.applicationId || app.mobileNumber}
            </span>
          </span>
        ),
      },
      {
        id: "mobile",
        header: "Mobile",
        card: "meta",
        cell: app => (
          <a
            href={`tel:${app.mobileNumber}`}
            onClick={e => e.stopPropagation()}
            className="admin-num text-admin-accent hover:underline inline-flex items-center gap-1"
          >
            <Phone size={12} />
            +91 {app.mobileNumber}
          </a>
        ),
      },
      {
        id: "pan",
        header: "PAN / Entity",
        card: "meta",
        cell: app => (
          <span className="text-admin-muted truncate">
            <span className="font-mono font-semibold">{app.panNumber || "PAN Pending"}</span>
            <span className="block text-admin-2xs text-admin-subtle">
              {app.partnerType || "Individual"} {app.firmType ? `(${app.firmType})` : ""}
            </span>
          </span>
        ),
      },
      {
        id: "submitted",
        header: "Submitted / Updated",
        card: "meta",
        cell: app => (
          <span className="text-admin-muted whitespace-nowrap">
            {formatDayShort(app.updatedAt || app.submittedAt) || "Recently"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        card: "trailing",
        sortValue: app => app.status || "draft",
        cell: app => {
          const st = app.status || "draft"
          if (st === "approved") return <StatusBadge status="Approved" tone="success" dot />
          if (st === "query_raised") return <StatusBadge status="Query Raised" tone="warn" dot />
          if (st === "rejected") return <StatusBadge status="Rejected" tone="danger" dot />
          if (st === "draft") return <StatusBadge status={`Draft (${app.currentStep || 1}/8)`} tone="subtle" dot />
          return <StatusBadge status="Under Review" tone="info" dot />
        },
      },
    ],
    []
  )

  const underReviewCount = applications.filter(a => a.status === "under_review" || a.status === "submitted").length
  const draftCount       = applications.filter(a => a.status === "draft").length
  const approvedCount    = applications.filter(a => a.status === "approved").length

  return (
    <div className="partner-root min-h-screen bg-admin-bg p-4 sm:p-6 space-y-4">
      {/* Header */}
      <PageHeader
        title="Partner Onboarding Applications"
        subtitle="Review, verify documents side-by-side, edit details, and approve DSA Channel Partners."
        actions={
          <button
            onClick={fetchApplications}
            className="admin-focus py-1.5 px-3 bg-admin-surface border border-admin-border hover:bg-admin-bg text-admin-text text-admin-xs font-semibold rounded-admin-sm flex items-center gap-1.5 shadow-admin-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Applications" value={applications.length} icon={Building2} tone="info" loading={loading} />
        <StatCard label="Pending Approval" value={underReviewCount} hint="Requires Admin Review" icon={Clock} tone="warn" loading={loading} />
        <StatCard label="Drafts / Incomplete" value={draftCount} hint="Step 1-7 in progress" icon={Users} tone="subtle" loading={loading} />
        <StatCard label="Approved Partners" value={approvedCount} hint="Active DSA Partners" icon={CheckCircle2} tone="success" loading={loading} />
      </div>

      {/* Filter Toolbar */}
      <Toolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search name, mobile, PAN, Application ID…"
        chips={[
          { id: "all", label: "All", count: applications.length },
          { id: "under_review", label: "Under Review", count: underReviewCount },
          { id: "draft", label: "Drafts / Drop-offs", count: draftCount },
          { id: "query_raised", label: "Query Raised", count: applications.filter(a => a.status === "query_raised").length },
          { id: "approved", label: "Approved", count: approvedCount },
          { id: "rejected", label: "Rejected", count: applications.filter(a => a.status === "rejected").length },
        ]}
        activeChip={filterStatus}
        onChipChange={setFilterStatus}
      />

      {/* Main Split Layout: DataTable + Side-by-Side Inspector */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Table View */}
        <div className="flex-1 w-full min-w-0">
          <DataTable
            columns={columns}
            rows={filteredApps}
            getRowId={app => app.id || app.mobileNumber}
            loading={loading}
            onRowClick={app => {
              setSelectedApp(app)
              setSideDoc(null)
            }}
            emptyTitle="No partner applications found"
            emptyDescription="Partners who register or save onboarding steps will appear here."
          />
        </div>

        {/* Side-by-Side Verification Inspector Drawer */}
        {selectedApp && (
          <div className="w-full lg:w-[480px] xl:w-[520px] bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-2 p-5 space-y-4 shrink-0 max-h-[88vh] overflow-y-auto">
            {/* Inspector Top Bar */}
            <div className="flex items-start justify-between border-b border-admin-border pb-3">
              <div>
                <h3 className="text-admin-base font-bold text-admin-text leading-tight">
                  {selectedApp.fullName || selectedApp.contactPersonName || `Applicant (+91 ${selectedApp.mobileNumber})`}
                </h3>
                <p className="text-admin-2xs text-admin-subtle admin-num mt-0.5">
                  ID: {selectedApp.applicationId || selectedApp.mobileNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedApp(null)
                  setSideDoc(null)
                }}
                className="p-1 text-admin-subtle hover:text-admin-text rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Application Status Banner */}
            <div className="flex items-center justify-between bg-admin-bg border border-admin-border rounded-admin p-3 text-admin-xs">
              <span className="font-semibold text-admin-text">
                Status:{" "}
                {selectedApp.status === "approved" ? (
                  <span className="text-tone-success-fg font-bold">Approved ({selectedApp.dsaCode})</span>
                ) : selectedApp.status === "query_raised" ? (
                  <span className="text-tone-warn-fg font-bold">Query Raised</span>
                ) : selectedApp.status === "rejected" ? (
                  <span className="text-tone-danger-fg font-bold">Rejected</span>
                ) : selectedApp.status === "draft" ? (
                  <span className="text-admin-subtle font-bold">Draft (Step {selectedApp.currentStep || 1}/8)</span>
                ) : (
                  <span className="text-admin-accent font-bold">Under Review</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="admin-focus text-admin-xs font-bold text-admin-accent hover:underline flex items-center gap-1"
              >
                <Edit size={13} /> Edit Details
              </button>
            </div>

            {/* Details Breakdown */}
            <div className="space-y-3">
              {/* 1. Basic & Entity */}
              <SectionCard title="1. Basic & Entity Details">
                <div className="divide-y divide-admin-border">
                  <FactRow label="Full Name" value={selectedApp.fullName || "—"} />
                  <FactRow label="Mobile Number" value={`+91 ${selectedApp.mobileNumber}`} />
                  <FactRow label="Email" value={selectedApp.email || "—"} />
                  <FactRow label="Entity Type" value={`${selectedApp.partnerType || 'Individual'} ${selectedApp.firmType ? `(${selectedApp.firmType})` : ''}`} />
                  <FactRow label="PAN Number" value={<span className="font-mono font-bold">{selectedApp.panNumber || "—"}</span>} />
                </div>
              </SectionCard>

              {/* 2. Office Address */}
              <SectionCard title="2. Office Address">
                <div className="divide-y divide-admin-border">
                  <FactRow label="Address" value={`${selectedApp.addressLine1 || ''} ${selectedApp.addressLine2 || ''}`} />
                  <FactRow label="City & State" value={`${selectedApp.city || ''}, ${selectedApp.stateName || ''} - ${selectedApp.pinCode || ''}`} />
                  <FactRow label="GST Status" value={`${selectedApp.isGstRegistered || 'No'} ${selectedApp.gstin ? `(${selectedApp.gstin})` : ''}`} />
                </div>
              </SectionCard>

              {/* 3. KYC Documents & MOA PDF (Clicking views Side-by-Side) */}
              <SectionCard title="3. KYC Documents & Signed MOA Agreement">
                <div className="space-y-2 pt-1">
                  {/* Aadhaar Front */}
                  <div className="flex items-center justify-between p-2.5 bg-admin-bg border border-admin-border rounded-admin text-admin-xs">
                    <div>
                      <p className="font-semibold text-admin-text">
                        Aadhaar {selectedApp.documents?.aadhaarCombined ? "(Both Sides)" : "Front"}
                      </p>
                      <p className="text-admin-2xs text-admin-subtle truncate max-w-[180px]">
                        {selectedApp.documents?.aadhaarFrontDoc?.fileName || selectedApp.documents?.aadhaarDoc?.fileName || "Uploaded"}
                      </p>
                    </div>
                    {(() => {
                      const docObj = selectedApp.documents?.aadhaarFrontDoc || selectedApp.documents?.aadhaarDoc
                      const url = docObj?.fileUrl || docObj?.base64Data
                      return url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSideDoc({
                              title: "Aadhaar Card",
                              url,
                              fileName: docObj?.fileName || "Aadhaar_Document",
                            })
                          }
                          className="admin-focus py-1 px-2.5 rounded bg-admin-accent-soft text-admin-accent hover:bg-admin-accent hover:text-white font-bold text-admin-2xs transition-colors flex items-center gap-1"
                        >
                          <Eye size={12} /> View Document
                        </button>
                      ) : (
                        <span className="text-admin-subtle text-admin-2xs">Not uploaded</span>
                      )
                    })()}
                  </div>

                  {/* Aadhaar Back */}
                  {!selectedApp.documents?.aadhaarCombined && (
                    <div className="flex items-center justify-between p-2.5 bg-admin-bg border border-admin-border rounded-admin text-admin-xs">
                      <div>
                        <p className="font-semibold text-admin-text">Aadhaar Back Side</p>
                        <p className="text-admin-2xs text-admin-subtle truncate max-w-[180px]">
                          {selectedApp.documents?.aadhaarBackDoc?.fileName || "Uploaded"}
                        </p>
                      </div>
                      {(() => {
                        const docObj = selectedApp.documents?.aadhaarBackDoc
                        const url = docObj?.fileUrl || docObj?.base64Data
                        return url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSideDoc({
                                title: "Aadhaar Back Side",
                                url,
                                fileName: docObj?.fileName || "Aadhaar_Back",
                              })
                            }
                            className="admin-focus py-1 px-2.5 rounded bg-admin-accent-soft text-admin-accent hover:bg-admin-accent hover:text-white font-bold text-admin-2xs transition-colors flex items-center gap-1"
                          >
                            <Eye size={12} /> View Document
                          </button>
                        ) : (
                          <span className="text-admin-subtle text-admin-2xs">Not uploaded</span>
                        )
                      })()}
                    </div>
                  )}

                  {/* PAN Card */}
                  <div className="flex items-center justify-between p-2.5 bg-admin-bg border border-admin-border rounded-admin text-admin-xs">
                    <div>
                      <p className="font-semibold text-admin-text">PAN Card</p>
                      <p className="text-admin-2xs text-admin-subtle truncate max-w-[180px]">
                        {selectedApp.documents?.panDoc?.fileName || "Uploaded"}
                      </p>
                    </div>
                    {(() => {
                      const docObj = selectedApp.documents?.panDoc
                      const url = docObj?.fileUrl || docObj?.base64Data
                      return url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSideDoc({
                              title: "PAN Card",
                              url,
                              fileName: docObj?.fileName || "PAN_Card",
                            })
                          }
                          className="admin-focus py-1 px-2.5 rounded bg-admin-accent-soft text-admin-accent hover:bg-admin-accent hover:text-white font-bold text-admin-2xs transition-colors flex items-center gap-1"
                        >
                          <Eye size={12} /> View Document
                        </button>
                      ) : (
                        <span className="text-admin-subtle text-admin-2xs">Not uploaded</span>
                      )
                    })()}
                  </div>

                  {/* Executed MOA Agreement PDF */}
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-admin text-admin-xs">
                    <div>
                      <p className="font-bold text-emerald-900">Signed MOA Agreement (PDF)</p>
                      <p className="text-admin-2xs text-emerald-700">
                        {selectedApp.agreementSigned ? "✅ OTP Verified & Executed" : "Pending Signature"}
                      </p>
                    </div>
                    {(() => {
                      const mouUrl = selectedApp.agreementPdfUrl || `/api/partner/agreement/pdf?mobile=${selectedApp.mobileNumber}`
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setSideDoc({
                              title: `Signed MOA Agreement - ${selectedApp.fullName}`,
                              url: mouUrl,
                              fileName: `MOA_Agreement_${selectedApp.mobileNumber}.pdf`,
                            })
                          }
                          className="admin-focus py-1 px-2.5 rounded bg-emerald-600 text-white font-bold text-admin-2xs hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Eye size={12} /> View Signed MOA PDF
                        </button>
                      )
                    })()}
                  </div>
                </div>
              </SectionCard>

              {/* 4. Bank Account Details */}
              <SectionCard title="4. Bank Account & IFSC">
                <div className="divide-y divide-admin-border">
                  <FactRow label="Account Holder" value={selectedApp.bankDetails?.accountHolderName || selectedApp.fullName || "—"} />
                  <FactRow label="Bank Name" value={selectedApp.bankDetails?.bankName || "—"} />
                  <FactRow label="Account Number" value={<span className="font-mono font-bold">{selectedApp.bankDetails?.accountNumber || "—"}</span>} />
                  <FactRow label="IFSC Code" value={<span className="font-mono font-bold text-admin-accent">{selectedApp.bankDetails?.ifsc || "—"}</span>} />
                </div>
              </SectionCard>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-admin-border flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowQueryModal(true)}
                className="admin-focus py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-admin-xs rounded-admin transition-all"
              >
                Raise Query
              </button>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="admin-focus py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-admin-xs rounded-admin transition-all"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApprove(selectedApp)}
                disabled={actionLoading}
                className="admin-focus py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-admin-xs rounded-admin shadow-admin-1 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                <span>Approve Partner</span>
              </button>
            </div>
          </div>
        )}

        {/* Attached Side-by-Side Document Preview Panel (Renders on the same screen) */}
        {sideDoc && selectedApp && (
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
      {showQueryModal && selectedApp && (
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
                <option value="Contact Person">3. Contact Person</option>
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
      {showRejectModal && selectedApp && (
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

      {/* Admin Edit Application Details Modal */}
      {showEditModal && selectedApp && (
        <EditPartnerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          application={selectedApp}
          onSaved={() => fetchApplications()}
        />
      )}
    </div>
  )
}
