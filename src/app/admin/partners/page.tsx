"use client"

import React, { useMemo, useState } from "react"
import {
  Banknote,
  Briefcase,
  Building2,
  CheckCircle2,
  Network,
  ShieldCheck,

} from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { usePartners, Partner } from "@/lib/hooks/usePartners"
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
import { leadName } from "@/components/admin/leads/leadFilters"
import DocumentViewerModal from "@/components/ui/DocumentViewerModal"

const ALL_TYPES = "All types"
const ALL_STATUSES = "All statuses"

function partnerName(partner: Partner): string {
  return partner.kycData?.name || partner.panData?.name || "Unnamed partner"
}

/** Aadhaar KYC returns the address as an object of parts, or sometimes a string. */
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
  const { partners, loading } = usePartners()
  const { leads } = useLeads()
  const toast = useToast()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES)
  const [selected, setSelected] = useState<Partner | null>(null)
  const [tab, setTab] = useState<"overview" | "leads">("overview")
  const [viewDoc, setViewDoc] = useState<{ title: string; url?: string; fileName?: string } | null>(null)

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
    () => Array.from(new Set(partners.map(p => p.businessType).filter(Boolean))).sort(),
    [partners]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return partners.filter(partner => {
      if (
        term &&
        !`${partnerName(partner)} ${partner.dsaCode || ""} ${partner.mobileNumber || ""}`
          .toLowerCase()
          .includes(term)
      ) {
        return false
      }
      if (typeFilter !== ALL_TYPES && partner.businessType !== typeFilter) return false
      if (statusFilter !== ALL_STATUSES) {
        const currentSt = partner.dsaStatus || "Active"
        if (statusFilter === "Active" && currentSt !== "Active" && currentSt !== "approved") return false
        if (statusFilter === "under_review" && currentSt !== "under_review" && currentSt !== "submitted") return false
        if (statusFilter !== "Active" && statusFilter !== "under_review" && currentSt !== statusFilter) return false
      }
      return true
    })
  }, [partners, search, typeFilter, statusFilter])

  const partnerLeads = useMemo(
    () => (selected ? leads.filter(lead => lead.partnerId === selected.id) : []),
    [leads, selected]
  )

  const updateStatus = async (partnerId: string, nextStatus: string) => {
    try {
      await updateDoc(doc(db, "users", partnerId), {
        dsaStatus: nextStatus,
        updatedAt: new Date(),
      })
      if (selected?.id === partnerId) setSelected({ ...selected, dsaStatus: nextStatus })
      toast.push({ tone: "success", title: `Partner marked ${nextStatus}` })
    } catch (err) {
      console.error("Error updating status:", err)
      toast.push({ tone: "danger", title: "Failed to update status" })
    }
  }

  const columns: Column<Partner>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Partner",
        card: "title",
        sortValue: partner => partnerName(partner),
        cell: partner => (
          <span className="min-w-0 block">
            <span className="block font-medium truncate">{partnerName(partner)}</span>
            <span className="admin-num block text-admin-2xs text-admin-subtle truncate">
              {partner.dsaCode || "No DSA code"}
            </span>
          </span>
        ),
      },
      {
        id: "mobile",
        header: "Mobile",
        card: "meta",
        cell: partner => (
          <span className="admin-num text-admin-muted">{partner.mobileNumber || "—"}</span>
        ),
      },
      {
        id: "type",
        header: "Business type",
        card: "meta",
        sortValue: partner => partner.businessType || "",
        cell: partner => (
          <span className="text-admin-muted truncate">{partner.businessType || "Individual"}</span>
        ),
      },
      {
        id: "kyc",
        header: "Verification",
        card: "meta",
        cell: partner => (
          <span className="flex items-center gap-1">
            <StatusBadge
              tone={partner.kycVerified ? "success" : "danger"}
              status="eKYC"
              size="sm"
            />
            <StatusBadge tone={partner.panVerified ? "success" : "danger"} status="PAN" size="sm" />
          </span>
        ),
      },
      {
        id: "leads",
        header: "Leads",
        align: "right",
        card: "meta",
        sortValue: partner => stats[partner.id]?.leads ?? 0,
        cell: partner => stats[partner.id]?.leads ?? 0,
      },
      {
        id: "disbursed",
        header: "Disbursed",
        align: "right",
        card: "meta",
        sortValue: partner => stats[partner.id]?.disbursed ?? 0,
        cell: partner => stats[partner.id]?.disbursed ?? 0,
      },
      {
        id: "commission",
        header: "Commission",
        align: "right",
        card: "meta",
        sortValue: partner => stats[partner.id]?.commission ?? 0,
        cell: partner => formatINRShort(stats[partner.id]?.commission ?? 0),
      },
      {
        id: "joined",
        header: "Joined",
        card: "meta",
        defaultHidden: true,
        cell: partner => (
          <span className="text-admin-muted whitespace-nowrap">
            {formatDayShort(partner.createdAt) || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        card: "trailing",
        sortValue: partner => partner.dsaStatus || "Active",
        cell: partner => <StatusBadge status={partner.dsaStatus || "Active"} dot />,
      },
    ],
    [stats]
  )

  const activeCount = partners.filter(p => (p.dsaStatus || "Active") === "Active").length
  const totalCommission = Object.values(stats).reduce((sum, row) => sum + row.commission, 0)

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="DSA network"
        subtitle="Channel partners who source leads, and what they have earned."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total partners" value={partners.length} icon={Building2} tone="info" loading={loading} />
        <StatCard
          label="Active"
          value={activeCount}
          hint={`${partners.length - activeCount} inactive`}
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="KYC verified"
          value={partners.filter(p => p.kycVerified).length}
          hint="eKYC completed"
          icon={ShieldCheck}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Commission payable"
          value={formatINRShort(totalCommission)}
          hint="on confirmed disbursals"
          icon={Banknote}
          tone="warn"
          href="/admin/payouts"
          loading={loading}
        />
      </div>

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, DSA code or mobile…"
        chips={[
          { id: ALL_STATUSES, label: "All", count: partners.length },
          { id: "under_review", label: "Under Review", count: partners.filter(p => p.dsaStatus === "under_review" || p.dsaStatus === "submitted").length },
          { id: "draft", label: "Drafts", count: partners.filter(p => p.dsaStatus === "draft").length },
          { id: "Active", label: "Active / Approved", count: partners.filter(p => p.dsaStatus === "Active" || p.dsaStatus === "approved").length },
          { id: "Inactive", label: "Inactive", count: partners.filter(p => p.dsaStatus === "Inactive").length },
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

      <DataTable
        columns={columns}
        rows={filtered}
        getRowId={partner => partner.id}
        loading={loading}
        onRowClick={partner => {
          setSelected(partner)
          setTab("overview")
        }}
        emptyTitle="No partners found"
        emptyDescription="DSA partners who register through the portal appear here."
        getRowClassName={partner =>
          (partner.dsaStatus || "Active") === "Active" ? undefined : "opacity-60"
        }
      />

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        side="right"
        size="md"
        title={selected ? partnerName(selected) : undefined}
        description={selected ? `${selected.dsaCode || "No DSA code"} · ${selected.businessType || "Individual"}` : undefined}
      >
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Select
                value={selected.dsaStatus || "Active"}
                onChange={e => updateStatus(selected.id, e.target.value)}
                className="w-auto"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </Select>
              <StatusBadge tone={selected.kycVerified ? "success" : "danger"} status="eKYC" />
              <StatusBadge tone={selected.panVerified ? "success" : "danger"} status="PAN" />
            </div>

            <div className="flex gap-1 border-b border-admin-border">
              {(
                [
                  ["overview", "Overview"],
                  ["leads", `Leads (${partnerLeads.length})`],
                ] as ["overview" | "leads", string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`admin-focus px-2.5 h-9 text-admin-sm border-b-2 -mb-px transition-colors ${
                    tab === id
                      ? "border-admin-accent text-admin-text font-semibold"
                      : "border-transparent text-admin-muted hover:text-admin-text"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "overview" ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Metric label="Leads" value={stats[selected.id]?.leads ?? 0} />
                  <Metric label="Disbursed" value={stats[selected.id]?.disbursed ?? 0} />
                  <Metric
                    label="Commission"
                    value={formatINRShort(stats[selected.id]?.commission ?? 0)}
                  />
                </div>

                <SectionCard title="Contact">
                  <div className="divide-y divide-admin-border">
                    <FactRow
                      label="Mobile"
                      value={
                        selected.mobileNumber ? (
                          <a
                            href={`tel:${selected.mobileNumber}`}
                            className="admin-focus admin-num text-admin-accent hover:underline"
                          >
                            {selected.mobileNumber}
                          </a>
                        ) : (
                          "—"
                        )
                      }
                    />
                    <FactRow label="Business type" value={selected.businessType || "Individual"} />
                    <FactRow label="Registered" value={formatDayShort(selected.createdAt) || "—"} />
                  </div>
                </SectionCard>

                <SectionCard title="Identity & KYC Documents">
                  <div className="divide-y divide-admin-border">
                    <FactRow label="PAN number" value={selected.panData?.panNumber || "—"} />
                    <FactRow label="PAN name" value={selected.panData?.name || "—"} />
                    <FactRow label="Date of birth" value={selected.kycData?.dob || "—"} />
                    <FactRow label="Address" value={formatAddress(selected.kycData?.address)} />
                    {(selected as any).mobileNumber && (
                      <FactRow
                        label="KYC / Agreement PDF"
                        value={
                          <button
                            type="button"
                            onClick={() =>
                              setViewDoc({
                                title: `MOU Agreement - ${partnerName(selected)}`,
                                url: `/api/partner/agreement/pdf?mobile=${selected.mobileNumber}`,
                                fileName: `MOU_Agreement_${selected.dsaCode || selected.mobileNumber}.pdf`,
                              })
                            }
                            className="admin-focus text-admin-xs font-bold text-admin-accent hover:underline flex items-center gap-1"
                          >
                            📄 View Signed MOU PDF
                          </button>
                        }
                      />
                    )}
                  </div>
                </SectionCard>

                <SectionCard title="Bank details">
                  {selected.bankDetails ? (
                    <div className="divide-y divide-admin-border">
                      <FactRow label="Account holder" value={selected.bankDetails.nameAtBank || "—"} />
                      <FactRow label="Bank" value={selected.bankDetails.bankName || "—"} />
                      <FactRow label="IFSC" value={selected.bankDetails.ifsc || "—"} />
                      <FactRow
                        label="Account number"
                        value={selected.bankDetails.accountNumber || "—"}
                      />
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

                {selected.agreementData?.signedAt && (
                  <SectionCard title="Agreement">
                    <div className="divide-y divide-admin-border">
                      <FactRow
                        label="Signed"
                        value={formatDayShort(selected.agreementData.signedAt) || "—"}
                      />
                      <FactRow label="Version" value={selected.agreementData.version || "—"} />
                    </div>
                  </SectionCard>
                )}
              </>
            ) : partnerLeads.length === 0 ? (
              <EmptyState
                size="sm"
                icon={Briefcase}
                title="No leads sourced yet"
                description="Leads this partner sends appear here as soon as they arrive."
              />
            ) : (
              <SectionCard title="Sourced leads">
                <ul className="divide-y divide-admin-border">
                  {partnerLeads.map(lead => (
                    <li key={lead.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-admin-sm text-admin-text truncate">
                          {leadName(lead)}
                        </span>
                        <span className="block text-admin-2xs text-admin-subtle truncate">
                          {lead.type || "Loan"} · {formatINR(toAmount(lead.amount))}
                        </span>
                      </span>
                      <StatusBadge status={lead.status} dot />
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </div>
        )}
      </Sheet>

      {!loading && partners.length === 0 && (
        <p className="text-admin-xs text-admin-subtle flex items-center gap-1.5">
          <Network size={12} /> Partners register themselves through the DSA portal.
        </p>
      )}

      {/* Document Viewer Modal Popup */}
      {viewDoc && (
        <DocumentViewerModal
          isOpen={!!viewDoc}
          title={viewDoc.title}
          fileUrl={viewDoc.url}
          fileName={viewDoc.fileName}
          onClose={() => setViewDoc(null)}
        />
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-admin-surface border border-admin-border rounded-admin p-3 min-w-0">
      <p className="text-admin-2xs uppercase tracking-wide text-admin-subtle">{label}</p>
      <p className="admin-num text-admin-base font-semibold text-admin-text mt-0.5 truncate">
        {value}
      </p>
    </div>
  )
}
