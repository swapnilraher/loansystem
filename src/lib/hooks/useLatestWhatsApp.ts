"use client"

import { useEffect, useMemo, useState } from "react"
import { toDate } from "@/lib/dates"
import { POLL_FAST, usePolledResource } from "@/lib/hooks/usePolledResource"

export interface LatestWaMessage {
  phone: string
  text: string
  sender: "customer" | "bot" | "staff" | ""
  mediaType: string
  timestamp: unknown
  /** Millis, resolved on read so sorting never touches the wire format. */
  sortKey: number
}

import { getBrowserCache, setBrowserCache } from "@/lib/cache/browserCache"

/**
 * Limit recent previews to 50 to drastically reduce database reads.
 */
const MESSAGE_LIMIT = 50
const CACHE_KEY = "latest_wa_messages"
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

/** `whatsapp_messages` is keyed on the bare 10-digit number. */
export function localWaNumber(raw: string): string {
  const clean = (raw || "").replace(/\D/g, "")
  return clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean
}

/** As the route hands them over: ids and ISO timestamps, nothing else applied. */
interface LatestRow {
  phone?: string
  text?: string
  sender?: LatestWaMessage["sender"]
  mediaType?: string
  timestamp?: unknown
}

/** The last thing either side said, one entry per phone number. */
export function useLatestWhatsApp(limitCount = MESSAGE_LIMIT): Map<string, LatestWaMessage> {
  // The route already answers newest-first, so the limit keeps the most recent
  // messages exactly as `orderBy("timestamp", "desc")` did.
  const { data } = usePolledResource<{ messages: LatestRow[] }>(
    `/api/whatsapp-messages?limit=${limitCount}`,
    POLL_FAST
  )

  /**
   * Seeded from the session cache so a freshly-mounted list is not blank while
   * the first poll is in flight; the route's answer replaces it as soon as it
   * lands.
   */
  const [cached] = useState<LatestWaMessage[]>(
    () => getBrowserCache<LatestWaMessage[]>(CACHE_KEY) || []
  )

  const messages = useMemo((): LatestWaMessage[] => {
    const rows = data?.messages
    if (!rows) return cached
    return rows.map(row => ({
      phone: localWaNumber(String(row.phone ?? "")),
      text: String(row.text ?? ""),
      sender: row.sender ?? "",
      mediaType: row.mediaType || "",
      timestamp: row.timestamp,
      sortKey: toDate(row.timestamp)?.getTime() ?? 0,
    }))
  }, [data, cached])

  useEffect(() => {
    if (!data?.messages) return
    setBrowserCache(CACHE_KEY, messages, CACHE_TTL)
  }, [data, messages])

  return useMemo(() => {
    const byPhone = new Map<string, LatestWaMessage>()
    for (const message of messages) {
      if (!message.phone) continue
      const seen = byPhone.get(message.phone)
      if (!seen || message.sortKey > seen.sortKey) byPhone.set(message.phone, message)
    }
    return byPhone
  }, [messages])
}

/** One line of preview text, the way a chat list renders an attachment. */
export function waPreviewText(message: LatestWaMessage): string {
  if (message.text) return message.text
  if (message.mediaType === "image") return "📷 Photo"
  if (message.mediaType) return "📎 Document"
  return ""
}
