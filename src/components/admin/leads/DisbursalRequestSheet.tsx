"use client"

import React, { useState } from "react"
import { Clock, IndianRupee } from "lucide-react"
import { AdminButton, Sheet } from "@/components/admin/ui"
import { Field, Select, TextInput } from "./fields"
import { leadName } from "./leadFilters"
import { useBanks, toAmount } from "@/lib/hooks/useBanks"
import type { Lead } from "@/lib/hooks/useLeads"

interface DisbursalRequestSheetProps {
  lead: Lead | null
  onClose: () => void
  onSubmit: (lead: Lead, amount: number, bankId: string, productType: string) => Promise<void>
}

const LOAN_TYPES = [
  "Personal Loan",
  "Business Loan",
  "Home Loan",
  "Loan Against Property",
  "Car Loan",
  "Education Loan",
  "Gold Loan",
]

/**
 * Marking a file disbursed parks it in `Disbursement Approval Pending`.
 * Nothing is paid out here — a Manager confirms the bank and the amount first.
 */
export function DisbursalRequestSheet({ lead, onClose, onSubmit }: DisbursalRequestSheetProps) {
  const { banks } = useBanks()
  const activeBanks = banks.filter(b => b.active)

  const [amount, setAmount] = useState("")
  const [bankId, setBankId] = useState("")
  const [productType, setProductType] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [seededFor, setSeededFor] = useState<string | null>(null)

  // Seed the input from the lead during render rather than in an effect, so the
  // field is correct on first paint and never flashes the previous lead's value.
  if (lead && seededFor !== lead.id) {
    setSeededFor(lead.id)
    setAmount(String(toAmount(lead.disbursedAmount) || toAmount(lead.amount) || ""))
    setBankId(lead.bankId || "")
    setProductType(lead.type || "Personal Loan")
    setError(null)
  }

  const submit = async () => {
    if (!lead) return
    const value = toAmount(amount)
    if (!value || value <= 0) {
      setError("वैध डिस्बर्स रक्कम टाका (Enter a valid disbursed amount).")
      return
    }
    if (!bankId) {
      setError("कृपया बँक निवडा (Please select a bank).")
      return
    }
    if (!productType) {
      setError("कृपया लोन प्रकार निवडा (Please select a loan type).")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(lead, value, bankId, productType)
      onClose()
    } catch (e) {
      console.error("Disbursal request failed:", e)
      setError("विनंती पाठवता आली नाही. पुन्हा प्रयत्न करा.")
    }
    setSaving(false)
  }

  return (
    <Sheet
      open={!!lead}
      onClose={onClose}
      side="center"
      size="sm"
      title="डिस्बर्स मार्क करा"
      description={lead ? `${leadName(lead)}` : undefined}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton variant="primary" icon={IndianRupee} loading={saving} onClick={submit}>
            Send for approval
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="बँक नाव (Bank Name)">
          <Select value={bankId} onChange={e => setBankId(e.target.value)}>
            <option value="">Select bank…</option>
            {activeBanks.map(bank => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="लोन प्रकार (Loan Type)">
          <Select value={productType} onChange={e => setProductType(e.target.value)}>
            <option value="">Select loan type…</option>
            {LOAN_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="डिस्बर्स रक्कम (Disbursed amount ₹)">
          <TextInput
            type="number"
            min={0}
            autoFocus
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="450000"
            className="admin-num h-11 text-admin-lg font-semibold"
          />
        </Field>

        <div className="flex items-start gap-2.5 bg-tone-warn border border-tone-warn-bd rounded-admin-sm p-3">
          <Clock size={15} className="text-tone-warn-fg shrink-0 mt-0.5" />
          <p className="text-admin-xs text-tone-warn-fg leading-relaxed">
            ही फाईल <b>Pending Approval</b> मध्ये जाईल. मॅनेजर बँक निवडून रक्कम आणि इन्सेंटिव्ह कन्फर्म
            केल्यावरच डिस्बर्समेंट पूर्ण होईल.
          </p>
        </div>

        {error && (
          <p className="text-admin-xs font-medium text-tone-danger-fg bg-tone-danger border border-tone-danger-bd rounded-admin-sm px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  )
}
