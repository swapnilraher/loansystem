"use client"

import React, { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock, IndianRupee, TrendingUp, Wallet } from "lucide-react"
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatINR, formatINRShort, toAmount } from "@/lib/hooks/useBanks"
import { formatDayShort } from "@/lib/dates"
import {
  AdminButton,
  Column,
  DataTable,
  PageHeader,
  Sheet,
  StatCard,
  StatusBadge,
  Toolbar,
  useToast,
} from "@/components/admin/ui"
import { Field, TextArea, TextInput } from "@/components/admin/leads/fields"

interface CommissionRow {
  id: string
  partnerName?: string
  dsaCode?: string
  customerName?: string
  productType?: string
  bankName?: string
  disbursedAmount?: string | number
  commissionAmount?: string | number
  commissionPercentage?: string
  status?: string
  utrNumber?: string
  settlementRemarks?: string
  approvedByName?: string
  createdAt?: unknown
  settledAt?: unknown
}

const PENDING = "Under Settlement"

export default function PayoutsPage() {
  const toast = useToast()
  const [rows, setRows] = useState<CommissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const [settling, setSettling] = useState<CommissionRow | null>(null)
  const [utr, setUtr] = useState("")
  const [remarks, setRemarks] = useState("")
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState<CommissionRow | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, "commission_ledger")), snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as CommissionRow)
      // Sorted in memory so Firestore needs no composite index.
      data.sort((a, b) => {
        const tA = (a.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
        const tB = (b.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
        return tB - tA
      })
      setRows(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const totals = useMemo(() => {
    const commission = rows.reduce((sum, row) => sum + toAmount(row.commissionAmount), 0)
    const disbursed = rows.reduce((sum, row) => sum + toAmount(row.disbursedAmount), 0)
    const pending = rows
      .filter(row => row.status === PENDING)
      .reduce((sum, row) => sum + toAmount(row.commissionAmount), 0)
    const settled = rows
      .filter(row => row.status === "Settled")
      .reduce((sum, row) => sum + toAmount(row.commissionAmount), 0)
    return { commission, disbursed, pending, settled }
  }, [rows])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter(row => {
      if (statusFilter !== "All" && (row.status || PENDING) !== statusFilter) return false
      if (!term) return true
      return `${row.partnerName || ""} ${row.customerName || ""} ${row.dsaCode || ""}`
        .toLowerCase()
        .includes(term)
    })
  }, [rows, search, statusFilter])

  const openSettle = (row: CommissionRow) => {
    setSettling(row)
    setUtr(row.utrNumber || "")
    setRemarks(row.settlementRemarks || "")
  }

  const settle = async () => {
    if (!settling) return
    if (!utr.trim()) {
      toast.push({ tone: "warn", title: "Enter the UTR before marking this settled" })
      return
    }
    setBusy(true)
    try {
      await updateDoc(doc(db, "commission_ledger", settling.id), {
        status: "Settled",
        utrNumber: utr.trim(),
        settlementRemarks: remarks.trim(),
        settledAt: serverTimestamp(),
      })
      toast.push({
        tone: "success",
        title: "Settlement recorded",
        description: `${formatINR(toAmount(settling.commissionAmount))} to ${settling.partnerName || "partner"}`,
      })
      setSettling(null)
    } catch (e) {
      console.error("Settlement failed:", e)
      toast.push({ tone: "danger", title: "Failed to record the settlement" })
    }
    setBusy(false)
  }

  const reject = async () => {
    if (!rejecting) return
    try {
      await updateDoc(doc(db, "commission_ledger", rejecting.id), {
        status: "Rejected",
        updatedAt: serverTimestamp(),
      })
      toast.push({ tone: "warn", title: "Payout rejected" })
    } catch (e) {
      console.error("Rejection failed:", e)
      toast.push({ tone: "danger", title: "Failed to reject this payout" })
    }
    setRejecting(null)
  }

  const columns: Column<CommissionRow>[] = useMemo(
    () => [
      {
        id: "partner",
        header: "Partner",
        card: "title",
        sortValue: row => row.partnerName || "",
        cell: row => (
          <span className="min-w-0 block">
            <span className="block font-medium truncate">{row.partnerName || "DSA partner"}</span>
            <span className="admin-num block text-admin-2xs text-admin-subtle truncate">
              {row.dsaCode || "No DSA code"}
            </span>
          </span>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        card: "meta",
        sortValue: row => row.customerName || "",
        cell: row => <span className="text-admin-muted truncate">{row.customerName || "—"}</span>,
      },
      {
        id: "bank",
        header: "Bank",
        card: "meta",
        sortValue: row => row.bankName || "",
        cell: row => <span className="text-admin-muted truncate">{row.bankName || "—"}</span>,
      },
      {
        id: "productType",
        header: "Loan Type",
        card: "meta",
        sortValue: row => row.productType || "",
        cell: row => <span className="text-admin-muted truncate">{row.productType || "—"}</span>,
      },
      {
        id: "disbursed",
        header: "Disbursed",
        align: "right",
        card: "meta",
        sortValue: row => toAmount(row.disbursedAmount),
        cell: row => formatINR(toAmount(row.disbursedAmount)),
      },
      {
        id: "commission",
        header: "Commission",
        align: "right",
        card: "meta",
        sortValue: row => toAmount(row.commissionAmount),
        cell: row => (
          <span className="font-medium">
            {formatINR(toAmount(row.commissionAmount))}
            {row.commissionPercentage && (
              <span className="text-admin-subtle"> · {row.commissionPercentage}%</span>
            )}
          </span>
        ),
      },
      {
        id: "utr",
        header: "UTR",
        card: "meta",
        defaultHidden: true,
        cell: row => <span className="admin-num text-admin-muted">{row.utrNumber || "—"}</span>,
      },
      {
        id: "created",
        header: "Booked",
        card: "meta",
        defaultHidden: true,
        cell: row => (
          <span className="text-admin-muted whitespace-nowrap">
            {formatDayShort(row.createdAt) || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        card: "trailing",
        sortValue: row => row.status || PENDING,
        cell: row => <StatusBadge status={row.status || PENDING} dot />,
      },
      {
        id: "actions",
        header: "",
        pinned: true,
        cell: row =>
          (row.status || PENDING) === PENDING ? (
            <div className="flex items-center justify-end gap-1.5">
              <AdminButton size="sm" variant="ghost" onClick={() => setRejecting(row)}>
                Reject
              </AdminButton>
              <AdminButton size="sm" variant="primary" onClick={() => openSettle(row)}>
                Settle
              </AdminButton>
            </div>
          ) : (
            <span className="admin-num text-admin-2xs text-admin-subtle">
              {row.utrNumber ? `UTR ${row.utrNumber}` : "—"}
            </span>
          ),
      },
    ],
    []
  )

  const pendingCount = rows.filter(row => (row.status || PENDING) === PENDING).length

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Payouts & commissions"
        subtitle="Connector commission is booked automatically when a Manager approves a disbursal. Settle it here once the transfer is made."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Commission booked"
          value={formatINRShort(totals.commission)}
          hint={`${rows.length} entries`}
          icon={TrendingUp}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="Awaiting settlement"
          value={formatINRShort(totals.pending)}
          hint={`${pendingCount} pending`}
          icon={Clock}
          tone={pendingCount ? "warn" : "neutral"}
          loading={loading}
        />
        <StatCard
          label="Settled"
          value={formatINRShort(totals.settled)}
          hint="transferred to partners"
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Disbursed volume"
          value={formatINRShort(totals.disbursed)}
          hint="behind these payouts"
          icon={Wallet}
          tone="violet"
          loading={loading}
        />
      </div>

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by partner or customer…"
        chips={[
          { id: "All", label: "All", count: rows.length },
          { id: PENDING, label: "Under settlement", count: pendingCount },
          {
            id: "Settled",
            label: "Settled",
            count: rows.filter(row => row.status === "Settled").length,
          },
          {
            id: "Rejected",
            label: "Rejected",
            count: rows.filter(row => row.status === "Rejected").length,
          },
        ]}
        activeChip={statusFilter}
        onChipChange={setStatusFilter}
      />

      <DataTable
        columns={columns}
        rows={filtered}
        getRowId={row => row.id}
        loading={loading}
        emptyTitle="No commission entries"
        emptyDescription="Entries appear here once a Manager approves a disbursal on a partner-sourced lead."
      />

      <Sheet
        open={!!settling}
        onClose={() => setSettling(null)}
        side="center"
        size="sm"
        title="Record settlement"
        description={
          settling
            ? `${formatINR(toAmount(settling.commissionAmount))} to ${settling.partnerName || "partner"}`
            : undefined
        }
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setSettling(null)}>
              Cancel
            </AdminButton>
            <AdminButton variant="primary" icon={IndianRupee} loading={busy} onClick={settle}>
              Mark settled
            </AdminButton>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="UTR / reference number" hint="Recorded against this payout for audit.">
            <TextInput
              autoFocus
              value={utr}
              onChange={e => setUtr(e.target.value)}
              placeholder="e.g. HDFC2026080612345"
              className="admin-num"
            />
          </Field>
          <Field label="Remarks (optional)">
            <TextArea
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Transfer date, batch reference…"
            />
          </Field>
        </div>
      </Sheet>

      <Sheet
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        side="center"
        size="sm"
        dismissOnBackdrop={false}
        title="Reject this payout?"
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setRejecting(null)}>
              Cancel
            </AdminButton>
            <AdminButton variant="danger" onClick={reject}>
              Reject payout
            </AdminButton>
          </>
        }
      >
        <p className="text-admin-sm text-admin-muted">
          The commission of{" "}
          <b className="text-admin-text">{formatINR(toAmount(rejecting?.commissionAmount))}</b> for{" "}
          <b className="text-admin-text">{rejecting?.partnerName || "this partner"}</b> will be marked
          rejected. The disbursal itself is not affected.
        </p>
      </Sheet>
    </div>
  )
}
