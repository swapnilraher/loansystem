"use client"

import React, { useState } from "react"
import { AdminButton, Sheet, useToast } from "@/components/admin/ui"
import { Field, Select, TextInput } from "./fields"
import { ownerIdOf, type AdminUser } from "@/lib/hooks/useUsers"

export interface AddLeadInput {
  name: string
  phone: string
  email: string
  city: string
  type: string
  amount: string
  assignedTo: string
  assignedToName: string
}

const EMPTY: AddLeadInput = {
  name: "",
  phone: "",
  email: "",
  city: "",
  type: "Personal Loan",
  amount: "",
  assignedTo: "",
  assignedToName: "",
}

/** Products offered today. Kept here rather than derived from existing leads so
 *  the very first lead of a new product can still be entered. */
const LOAN_TYPES = [
  "Personal Loan",
  "Business Loan",
  "Home Loan",
  "Loan Against Property",
  "Car Loan",
  "Education Loan",
  "Gold Loan",
]

interface AddLeadSheetProps {
  open: boolean
  onClose: () => void
  telecallers: AdminUser[]
  canAssign: boolean
  onCreate: (input: {
    name: string
    phone: string
    email?: string
    city?: string
    type: string
    amount?: string
    assignedTo?: string
    assignedToName?: string
  }) => Promise<string>
}

export function AddLeadSheet({ open, onClose, telecallers, canAssign, onCreate }: AddLeadSheetProps) {
  const toast = useToast()
  const [form, setForm] = useState<AddLeadInput>(EMPTY)
  const [busy, setBusy] = useState(false)

  // A half-typed lead left behind from last time is worse than a blank form —
  // it gets saved by accident against the wrong customer. Adjusted during
  // render rather than in an effect so the first paint is already blank.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setForm(EMPTY)
  }

  const set = <K extends keyof AddLeadInput>(key: K, value: AddLeadInput[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const digits = form.phone.replace(/\D/g, "")
  const phoneValid = digits.length >= 10
  const canSubmit = form.name.trim().length > 1 && phoneValid && !busy

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    try {
      await onCreate({
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        type: form.type,
        amount: form.amount,
        assignedTo: form.assignedTo || undefined,
        assignedToName: form.assignedToName || undefined,
      })
      toast.push({ tone: "success", title: "लीड तयार झाली", description: form.name.trim() })
      onClose()
    } catch (e) {
      console.error("Create lead failed:", e)
      toast.push({ tone: "danger", title: "Could not save this lead" })
    }
    setBusy(false)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      size="md"
      dismissOnBackdrop={!busy}
      title="Add lead"
      description="Walk-ins and phone enquiries that never came through the website."
      footer={
        <>
          <AdminButton variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton variant="primary" loading={busy} disabled={!canSubmit} onClick={submit}>
            Save lead
          </AdminButton>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Customer name">
          <TextInput
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="ग्राहकाचे पूर्ण नाव"
            autoFocus
          />
        </Field>

        <Field
          label="Mobile"
          hint={form.phone && !phoneValid ? "Needs at least 10 digits." : undefined}
        >
          <TextInput
            value={form.phone}
            onChange={e => set("phone", e.target.value)}
            inputMode="tel"
            placeholder="98XXXXXXXX"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Loan type">
            <Select value={form.type} onChange={e => set("type", e.target.value)}>
              {LOAN_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Amount (₹)">
            <TextInput
              value={form.amount}
              onChange={e => set("amount", e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="500000"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <TextInput
              value={form.city}
              onChange={e => set("city", e.target.value)}
              placeholder="Pune"
            />
          </Field>

          <Field label="Email">
            <TextInput
              value={form.email}
              onChange={e => set("email", e.target.value)}
              inputMode="email"
              placeholder="optional"
            />
          </Field>
        </div>

        {canAssign && telecallers.length > 0 && (
          <Field label="Assign to" hint="Leave blank to keep it on your own list.">
            <Select
              value={form.assignedTo}
              onChange={e => {
                const id = e.target.value
                set("assignedTo", id)
                set("assignedToName", telecallers.find(t => ownerIdOf(t) === id)?.name ?? "")
              }}
            >
              <option value="">-- Me --</option>
              {telecallers.map(agent => (
                <option key={agent.id} value={ownerIdOf(agent)}>
                  {agent.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
    </Sheet>
  )
}
