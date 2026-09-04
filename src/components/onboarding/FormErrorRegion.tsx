"use client"

import React from "react"
import { AlertCircle, AlertTriangle, Info, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export type ErrorKind = "validation" | "network" | "offline" | "timeout" | "info"

const KIND: Record<ErrorKind, { tone: string; Icon: typeof AlertCircle }> = {
  validation: { tone: "border-tone-danger-bd bg-tone-danger text-tone-danger-fg", Icon: AlertCircle },
  network: { tone: "border-tone-warn-bd bg-tone-warn text-tone-warn-fg", Icon: AlertTriangle },
  offline: { tone: "border-tone-warn-bd bg-tone-warn text-tone-warn-fg", Icon: WifiOff },
  timeout: { tone: "border-tone-warn-bd bg-tone-warn text-tone-warn-fg", Icon: AlertTriangle },
  info: { tone: "border-tone-info-bd bg-tone-info text-tone-info-fg", Icon: Info },
}

/**
 * The error slot for a step.
 *
 * It renders even when there is nothing to say. A message that appears in a
 * collapsed region pushes every field below it down by its own height, which
 * on a form this long means the control the partner just pressed moves out
 * from under their thumb at the exact moment they are told something went
 * wrong. `min-h` holds the space open so the message fades in without moving
 * anything.
 *
 * `role="alert"` rather than a toast because this page has no ToastProvider
 * above it (that lives in the admin layout only), and because a validation
 * error belongs next to the fields it is about, not in a corner that
 * disappears on a timer.
 */
export function FormErrorRegion({
  message,
  kind = "validation",
  id,
  className,
}: {
  message: string | null
  kind?: ErrorKind
  id?: string
  className?: string
}) {
  const { tone, Icon } = KIND[kind]
  return (
    <div className={cn("min-h-11", className)}>
      <div role="alert" aria-live="assertive" id={id}>
        {message && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-admin border px-3 py-2.5 text-admin-xs font-semibold animate-fadeIn",
              tone
            )}
          >
            <Icon size={15} className="mt-px shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Field-level message. Same reasoning as above at one-line scale: the slot is
 * always present, so typing an invalid PAN does not shove the next field down.
 */
export function FieldError({ message, id }: { message: string | null; id?: string }) {
  return (
    <div className="min-h-4">
      <span role="alert" id={id} className="block text-admin-2xs font-semibold text-tone-danger-fg">
        {message}
      </span>
    </div>
  )
}
