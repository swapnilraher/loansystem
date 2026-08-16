"use client"

import React, { useMemo, useState } from "react"
import { Building2, IndianRupee, Percent, Plus, Power, ShieldCheck, Trash2 } from "lucide-react"
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { can } from "@/lib/permissions"
import { Bank, formatINR, formatINRShort, toAmount, useBanks } from "@/lib/hooks/useBanks"
import { useLeads } from "@/lib/hooks/useLeads"
import { STATUS_DISBURSED } from "@/lib/disbursement"
import {
  AdminButton,
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
import { Field, Select, TextArea, TextInput } from "@/components/admin/leads/fields"

const LOAN_TYPES = [
  "Personal Loan",
  "Business Loan",
  "Home Loan",
  "Loan Against Property",
  "Car Loan",
  "Education Loan",
  "Gold Loan",
]

const EMPTY_FORM = {
  name: "",
  type: "Personal Loan",
  staffIncentive: "",
  connectorCommission: "",
  notes: "",
  active: true,
}

interface BankPerformance {
  files: number
  volume: number
  incentive: number
  commission: number
}

export default function BanksPage() {
  const { role } = useAuth()
  const toast = useToast()
  const canManage = can(role, "banks:manage")
  const { banks, loading } = useBanks()
  const { leads } = useLeads()

  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Bank | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Bank | null>(null)

  /** Bank-wise performance, computed from confirmed disbursals only. */
  const performance = useMemo(() => {
    const byBank: Record<string, BankPerformance> = {}
    leads.forEach(lead => {
      if (lead.status !== STATUS_DISBURSED || !lead.bankName) return
      const row = byBank[lead.bankName] || { files: 0, volume: 0, incentive: 0, commission: 0 }
      row.files += 1
      row.volume += toAmount(lead.disbursedAmount) || toAmount(lead.amount)
      row.incentive += Number(lead.staffIncentiveAmount) || 0
      row.commission += Number(lead.connectorCommissionAmount) || 0
      byBank[lead.bankName] = row
    })
    return byBank
  }, [leads])

  const filtered = useMemo(
    () => banks.filter(bank => bank.name.toLowerCase().includes(search.trim().toLowerCase())),
    [banks, search]
  )

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (bank: Bank) => {
    setEditing(bank)
    setForm({
      name: bank.name,
      type: bank.type || "Personal Loan",
      staffIncentive: String(bank.staffIncentive ?? ""),
      connectorCommission: String(bank.connectorCommission ?? ""),
      notes: bank.notes || "",
      active: bank.active,
    })
    setFormError(null)
    setFormOpen(true)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canManage) return

    const name = form.name.trim()
    const staffIncentive = Number(form.staffIncentive)
    const connectorCommission = Number(form.connectorCommission)

    if (!name) return setFormError("Bank name is required.")
    if (isNaN(staffIncentive) || staffIncentive < 0) {
      return setFormError("Staff incentive must be a positive amount.")
    }
    if (isNaN(connectorCommission) || connectorCommission < 0 || connectorCommission > 100) {
      return setFormError("Connector commission must be a percentage between 0 and 100.")
    }
    // Two banks with the same name and loan type would make the approval screen ambiguous.
    if (banks.some(b => b.name.trim().toLowerCase() === name.toLowerCase() && (b.type || "Personal Loan") === form.type && b.id !== editing?.id)) {
      return setFormError(`${name} (${form.type}) is already on the rate card.`)
    }

    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        name,
        type: form.type,
        staffIncentive,
        connectorCommission,
        notes: form.notes.trim(),
        active: form.active,
        updatedAt: serverTimestamp(),
      }
      if (editing) {
        await updateDoc(doc(db, "banks", editing.id), payload)
      } else {
        await addDoc(collection(db, "banks"), { ...payload, createdAt: serverTimestamp() })
      }
      toast.push({ tone: "success", title: editing ? `${name} updated` : `${name} added` })
      setFormOpen(false)
      setForm(EMPTY_FORM)
      setEditing(null)
    } catch (err) {
      console.error("Error saving bank:", err)
      setFormError("Could not save the bank. Please try again.")
    }
    setSaving(false)
  }

  const toggleActive = async (bank: Bank) => {
    if (!canManage) return
    try {
      await updateDoc(doc(db, "banks", bank.id), {
        active: !bank.active,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error("Error toggling bank:", err)
      toast.push({ tone: "danger", title: "Could not change this bank's status" })
    }
  }

  const remove = async () => {
    if (!confirmDelete) return
    try {
      await deleteDoc(doc(db, "banks", confirmDelete.id))
      toast.push({ tone: "success", title: `${confirmDelete.name} removed from the rate card` })
    } catch (err) {
      console.error("Error deleting bank:", err)
      toast.push({ tone: "danger", title: "Could not remove this bank" })
    }
    setConfirmDelete(null)
  }

  const columns: Column<Bank>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Bank",
        card: "title",
        sortValue: bank => bank.name,
        cell: bank => (
          <span className="min-w-0 block">
            <span className="block font-medium truncate">
              {bank.name} <span className="text-admin-2xs text-admin-muted font-normal">({bank.type || "Personal Loan"})</span>
            </span>
            {bank.notes && (
              <span className="block text-admin-2xs text-admin-subtle truncate">{bank.notes}</span>
            )}
          </span>
        ),
      },
      {
        id: "incentive",
        header: "Staff incentive",
        align: "right",
        card: "meta",
        sortValue: bank => bank.staffIncentive,
        cell: bank => formatINR(bank.staffIncentive),
      },
      {
        id: "commission",
        header: "Connector %",
        align: "right",
        card: "meta",
        sortValue: bank => bank.connectorCommission,
        cell: bank => `${bank.connectorCommission}%`,
      },
      {
        id: "files",
        header: "Files disbursed",
        align: "right",
        card: "meta",
        sortValue: bank => performance[bank.name]?.files ?? 0,
        cell: bank => performance[bank.name]?.files ?? 0,
      },
      {
        id: "volume",
        header: "Volume",
        align: "right",
        card: "meta",
        sortValue: bank => performance[bank.name]?.volume ?? 0,
        cell: bank => formatINRShort(performance[bank.name]?.volume ?? 0),
      },
      {
        id: "paid",
        header: "Incentive paid",
        align: "right",
        card: "meta",
        defaultHidden: true,
        sortValue: bank => performance[bank.name]?.incentive ?? 0,
        cell: bank => formatINRShort(performance[bank.name]?.incentive ?? 0),
      },
      {
        id: "status",
        header: "Status",
        card: "trailing",
        sortValue: bank => (bank.active ? "Active" : "Inactive"),
        cell: bank => <StatusBadge status={bank.active ? "Active" : "Inactive"} dot />,
      },
      {
        id: "actions",
        header: "",
        pinned: true,
        cell: bank => (
          <div className="flex items-center justify-end gap-1.5">
            <AdminButton size="sm" variant="ghost" onClick={() => openEdit(bank)}>
              Edit
            </AdminButton>
            <AdminButton size="sm" variant="ghost" icon={Power} onClick={() => toggleActive(bank)}>
              {bank.active ? "Disable" : "Enable"}
            </AdminButton>
            <AdminButton
              size="sm"
              variant="ghost"
              icon={Trash2}
              aria-label={`Remove ${bank.name}`}
              className="text-tone-danger-fg"
              onClick={() => setConfirmDelete(bank)}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [performance]
  )

  if (!canManage) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin only"
        description="Bank incentive and connector commission rates are managed by an Administrator."
      />
    )
  }

  const activeCount = banks.filter(bank => bank.active).length

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Banks & rate card"
        subtitle="Staff incentive and connector commission are applied automatically when a Manager approves a disbursal."
        actions={
          <AdminButton size="sm" variant="primary" icon={Plus} onClick={openCreate}>
            Add bank
          </AdminButton>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Banks configured"
          value={banks.length}
          icon={Building2}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="Active"
          value={activeCount}
          hint={`${banks.length - activeCount} disabled`}
          icon={Power}
          tone={activeCount ? "success" : "warn"}
          loading={loading}
        />
        <StatCard
          label="Avg staff incentive"
          value={
            banks.length
              ? formatINR(banks.reduce((s, b) => s + b.staffIncentive, 0) / banks.length)
              : "₹0"
          }
          icon={IndianRupee}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Avg connector rate"
          value={
            banks.length
              ? `${(banks.reduce((s, b) => s + b.connectorCommission, 0) / banks.length).toFixed(2)}%`
              : "0%"
          }
          icon={Percent}
          tone="warn"
          loading={loading}
        />
      </div>

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search banks…" />

      <DataTable
        columns={columns}
        rows={filtered}
        getRowId={bank => bank.id}
        loading={loading}
        emptyTitle="No banks on the rate card"
        emptyDescription="Incentives cannot be calculated until at least one bank is configured."
        emptyAction={
          <AdminButton variant="primary" icon={Plus} onClick={openCreate}>
            Add bank
          </AdminButton>
        }
        getRowClassName={bank => (bank.active ? undefined : "opacity-60")}
      />

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        side="right"
        size="sm"
        title={editing ? `Edit ${editing.name}` : "Add bank"}
        description="These figures drive every payout calculated at approval time."
      >
        <form onSubmit={save} className="space-y-3">
          <Field label="Bank name">
            <TextInput
              required
              autoFocus
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. HDFC Bank"
            />
          </Field>

          <Field label="Loan Type (लोन प्रकार)">
            <Select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              {LOAN_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Staff incentive (₹ per disbursed file)">
            <TextInput
              type="number"
              min={0}
              required
              value={form.staffIncentive}
              onChange={e => setForm({ ...form, staffIncentive: e.target.value })}
              className="admin-num"
              placeholder="2500"
            />
          </Field>

          <Field
            label="Connector commission (%)"
            hint="Percentage of the disbursed amount paid to the sourcing DSA."
          >
            <TextInput
              type="number"
              min={0}
              max={100}
              step="0.01"
              required
              value={form.connectorCommission}
              onChange={e => setForm({ ...form, connectorCommission: e.target.value })}
              className="admin-num"
              placeholder="1.25"
            />
          </Field>

          <Field label="Notes (optional)">
            <TextArea
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Payout cycle, relationship manager, special conditions…"
            />
          </Field>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
              className="admin-focus w-3.5 h-3.5 rounded-sm border border-admin-border-strong accent-admin-accent cursor-pointer"
            />
            <span className="text-admin-sm text-admin-text">Available on the approval screen</span>
          </label>

          {formError && (
            <p className="text-admin-xs font-medium text-tone-danger-fg bg-tone-danger border border-tone-danger-bd rounded-admin-sm px-3 py-2">
              {formError}
            </p>
          )}

          <AdminButton type="submit" variant="primary" className="w-full" loading={saving}>
            {editing ? "Save changes" : "Add bank"}
          </AdminButton>
        </form>
      </Sheet>

      <Sheet
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        side="center"
        size="sm"
        dismissOnBackdrop={false}
        title="Remove from the rate card?"
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </AdminButton>
            <AdminButton variant="danger" onClick={remove}>
              Remove
            </AdminButton>
          </>
        }
      >
        <p className="text-admin-sm text-admin-muted">
          <b className="text-admin-text">{confirmDelete?.name}</b> will no longer be selectable when
          approving a disbursal. Payouts already booked against it are not affected.
        </p>
      </Sheet>
    </div>
  )
}
