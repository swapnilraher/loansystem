"use client"

import React, { useState } from "react"
import { Megaphone } from "lucide-react"
import { AdminButton, Sheet } from "@/components/admin/ui"
import { Field, TextArea } from "./fields"
import { leadName, leadPhone } from "./leadFilters"
import type { Lead } from "@/lib/hooks/useLeads"

interface BroadcastSheetProps {
  open: boolean
  onClose: () => void
  /** Exactly the leads currently visible in the table. */
  recipients: Lead[]
  senderName: string
}

interface Progress {
  sent: number
  total: number
  statusText: string
}

/**
 * Sends one templated WhatsApp message per filtered lead, sequentially with a
 * short gap — the Cloud API rate-limits bursts, and staff need to see progress.
 */
export function BroadcastSheet({ open, onClose, recipients, senderName }: BroadcastSheetProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)

  const send = async () => {
    if (recipients.length === 0 || !message.trim()) return

    setSending(true)
    setProgress({ sent: 0, total: recipients.length, statusText: "सुरू होत आहे…" })

    let sent = 0
    for (const lead of recipients) {
      const name = leadName(lead)
      const phone = leadPhone(lead)

      if (!phone) {
        sent++
        setProgress({
          sent,
          total: recipients.length,
          statusText: `${name} चा फोन नंबर उपलब्ध नाही, वगळत आहे…`,
        })
        continue
      }

      try {
        const response = await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            name,
            customerName: name,
            message: message.replace(/\{name\}/g, name),
            leadId: lead.id,
            senderName,
          }),
        })
        const result = await response.json()
        if (!result.success) console.error(`Broadcast to ${name} failed:`, result.error)
      } catch (error) {
        console.error(`Broadcast error for ${name}:`, error)
      }

      sent++
      setProgress({ sent, total: recipients.length, statusText: `${name} ला मेसेज पाठवला…` })
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setProgress({
      sent: recipients.length,
      total: recipients.length,
      statusText: "ब्रॉडकास्ट पूर्ण झाले",
    })
    setTimeout(() => {
      setSending(false)
      setProgress(null)
      setMessage("")
      onClose()
    }, 1500)
  }

  return (
    <Sheet
      open={open}
      onClose={sending ? () => {} : onClose}
      side="center"
      size="sm"
      title="WhatsApp ब्रॉडकास्ट"
      description={`फिल्टर केलेल्या ${recipients.length} ग्राहकांना संदेश पाठवा`}
      dismissOnBackdrop={!sending}
      footer={
        <>
          <AdminButton variant="ghost" disabled={sending} onClick={onClose}>
            रद्द करा
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={Megaphone}
            loading={sending}
            disabled={recipients.length === 0 || !message.trim()}
            onClick={send}
          >
            {sending ? "पाठवत आहे…" : "ब्रॉडकास्ट सुरू करा"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">
            ग्राहकांची यादी ({recipients.length})
          </span>
          <div className="max-h-24 overflow-y-auto custom-scrollbar bg-admin-surface-2 border border-admin-border rounded-admin-sm p-2 flex flex-wrap gap-1">
            {recipients.length === 0 ? (
              <span className="text-admin-xs text-admin-subtle">
                फिल्टरमध्ये कोणताही ग्राहक आढळला नाही.
              </span>
            ) : (
              recipients.map(lead => (
                <span
                  key={lead.id}
                  className="px-1.5 py-0.5 rounded-admin-sm bg-tone-info text-tone-info-fg border border-tone-info-bd text-admin-2xs truncate max-w-[14ch]"
                >
                  {leadName(lead)}
                </span>
              ))
            )}
          </div>
        </div>

        <Field label="ब्रॉडकास्ट मेसेज">
          <TextArea
            rows={5}
            value={message}
            disabled={sending}
            onChange={e => setMessage(e.target.value)}
            placeholder="ग्राहकांसाठी तुमचा मेसेज येथे लिहा…"
          />
        </Field>

        <p className="text-admin-xs text-admin-muted bg-tone-info border border-tone-info-bd rounded-admin-sm p-2.5 leading-relaxed">
          मेसेजमध्ये <code className="font-mono text-admin-2xs">{"{name}"}</code> वापरा — तो प्रत्येक
          ग्राहकाच्या नावाने आपोआप बदलला जाईल.
        </p>

        {progress && (
          <div className="space-y-1.5 bg-admin-surface-2 border border-admin-border rounded-admin-sm p-3">
            <div className="flex justify-between items-center text-admin-2xs font-semibold uppercase tracking-wide text-admin-muted">
              <span>प्रगती</span>
              <span className="admin-num">
                {progress.sent} / {progress.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-admin-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-admin-accent transition-all duration-300"
                style={{ width: `${(progress.sent / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-admin-2xs text-admin-subtle truncate">{progress.statusText}</p>
          </div>
        )}
      </div>
    </Sheet>
  )
}
