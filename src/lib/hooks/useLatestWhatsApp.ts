"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toDate } from "@/lib/dates"

export interface LatestWaMessage {
  phone: string
  text: string
  sender: "customer" | "bot" | "staff" | ""
  mediaType: string
  timestamp: unknown
  /** Millis, resolved on read so sorting never touches Firestore types. */
  sortKey: number
}

import { getBrowserCache, setBrowserCache } from "@/lib/cache/browserCache"

/**
 * Limit recent previews to 50 to drastically reduce database reads.
 */
const MESSAGE_LIMIT = 50
const CACHE_KEY = "latest_wa_messages"
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

/** Firestore keys `whatsapp_messages` on the bare 10-digit number. */
export function localWaNumber(raw: string): string {
  const clean = (raw || "").replace(/\D/g, "")
  return clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean
}

/** The last thing either side said, one entry per phone number. */
export function useLatestWhatsApp(limitCount = MESSAGE_LIMIT): Map<string, LatestWaMessage> {
  const [messages, setMessages] = useState<LatestWaMessage[]>(() => {
    const cached = getBrowserCache<LatestWaMessage[]>(CACHE_KEY)
    return cached || []
  })

  useEffect(() => {
    // If cached recently and valid, delay/skip immediate heavy query
    const cached = getBrowserCache<LatestWaMessage[]>(CACHE_KEY)
    if (cached && cached.length > 0) {
      setMessages(cached)
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "whatsapp_messages"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      ),
      snapshot => {
        const rows: LatestWaMessage[] = snapshot.docs.map(d => {
          const data = d.data()
          return {
            phone: localWaNumber(String(data.phone ?? "")),
            text: String(data.text ?? ""),
            sender: data.sender ?? "",
            mediaType: data.mediaType || "",
            timestamp: data.timestamp,
            sortKey: toDate(data.timestamp)?.getTime() ?? 0,
          }
        })
        setMessages(rows)
        setBrowserCache(CACHE_KEY, rows, CACHE_TTL)
      },
      error => console.error("Latest WhatsApp listener failed:", error)
    )
    return () => unsubscribe()
  }, [limitCount])

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
