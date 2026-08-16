"use client"

import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, TONE_CLASSES, toneForStatus } from "@/components/admin/ui"
import { STATUS_OPTIONS } from "./leadFilters"

interface StatusPickerSheetProps {
  open: boolean
  onClose: () => void
  current?: string
  onPick: (status: string) => void
}

const STATUS_ORDER: Record<string, number> = {
  "New Lead": 0,
  "Contacted": 1,
  "Interested": 2,
  "Bank Processing": 3,
  "Disbursement Approval Pending": 4,
  "Disbursed": 5,
  "Rejected": 6,
}

export function StatusPickerSheet({ open, onClose, current, onPick }: StatusPickerSheetProps) {
  const currentOrder = STATUS_ORDER[current || ""] ?? -1
  const isLocked = current === "Disbursement Approval Pending" || current === "Disbursed" || current === "Rejected"

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="center"
      size="sm"
      title="स्टेटस अपडेट करा"
      description={isLocked ? "या फाईलचा स्टेटस लॉक केला आहे" : "Move this file to a new stage"}
    >
      {isLocked ? (
        <div className="p-4 bg-admin-surface-2 border border-admin-border rounded-admin-sm text-center text-admin-sm text-admin-muted">
          प्रक्रिया पूर्ण झाली आहे किंवा मंजुरी प्रलंबित आहे, त्यामुळे स्टेटस बदलता येणार नाही.
        </div>
      ) : (
        <div className="space-y-1">
          {STATUS_OPTIONS.map(status => {
            const isCurrent = current === status
            const tone = TONE_CLASSES[toneForStatus(status)]

            // Enforce forward transition only (hide backward or same transitions)
            const targetOrder = STATUS_ORDER[status] ?? -1
            if (!isCurrent && targetOrder <= currentOrder) {
              return null
            }

            // Hide Disbursement Approval Pending from manual status picker
            if (status === "Disbursement Approval Pending") {
              return null
            }

            // Hide Disbursed option unless the current status is Bank Processing
            if (status === "Disbursed" && current !== "Bank Processing") {
              return null
            }

            return (
              <button
                key={status}
                onClick={() => {
                  onPick(status)
                  onClose()
                }}
                className={cn(
                  "admin-focus w-full flex items-center gap-2.5 h-10 px-3 rounded-admin-sm border text-left transition-colors",
                  isCurrent
                    ? "bg-admin-accent-soft border-admin-accent"
                    : "bg-admin-surface border-admin-border hover:bg-admin-surface-2"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", tone.dot)} />
                <span className="text-admin-sm text-admin-text flex-1 truncate">{status}</span>
                {isCurrent && <Check size={15} className="text-admin-accent shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}
