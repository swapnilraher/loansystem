"use client"

import React, { useMemo, useState } from "react"
import { Clock } from "lucide-react"
import { AdminButton, Sheet } from "@/components/admin/ui"
import { Field, Select, TextArea, TextInput } from "./fields"
import { leadName, STATUS_LABELS, STATUS_OPTIONS } from "./leadFilters"
import type { Lead } from "@/lib/hooks/useLeads"

export interface FollowUpPrompt {
  lead: Lead
  type: string
}

interface FollowUpPromptSheetProps {
  prompt: FollowUpPrompt | null
  onClose: () => void
  onSave: (
    lead: Lead,
    input: { type: string; remark: string; followUpDate: string; followUpReason: string; status?: string }
  ) => Promise<void>
}

/**
 * Fires when the tab regains focus after a call or a WhatsApp hand-off: the
 * staff member is asked what happened while it is still fresh.
 */
export function FollowUpPromptSheet({ prompt, onClose, onSave }: FollowUpPromptSheetProps) {
  const [remark, setRemark] = useState("")
  const [date, setDate] = useState("")
  const [reason, setReason] = useState("")
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [seededFor, setSeededFor] = useState<string | null>(null)

  if (prompt && seededFor !== prompt.lead.id) {
    setSeededFor(prompt.lead.id)
    setRemark("")
    setDate("")
    setReason("")
    setStatus(prompt.lead.status || "New Lead")
  }

  const availableStatuses = useMemo(() => {
    const opts = [...STATUS_OPTIONS]
    if (prompt?.lead.status && !opts.includes(prompt.lead.status as any)) {
      opts.unshift(prompt.lead.status as any)
    }
    return opts
  }, [prompt?.lead.status])

  const save = async () => {
    if (!prompt || !remark.trim()) return
    setSaving(true)
    try {
      await onSave(prompt.lead, {
        type: prompt.type,
        remark: remark.trim(),
        followUpDate: date,
        followUpReason: reason,
        status: status || prompt.lead.status,
      })
      onClose()
    } catch (e) {
      console.error("Error saving follow-up remark:", e)
    }
    setSaving(false)
  }

  return (
    <Sheet
      open={!!prompt}
      onClose={onClose}
      side="center"
      size="sm"
      title="Follow-up / Remark नोंदा"
      description={
        prompt
          ? `${leadName(prompt.lead)} — ${prompt.type === "Call" ? "कॉल" : "WhatsApp"} बाबत माहिती लिहा`
          : undefined
      }
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            रद्द करा
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={Clock}
            loading={saving}
            disabled={!remark.trim()}
            onClick={save}
          >
            रिमार्क सेव्ह करा
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Lead Status (लीड स्थिती)">
          <Select value={status} onChange={e => setStatus(e.target.value)}>
            {availableStatuses.map(st => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="रिमार्क (Remark) / चर्चा">
          <TextArea
            autoFocus
            rows={3}
            value={remark}
            onChange={e => setRemark(e.target.value)}
            placeholder="उदा. ग्राहक उद्या बोलण्यास सांगितले, डॉक्युमेंट्स पाठवणार आहे…"
          />
        </Field>

        <div className="bg-admin-surface-2 border border-admin-border rounded-admin-sm p-3 space-y-3">
          <p className="text-admin-2xs font-semibold uppercase tracking-wide text-admin-muted">
            पुढील संपर्क वेळ (Next follow-up)
          </p>
          <Field label="तारीख आणि वेळ">
            <TextInput
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </Field>
          <Field label="कारण (Reason)">
            <TextInput
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="उदा. फाईल गोळा करायची आहे"
            />
          </Field>
        </div>
      </div>
    </Sheet>
  )
}
