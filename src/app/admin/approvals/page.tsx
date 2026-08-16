"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Phone,
  ShieldCheck,
  User,
  Wallet,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useLeads, Lead } from "@/lib/hooks/useLeads"
import { Bank, formatINR, formatINRShort, toAmount, useBanks } from "@/lib/hooks/useBanks"
import { useNow } from "@/lib/hooks/useNow"
import { can } from "@/lib/permissions"
import { timeAgo, toMillis } from "@/lib/dates"
import {
  approveDisbursement,
  calcPayouts,
  rejectDisbursement,
  StaffRef,
  STATUS_PENDING_APPROVAL,
  suggestedDisbursedAmount,
} from "@/lib/disbursement"
import {
  AdminButton,
  EmptyState,
  PageHeader,
  Sheet,
  Skeleton,
  StatCard,
  StatusBadge,
  useToast,
} from "@/components/admin/ui"
import { Field, Select, TextArea, TextInput } from "@/components/admin/leads/fields"
import { leadName, leadPhone } from "@/components/admin/leads/leadFilters"

const LOAN_TYPES = [
  "Personal Loan",
  "Business Loan",
  "Home Loan",
  "Loan Against Property",
  "Car Loan",
  "Education Loan",
  "Gold Loan",
]

export default function DisbursementApprovalsPage() {
  const { user, profile, adminRole, role } = useAuth()
  const { leads, loading } = useLeads()
  const { banks } = useBanks()
  const toast = useToast()
  const now = useNow()

  const canApprove = can(role, "disbursement:approve")
  const [selected, setSelected] = useState<Lead | null>(null)
  const [mode, setMode] = useState<"approve" | "reject">("approve")
  const [bankId, setBankId] = useState("")
  const [productType, setProductType] = useState("")
  const activeBanks = useMemo(
    () => banks.filter(b => b.active && (!productType || b.type === productType)),
    [banks, productType]
  )
  const [amountInput, setAmountInput] = useState("")
  /** null means "follow the bank rate card"; a string is a manual override. */
  const [incentiveOverride, setIncentiveOverride] = useState<string | null>(null)
  const [commissionOverride, setCommissionOverride] = useState<string | null>(null)
  const [remarks, setRemarks] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const pending = useMemo(
    () =>
      leads
        .filter(l => l.status === STATUS_PENDING_APPROVAL)
        .sort(
          (a, b) =>
            (toMillis(a.disbursementRequestedAt) ?? 0) - (toMillis(b.disbursementRequestedAt) ?? 0)
        ),
    [leads]
  )

  const decided = useMemo(
    () =>
      leads
        .filter(l => l.approvalStatus === "Approved" || l.approvalStatus === "Rejected")
        .sort(
          (a, b) =>
            (toMillis(b.approvedAt ?? b.rejectedAt) ?? 0) - (toMillis(a.approvedAt ?? a.rejectedAt) ?? 0)
        )
        .slice(0, 15),
    [leads]
  )

  const kpis = useMemo(() => {
    const pendingVolume = pending.reduce((s, l) => s + suggestedDisbursedAmount(l), 0)
    const approved = leads.filter(l => l.approvalStatus === "Approved")
    return {
      pendingVolume,
      approvedCount: approved.length,
      approvedVolume: approved.reduce((s, l) => s + toAmount(l.disbursedAmount), 0),
      incentiveReleased: approved.reduce((s, l) => s + (Number(l.staffIncentiveAmount) || 0), 0),
    }
  }, [pending, leads])

  const selectedBank: Bank | null = useMemo(
    () => activeBanks.find(b => b.id === bankId) || null,
    [activeBanks, bankId]
  )

  // Auto-calculated from the rate card, unless the manager has typed over it.
  // Derived rather than pushed into state by an effect, so changing the bank can
  // never leave a stale figure on screen.
  const autoPayouts = useMemo(
    () => calcPayouts(selectedBank, toAmount(amountInput)),
    [selectedBank, amountInput]
  )
  const incentiveValue = incentiveOverride ?? String(autoPayouts.staffIncentive)
  const commissionValue = commissionOverride ?? String(autoPayouts.connectorCommission)

  const openReview = (lead: Lead, nextMode: "approve" | "reject") => {
    setSelected(lead)
    setMode(nextMode)
    setBankId(lead.bankId || "")
    setProductType(lead.type || "Personal Loan")
    setAmountInput(String(suggestedDisbursedAmount(lead) || ""))
    setIncentiveOverride(null)
    setCommissionOverride(null)
    setRemarks("")
    setRejectReason("")
    setFormError(null)
  }

  const approver: StaffRef = {
    uid: user?.uid,
    name: profile?.name || user?.displayName || user?.email || "Manager",
    email: user?.email,
    label: `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || "Manager"})`,
  }

  const handleApprove = async () => {
    if (!selected) return
    const amount = toAmount(amountInput)
    if (!amount || amount <= 0) return setFormError("Enter the confirmed disbursed amount.")
    if (!selectedBank) return setFormError("Select the bank that disbursed this file.")
    if (!productType) return setFormError("Select the confirmed loan type.")

    const incentive = toAmount(incentiveValue)
    const commission = toAmount(commissionValue)
    if (incentive < 0 || commission < 0) return setFormError("Payout amounts cannot be negative.")

    setBusy(true)
    setFormError(null)
    try {
      await approveDisbursement({
        lead: selected,
        bank: selectedBank,
        disbursedAmount: amount,
        staffIncentive: incentive,
        connectorCommission: selected.partnerId ? commission : 0,
        approver,
        remarks,
        productType,
      })
      toast.push({
        tone: "success",
        title: "Disbursal confirmed",
        description: `${formatINR(amount)} via ${selectedBank.name}`,
      })
      setSelected(null)
    } catch (err) {
      console.error("Approval failed:", err)
      setFormError("Could not approve this disbursal. Please try again.")
    }
    setBusy(false)
  }

  const handleReject = async () => {
    if (!selected) return
    if (!rejectReason.trim()) {
      return setFormError("Add a reason so the telecaller knows what to fix.")
    }

    setBusy(true)
    setFormError(null)
    try {
      await rejectDisbursement(selected, rejectReason.trim(), approver)
      toast.push({ tone: "warn", title: "Request rejected and sent back" })
      setSelected(null)
    } catch (err) {
      console.error("Rejection failed:", err)
      setFormError("Could not reject this request. Please try again.")
    }
    setBusy(false)
  }

  if (!canApprove) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Managers and Admins only"
        description="Disbursals you mark are reviewed here by a Manager before the incentive is released."
      />
    )
  }

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Disbursal approvals"
        subtitle="Verify the file, pick the bank and release the incentive. Nothing is paid out until you approve."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Pending approval"
          value={pending.length}
          hint={formatINRShort(kpis.pendingVolume)}
          icon={Clock}
          tone={pending.length ? "warn" : "neutral"}
          loading={loading}
        />
        <StatCard
          label="Confirmed disbursed"
          value={kpis.approvedCount}
          hint={formatINRShort(kpis.approvedVolume)}
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Incentive released"
          value={formatINRShort(kpis.incentiveReleased)}
          hint="paid to staff"
          icon={Wallet}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Banks available"
          value={activeBanks.length}
          hint="on the rate card"
          icon={Building2}
          tone={activeBanks.length ? "info" : "danger"}
          href={can(role, "banks:manage") ? "/admin/banks" : undefined}
        />
      </div>

      {activeBanks.length === 0 && (
        <div className="flex items-start gap-2.5 bg-tone-warn border border-tone-warn-bd rounded-admin p-3">
          <AlertTriangle size={16} className="text-tone-warn-fg shrink-0 mt-0.5" />
          <p className="text-admin-sm text-tone-warn-fg">
            No banks configured yet, so incentives cannot be calculated.{" "}
            {can(role, "banks:manage") ? (
              <Link href="/admin/banks" className="underline underline-offset-2 font-semibold">
                Add banks and rates
              </Link>
            ) : (
              "Ask an Administrator to add banks and rates."
            )}
          </p>
        </div>
      )}

      <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-admin-border">
          <h2 className="text-admin-base font-semibold text-admin-text">Waiting on you</h2>
          {pending.length > 0 && (
            <span className="admin-num px-1.5 py-0.5 rounded-admin-sm bg-tone-warn text-tone-warn-fg border border-tone-warn-bd text-admin-2xs font-semibold">
              {pending.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : pending.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nothing pending"
            description="Every disbursal has been signed off."
          />
        ) : (
          <ul className="divide-y divide-admin-border">
            {pending.map(lead => (
              <li
                key={lead.id}
                className="p-3.5 flex flex-col md:flex-row md:items-center gap-3 hover:bg-admin-surface-2 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-admin-base font-semibold text-admin-text truncate">
                      {leadName(lead)}
                    </h3>
                    <StatusBadge status={lead.status} dot />
                    {lead.partnerId && (
                      <StatusBadge
                        tone="info"
                        status={`DSA · ${lead.partnerName || lead.dsaCode || "Connector"}`}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-1.5 text-admin-xs text-admin-muted">
                    <span className="admin-num flex items-center gap-1">
                      <Phone size={11} /> {leadPhone(lead) || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={11} /> {lead.assignedToName || "Unassigned"}
                    </span>
                    <span>{lead.type || "Loan"}</span>
                    <span className="text-admin-subtle">
                      requested {timeAgo(lead.disbursementRequestedAt, now)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  <div className="md:text-right">
                    <p className="text-admin-2xs uppercase tracking-wide text-admin-subtle">
                      Claimed amount
                    </p>
                    <p className="admin-num text-admin-lg font-semibold text-admin-text">
                      {formatINR(suggestedDisbursedAmount(lead))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AdminButton size="sm" variant="danger" onClick={() => openReview(lead, "reject")}>
                      Reject
                    </AdminButton>
                    <AdminButton
                      size="sm"
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={() => openReview(lead, "approve")}
                    >
                      Review
                    </AdminButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-admin-border">
            <h2 className="text-admin-base font-semibold text-admin-text">Recent decisions</h2>
          </div>
          <ul className="divide-y divide-admin-border">
            {decided.map(lead => {
              const approved = lead.approvalStatus === "Approved"
              return (
                <li key={lead.id} className="px-4 py-2.5 flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-admin-sm border flex items-center justify-center shrink-0 ${
                      approved
                        ? "bg-tone-success border-tone-success-bd text-tone-success-fg"
                        : "bg-tone-danger border-tone-danger-bd text-tone-danger-fg"
                    }`}
                  >
                    {approved ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-admin-sm text-admin-text truncate">{leadName(lead)}</p>
                    <p className="text-admin-2xs text-admin-subtle truncate">
                      {approved
                        ? `${lead.bankName || "Bank"} · ${lead.type || "Loan"} · ${formatINR(toAmount(lead.disbursedAmount))} · incentive ${formatINR(Number(lead.staffIncentiveAmount) || 0)}`
                        : lead.rejectionReason || "Rejected"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-admin-2xs font-semibold ${
                        approved ? "text-tone-success-fg" : "text-tone-danger-fg"
                      }`}
                    >
                      {approved ? "Confirmed" : "Rejected"}
                    </p>
                    <p className="text-admin-2xs text-admin-subtle">
                      {(approved ? lead.approvedByName : lead.rejectedByName) || "—"} ·{" "}
                      {timeAgo(lead.approvedAt ?? lead.rejectedAt, now)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        side="right"
        size="md"
        title={selected ? leadName(selected) : undefined}
        description={
          selected
            ? `${selected.type || "Loan"} · ${leadPhone(selected) || "—"} · closed by ${selected.assignedToName || "Unassigned"}`
            : undefined
        }
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </AdminButton>
            <AdminButton
              variant={mode === "approve" ? "primary" : "danger"}
              icon={mode === "approve" ? CheckCircle2 : XCircle}
              loading={busy}
              onClick={mode === "approve" ? handleApprove : handleReject}
            >
              {mode === "approve" ? "Approve disbursal" : "Reject request"}
            </AdminButton>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex gap-1 p-1 bg-admin-surface-2 border border-admin-border rounded-admin-sm">
              {(["approve", "reject"] as const).map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setMode(option)
                    setFormError(null)
                  }}
                  className={`admin-focus flex-1 h-8 rounded-admin-sm text-admin-xs font-semibold capitalize transition-colors ${
                    mode === option
                      ? "bg-admin-surface text-admin-text shadow-admin-1"
                      : "text-admin-muted hover:text-admin-text"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {mode === "approve" ? (
              <>
                <Field label="Bank">
                  <Select value={bankId} onChange={e => setBankId(e.target.value)}>
                    <option value="">Select the disbursing bank…</option>
                    {activeBanks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} — incentive {formatINR(bank.staffIncentive)} · connector{" "}
                        {bank.connectorCommission}%
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Loan Type (लोन प्रकार)">
                  <Select value={productType} onChange={e => setProductType(e.target.value)}>
                    <option value="">Select the confirmed loan type…</option>
                    {LOAN_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Disbursed amount (₹)">
                  <TextInput
                    type="number"
                    min={0}
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className="admin-num h-11 text-admin-lg font-semibold"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="Staff incentive (₹)"
                    hint={
                      selected.assignedToName
                        ? `Credited to ${selected.assignedToName}`
                        : "No owner — nothing credited"
                    }
                  >
                    <TextInput
                      type="number"
                      min={0}
                      value={incentiveValue}
                      onChange={e => setIncentiveOverride(e.target.value)}
                      className="admin-num"
                    />
                  </Field>

                  <Field
                    label="Connector commission (₹)"
                    hint={
                      selected.partnerId
                        ? `${selected.partnerName || "Connector"} @ ${selectedBank?.connectorCommission ?? 0}%`
                        : "Direct lead — no connector"
                    }
                  >
                    <TextInput
                      type="number"
                      min={0}
                      value={selected.partnerId ? commissionValue : "0"}
                      disabled={!selected.partnerId}
                      onChange={e => setCommissionOverride(e.target.value)}
                      className="admin-num"
                    />
                  </Field>
                </div>

                <Field label="Remarks (optional)">
                  <TextArea
                    rows={3}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Sanction letter verified, UTR received…"
                  />
                </Field>

                <div className="bg-admin-surface-2 border border-admin-border rounded-admin p-3 space-y-2">
                  <p className="text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">
                    On approval
                  </p>
                  <Row label="Lead status" value="Confirmed disbursed" tone="success" />
                  <Row label="Staff incentive" value={formatINR(toAmount(incentiveValue))} />
                  <Row
                    label="Connector commission"
                    value={selected.partnerId ? formatINR(toAmount(commissionValue)) : "—"}
                  />
                </div>
              </>
            ) : (
              <>
                <Field label="Reason for rejection">
                  <TextArea
                    rows={4}
                    autoFocus
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="e.g. Disbursement memo not attached, amount does not match the sanction letter."
                  />
                </Field>
                <p className="text-admin-xs text-admin-muted bg-admin-surface-2 border border-admin-border rounded-admin-sm px-3 py-2.5">
                  The file goes back to{" "}
                  <b className="text-admin-text">{selected.preApprovalStatus || "Under Process"}</b> and
                  the reason is logged on the timeline for {selected.assignedToName || "the telecaller"}.
                </p>
              </>
            )}

            {formError && (
              <p className="text-admin-xs font-medium text-tone-danger-fg bg-tone-danger border border-tone-danger-bd rounded-admin-sm px-3 py-2">
                {formError}
              </p>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}

function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "success"
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-admin-sm">
      <span className="text-admin-muted">{label}</span>
      <span
        className={`admin-num font-semibold ${tone === "success" ? "text-tone-success-fg" : "text-admin-text"}`}
      >
        {value}
      </span>
    </div>
  )
}
