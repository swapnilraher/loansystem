"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import {
  WA_NOTIFICATIONS_COLLECTION,
  identityTokens,
  isRecipient,
  type WaNotification,
} from "@/lib/waNotificationShared"

/**
 * Newest N notifications across the whole CRM, filtered to the signed-in staff
 * member in memory.
 *
 * Filtering client-side rather than with `array-contains-any` is deliberate.
 * A `where(...) + orderBy(...)` pair needs a composite index created by hand in
 * the Firebase console, and this CRM ships no `firestore.rules`/index config —
 * a missing index would mean the bell silently shows nothing on first deploy.
 * `orderBy` on a single field uses the automatic index, so this works the moment
 * the code lands. It also matches how `useLeads` and the WhatsApp inbox already
 * work: stream, then apply the visibility rule in the client.
 */
const FEED_LIMIT = 100

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

/** `whatsapp_messages` is keyed on the bare 10-digit number. */
function localNumber(raw: string): string {
  const clean = (raw || "").replace(/\D/g, "")
  return clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean
}

export function useWaNotifications(): UseWaNotifications {
  const { user, profile, staffProfile } = useAuth()
  const uid = user?.uid ?? null
  const [all, setAll] = useState<WaNotification[]>([])
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
   * Only subscribes while somebody is signed in. The signed-out case is
   * *derived* below rather than written from here — calling setState in an
   * effect body triggers a cascading render, which this codebase's lint rules
   * reject outright.
   */
  useEffect(() => {
    if (!uid) return

    const unsubscribe = onSnapshot(
      query(
        collection(db, WA_NOTIFICATIONS_COLLECTION),
        orderBy("createdAt", "desc"),
        limit(FEED_LIMIT)
      ),
      snapshot => {
        setAll(
          snapshot.docs.map(d => {
            const data = d.data()
            return {
              id: d.id,
              messageId: data.messageId || d.id,
              leadId: data.leadId || "",
              leadName: data.leadName || "Customer",
              phone: data.phone || "",
              message: data.message || "",
              mediaType: data.mediaType || "",
              leadStatus: data.leadStatus || "New Lead",
              assignedTo: data.assignedTo ?? null,
              assignedToName: data.assignedToName ?? null,
              recipients: Array.isArray(data.recipients) ? data.recipients : [],
              read: data.read === true,
              readAt: data.readAt,
              readBy: data.readBy ?? null,
              receivedAt: data.receivedAt,
              createdAt: data.createdAt,
            } as WaNotification
          })
        )
        setError(null)
        setSnapshotLoading(false)
      },
      err => {
        console.error("WhatsApp notification listener failed:", err)
        setError(err.message)
        setSnapshotLoading(false)
      }
    )

    return () => unsubscribe()
  }, [uid])

  /**
   * Only what this staff member is meant to see. Signing out empties
   * `viewerTokens`, so any rows still held from the last session stop matching
   * on their own — no clean-up write needed.
   */
  const notifications = useMemo(
    () => (uid ? all.filter(n => isRecipient(n, viewerTokens)) : []),
    [uid, all, viewerTokens]
  )

  /** Nothing is loading when there is nobody to load it for. */
  const loading = uid ? snapshotLoading : false

  const unread = useMemo(() => notifications.filter(n => !n.read), [notifications])

  const readerLabel =
    staffProfile?.name || profile?.name || user?.displayName || user?.email || "Staff"

  const markRead = useCallback(
    async (id: string) => {
      const target = notifications.find(n => n.id === id)
      if (!target || target.read) return
      try {
        await updateDoc(doc(db, WA_NOTIFICATIONS_COLLECTION, id), {
          read: true,
          readAt: serverTimestamp(),
          readBy: readerLabel,
        })
      } catch (err) {
        console.error("Failed to mark WhatsApp notification read:", err)
      }
    },
    [notifications, readerLabel]
  )

  /** One batched write, so opening a busy thread is a single round-trip. */
  const markMany = useCallback(
    async (targets: WaNotification[]) => {
      const pending = targets.filter(n => !n.read)
      if (pending.length === 0) return
      try {
        const batch = writeBatch(db)
        for (const notification of pending) {
          batch.update(doc(db, WA_NOTIFICATIONS_COLLECTION, notification.id), {
            read: true,
            readAt: serverTimestamp(),
            readBy: readerLabel,
          })
        }
        await batch.commit()
      } catch (err) {
        console.error("Failed to mark WhatsApp notifications read:", err)
      }
    },
    [readerLabel]
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
