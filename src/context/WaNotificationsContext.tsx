"use client"

import React, { createContext, useContext } from "react"
import {
  useWaNotifications,
  type UseWaNotifications,
} from "@/lib/hooks/useWaNotifications"

/**
 * One WhatsApp-notification listener for the whole CRM.
 *
 * The bell (header), the Leads screen and the WhatsApp inbox all need the same
 * feed — the first to display it, the other two to mark it read when a
 * conversation is opened. Without this, each would open its own `onSnapshot` on
 * the same collection. `AdminHeader` already states the rule for the leads and
 * users feeds ("owned by the layout so the palette and bell add no Firestore
 * listeners"); this keeps notifications to the same rule.
 */
const WaNotificationsContext = createContext<UseWaNotifications | null>(null)

export function WaNotificationsProvider({ children }: { children: React.ReactNode }) {
  const value = useWaNotifications()
  return (
    <WaNotificationsContext.Provider value={value}>
      {children}
    </WaNotificationsContext.Provider>
  )
}

export function useWaNotificationsContext(): UseWaNotifications {
  const context = useContext(WaNotificationsContext)
  if (!context) {
    throw new Error(
      "useWaNotificationsContext must be used inside the admin layout's WaNotificationsProvider"
    )
  }
  return context
}
