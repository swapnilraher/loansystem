"use client"

import React, { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { AdminButton, Sheet, useToast } from "@/components/admin/ui"
import { Field, Select } from "./fields"

export interface ParsedSpreadsheet {
  headers: string[]
  rows: Record<string, unknown>[]
}

export interface FieldMapping {
  name: string
  phone: string
  email: string
  type: string
  amount: string
}

const FIELDS: { id: keyof FieldMapping; label: string; required: boolean }[] = [
  { id: "name", label: "पूर्ण नाव (Full name)", required: true },
  { id: "phone", label: "मोबाईल नंबर (Phone)", required: true },
  { id: "email", label: "ईमेल पत्ता (Email)", required: false },
  { id: "type", label: "लोनचा प्रकार (Loan type)", required: false },
  { id: "amount", label: "लोनची रक्कम (Amount)", required: false },
]

interface BulkUploadSheetProps {
  parsed: ParsedSpreadsheet | null
  onClose: () => void
  onImport: (rows: Record<string, unknown>[], mapping: FieldMapping) => Promise<number>
}

export function BulkUploadSheet({ parsed, onClose, onImport }: BulkUploadSheetProps) {
  const toast = useToast()
  const [mapping, setMapping] = useState<FieldMapping>({
    name: "",
    phone: "",
    email: "",
    type: "",
    amount: "",
  })
  const [uploading, setUploading] = useState(false)

  const run = async () => {
    if (!parsed) return
    if (!mapping.name || !mapping.phone) {
      toast.push({
        tone: "warn",
        title: "नाव आणि फोन कॉलम्स निवडा",
        description: "Map at least the name and phone columns before importing.",
      })
      return
    }
    setUploading(true)
    try {
      const count = await onImport(parsed.rows, mapping)
      toast.push({ tone: "success", title: `${count} leads imported` })
      onClose()
    } catch (e) {
      console.error("Bulk import failed:", e)
      toast.push({ tone: "danger", title: "इंपोर्ट अयशस्वी", description: "Check the console for details." })
    }
    setUploading(false)
  }

  return (
    <Sheet
      open={!!parsed}
      onClose={uploading ? () => {} : onClose}
      side="center"
      size="sm"
      title="Excel कॉलम्स मॅप करा"
      description={parsed ? `${parsed.rows.length} rows found in the file` : undefined}
      dismissOnBackdrop={!uploading}
      footer={
        <>
          <AdminButton variant="ghost" disabled={uploading} onClick={onClose}>
            रद्द करा
          </AdminButton>
          <AdminButton variant="primary" icon={CheckCircle2} loading={uploading} onClick={run}>
            {uploading ? "अपलोड होत आहे…" : "इंपोर्ट सुरू करा"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-3">
        {FIELDS.map(field => (
          <Field
            key={field.id}
            label={`${field.label}${field.required ? " *" : ""}`}
          >
            <Select
              value={mapping[field.id]}
              onChange={e => setMapping({ ...mapping, [field.id]: e.target.value })}
            >
              <option value="">-- कॉलम निवडा --</option>
              {parsed?.headers.map(h => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </Field>
        ))}
      </div>
    </Sheet>
  )
}
