"use client"

import { useCallback, useMemo, useState } from "react"

import { authedJson } from "@/lib/authedFetch"
import { POLL_FAST, usePolledResource } from "@/lib/hooks/usePolledResource"
import { useAuth } from "@/context/AuthContext"
import {
  identityTokens,
  isRecipient,
  type WaNotification,
} from "@/lib/waNotificationShared"

/**
 * Newest N notifications across the whole CRM, filtered to the signed-in staff
 * member in memory.
 *
 * The route hands back the whole feed and the visibility rule is applied here,
 * exactly as the Firestore listener did. `recipients` holds every id shape a
 * reader could be addressed by — see `waNotificationShared` — so the match needs
 * the reader's own identifiers, which only the client has. It also matches how
 * `useLeads` and the WhatsApp inbox already work: load, then apply the rule in
 * the client.
 *
 * Polled rather than delta-polled: `?since=` would return only what arrived
 * after the newest row held, so a notification marked read on another device
 * would never lose its badge here. The bell needs the current state of the
 * newest hundred, not just the additions to it.
 */
const FEED_LIMIT = 100
const FEED_URL = `/api/wa-notifications?limit=${FEED_LIMIT}`

export interface UseWaNotifications {
  notifications: WaNotification[]
  unread: WaNotification[]
  unreadCount: number
  loading: boolean
  error: string | null
  /** Marks one notification read. */
  markRead: (id: string) => Promise<void>
  /** Requirement 9 — called when a staff member opens the conversation. */
  markReadForLead: (leadId: string) => Promise<void>
  /** Same, for surfaces keyed by phone number rather than lead id. */
  markReadForPhone: (phone: string) => Promise<void>
  markAllRead: () => Promise<void>
}

type FeedRow = Partial<WaNotification> & { id?: string }

interface NotificationFeed {
  notifications?: FeedRow[]
}

/** JSON rows carry no defaults, so the ones the listener applied are applied here. */
function normalize(row: FeedRow): WaNotification {
  const id = String(row.id ?? "")
  return {
    id,
    messageId: row.messageId || id,
    leadId: row.leadId || "",
    leadName: row.leadName || "Customer",
    phone: row.phone || "",
    message: row.message || "",
    mediaType: row.mediaType || "",
    leadStatus: row.leadStatus || "New Lead",
    assignedTo: row.assignedTo ?? null,
    assignedToName: row.assignedToName ?? null,
    recipients: Array.isArray(row.recipients) ? row.recipients : [],
    read: row.read === true,
    readAt: row.readAt,
    readBy: row.readBy ?? null,
    receivedAt: row.receivedAt,
    createdAt: row.createdAt,
  }
}

/** `whatsapp_messages` is keyed on the bare 10-digit number. */
function localNumber(raw: string): string {
  const clean = (raw || "").replace(/\D/g, "")
  return clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean
}

export function useWaNotifications(): UseWaNotifications {
  const { user, profile, staffProfile } = useAuth()
  const uid = user?.uid ?? null

  /** A null url turns the poll off, so a signed-out tab makes no requests. */
  const {
    data,
    loading: feedLoading,
    error,
    refresh,
  } = usePolledResource<NotificationFeed>(uid ? FEED_URL : null, POLL_FAST)

  /**
   * Ids marked read from this tab, held until the feed catches up.
   *
   * Firestore replayed a write to its own listener immediately; a poll has to
   * wait for the round trip, and `refresh()` is skipped outright while a tick is
   * already in flight. Without this the badge would sit there for up to a full
   * interval after the staff member cleared it.
   */
  const [optimisticRead, setOptimisticRead] = useState<string[]>([])

  const all = useMemo(() => {
    const rows = data?.notifications
    if (!rows || rows.length === 0) return [] as WaNotification[]
    return rows.map(row => {
      const notification = normalize(row)
      return optimisticRead.includes(notification.id)
        ? { ...notification, read: true }
        : notification
    })
  }, [data, optimisticRead])

  /**
   * Every id this person could be addressed by. `leads.assignedTo` holds an
   * `admin_users` document id when set from the dropdown and a Firebase Auth uid
   * when auto-claimed, so both have to be in play — see `waNotificationShared`.
   */
  const viewerTokens = useMemo(
    () =>
      identityTokens(
        user?.uid,
        staffProfile?.id,
        user?.email,
        profile?.email,
        staffProfile?.email
      ),
    [user?.uid, user?.email, profile?.email, staffProfile?.id, staffProfile?.email]
  )

  /**
   * Only what this staff member is meant to see. Signing out empties
   * `viewerTokens`, so any rows still held from the last session stop matching
   * on their own — no clean-up write needed.
   */
  const notifications = useMemo(
    () => (uid ? all.filter(n => isRecipient(n, viewerTokens)) : []),
    [uid, all, viewerTokens]
  )

  /**
   * Nothing is loading when there is nobody to load it for. The extra clause
   * covers signing in after mount: the poll starts enabled at that point but its
   * own `loading` flag has already been cleared, and the bell should show the
   * spinner rather than "nothing here" while the first response is in flight.
   */
  const loading = uid ? feedLoading || (!data && !error) : false

  const unread = useMemo(() => notifications.filter(n => !n.read), [notifications])

  /** One request, so opening a busy thread is still a single round-trip. */
  const markMany = useCallback(
    async (targets: WaNotification[]) => {
      const ids = targets.filter(n => !n.read).map(n => n.id)
      if (ids.length === 0) return
      setOptimisticRead(prev => [...prev, ...ids])
      try {
        const response = await authedJson("/api/wa-notifications", "PATCH", { ids })
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || "Could not mark these read.")
        }
        await refresh()
      } catch (err) {
        console.error("Failed to mark WhatsApp notifications read:", err)
        // Put the badge back rather than leaving it lying about a write that failed.
        setOptimisticRead(prev => prev.filter(id => !ids.includes(id)))
      }
    },
    [refresh]
  )

  const markRead = useCallback(
    async (id: string) => {
      const target = notifications.find(n => n.id === id)
      if (!target || target.read) return
      await markMany([target])
    },
    [markMany, notifications]
  )

  const markReadForLead = useCallback(
    async (leadId: string) => {
      if (!leadId) return
      await markMany(unread.filter(n => n.leadId === leadId))
    },
    [markMany, unread]
  )

  const markReadForPhone = useCallback(
    async (phone: string) => {
      const target = localNumber(phone)
      if (!target) return
      await markMany(unread.filter(n => localNumber(n.phone) === target))
    },
    [markMany, unread]
  )

  /**
   * By id, not the route's `markAllRead` flag: that clears the collection for
   * every staff member at once, where this only ever clears what this reader can
   * see.
   */
  const markAllRead = useCallback(async () => {
    await markMany(unread)
  }, [markMany, unread])

  return {
    notifications,
    unread,
    unreadCount: unread.length,
    loading,
    error,
    markRead,
    markReadForLead,
    markReadForPhone,
    markAllRead,
  }
}
