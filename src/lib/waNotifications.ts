/**
 * Staff notifications for incoming WhatsApp messages on leads whose Auto
 * Chatbot is OFF (`leads.botMuted === true`).
 *
 * Server-only — imports `firebase-admin`. The browser side lives in
 * `@/lib/hooks/useWaNotifications`; the contract they share is in
 * `@/lib/waNotificationShared`.
 *
 * This sits alongside `notificationService.ts` rather than inside it: that file
 * broadcasts to *every* admin, and the whole point here is to reach one person —
 * the staff member the lead belongs to.
 */

import { getAdminDb, getAdminApp } from "./firebase-admin"
import { normalizeRole } from "./permissions"
import {
  WA_NOTIFICATIONS_COLLECTION,
  WA_NOTIFICATION_TYPE,
  identityTokens,
  notificationIdFor,
  previewText,
} from "./waNotificationShared"

/** Same hard-coded super admin the rest of the CRM falls back to. */
const SUPER_ADMIN_EMAIL = "swapnil.r.aher@gmail.com"

/** Firestore caps an `in` filter at 30 values. */
const IN_QUERY_LIMIT = 30

interface StaffContact {
  /** `admin_users` document id. */
  staffId?: string | null
  /** Firebase Auth uid, when the staff record carries one. */
  uid?: string | null
  email?: string | null
  name?: string | null
}

interface Audience {
  /** Identity tokens written onto the notification. */
  recipients: string[]
  /** Emails used to look up FCM tokens. */
  emails: string[]
  /** Auth uids used to look up `users` documents directly. */
  uids: string[]
  /** Why this audience was chosen — logged, and handy when debugging routing. */
  reason: "assigned" | "unassigned-fallback"
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function contactFrom(id: string, data: FirebaseFirestore.DocumentData): StaffContact {
  return {
    staffId: id,
    uid: data.uid || data.authUid || null,
    email: data.email || null,
    name: data.name || data.displayName || null,
  }
}

function tokensFor(contacts: StaffContact[], extra: (string | null | undefined)[] = []) {
  return identityTokens(
    ...extra,
    ...contacts.flatMap(c => [c.staffId, c.uid, c.email])
  )
}

/**
 * Resolves whoever `leads.assignedTo` points at, given that the field may hold
 * either an `admin_users` document id or a Firebase Auth uid.
 */
async function findAssignedStaff(assignedTo: string): Promise<StaffContact | null> {
  const db = getAdminDb()

  // 1. The dropdown path: the value is an `admin_users` document id.
  const staffDoc = await db.collection("admin_users").doc(assignedTo).get()
  if (staffDoc.exists) return contactFrom(staffDoc.id, staffDoc.data() || {})

  // 2. A staff record that stores its own auth uid.
  const byUid = await db
    .collection("admin_users")
    .where("uid", "==", assignedTo)
    .limit(1)
    .get()
  if (!byUid.empty) return contactFrom(byUid.docs[0].id, byUid.docs[0].data())

  // 3. The auto-claim path: the value is an auth uid, and `users` is keyed by uid.
  const userDoc = await db.collection("users").doc(assignedTo).get()
  if (userDoc.exists) {
    const data = userDoc.data() || {}
    const email = data.email || null
    // Pull the matching staff record too, so the notification also reaches them
    // if they are later addressed by their `admin_users` id.
    if (email) {
      const staffByEmail = await db
        .collection("admin_users")
        .where("email", "==", email)
        .limit(1)
        .get()
      if (!staffByEmail.empty) {
        const contact = contactFrom(staffByEmail.docs[0].id, staffByEmail.docs[0].data())
        return { ...contact, uid: contact.uid || assignedTo }
      }
    }
    return {
      staffId: null,
      uid: assignedTo,
      email,
      name: data.name || data.displayName || null,
    }
  }

  return null
}

/**
 * Every active Admin and Manager. Roles are stored as free-text labels
 * ("Super Admin", "Sales Manager", "HR"…), so the whole (small) staff table is
 * read and normalised in memory rather than filtered by an `in` query that
 * would silently miss the legacy labels.
 */
async function findManagersAndAdmins(): Promise<StaffContact[]> {
  const snapshot = await getAdminDb().collection("admin_users").get()
  const contacts: StaffContact[] = []
  snapshot.forEach(doc => {
    const data = doc.data()
    if (data.status === "Inactive") return
    const role = normalizeRole(data.role)
    if (role === "Admin" || role === "Manager") contacts.push(contactFrom(doc.id, data))
  })
  return contacts
}

/**
 * Requirement 6 and 7: the assignee if there is one, otherwise the managers and
 * admins who own the unassigned pool under the CRM's existing visibility rule
 * (`canSeeLead` / `leads:viewAll`).
 */
export async function resolveWaAudience(
  assignedTo?: string | null
): Promise<Audience> {
  const assigned = (assignedTo || "").trim()

  if (assigned) {
    const staff = await findAssignedStaff(assigned)
    if (staff) {
      return {
        // The raw stored value is always included: it is what the reader's own
        // uid or staff id will be compared against in the common case, and it
        // keeps routing working even if the staff lookup above came up short.
        recipients: tokensFor([staff], [assigned]),
        emails: identityTokens(staff.email),
        uids: identityTokens(staff.uid, assigned),
        reason: "assigned",
      }
    }
    // Assigned to someone with no resolvable record: still address the raw id so
    // the notification is not silently lost, and copy in the managers.
    const fallback = await findManagersAndAdmins()
    return {
      recipients: tokensFor(fallback, [assigned, SUPER_ADMIN_EMAIL]),
      emails: identityTokens(SUPER_ADMIN_EMAIL, ...fallback.map(c => c.email)),
      uids: identityTokens(...fallback.map(c => c.uid)),
      reason: "unassigned-fallback",
    }
  }

  const managers = await findManagersAndAdmins()
  return {
    recipients: tokensFor(managers, [SUPER_ADMIN_EMAIL]),
    emails: identityTokens(SUPER_ADMIN_EMAIL, ...managers.map(c => c.email)),
    uids: identityTokens(...managers.map(c => c.uid)),
    reason: "unassigned-fallback",
  }
}

/**
 * FCM tokens for a specific set of people, honouring the same `notifyLeads`
 * opt-out `notificationService.ts` respects.
 */
async function fcmTokensFor(emails: string[], uids: string[]): Promise<string[]> {
  const db = getAdminDb()
  const tokens: string[] = []

  const collect = (data: FirebaseFirestore.DocumentData | undefined) => {
    if (!data) return
    if (data.notifyLeads === false) return
    if (Array.isArray(data.fcmTokens)) tokens.push(...data.fcmTokens)
  }

  // `users` is keyed by auth uid, so uids are a direct read.
  if (uids.length > 0) {
    const refs = uids.map(uid => db.collection("users").doc(uid))
    const docs = await db.getAll(...refs)
    docs.forEach(doc => collect(doc.data()))
  }

  // Chunked because Firestore rejects an `in` filter longer than 30.
  for (const group of chunk(emails, IN_QUERY_LIMIT)) {
    const snapshot = await db.collection("users").where("email", "in", group).get()
    snapshot.forEach(doc => collect(doc.data()))
  }

  return [...new Set(tokens.filter(Boolean))]
}

export interface WaNotificationInput {
  /** WhatsApp `wamid`. Doubles as the idempotency key. */
  messageId: string
  leadId: string
  leadName: string
  phone: string
  message: string
  mediaType?: string
  leadStatus: string
  assignedTo?: string | null
  assignedToName?: string | null
  receivedAt?: Date
}

/**
 * Creates one staff notification for an incoming WhatsApp message.
 *
 * Idempotent: the document id is derived from the WhatsApp message id and the
 * write uses `create()`, so a webhook retry (or two serverless instances racing
 * the same delivery) fails the second write instead of producing a duplicate.
 * That is a stronger guarantee than the in-memory `processedMessageIds` set in
 * the webhook, which does not survive a cold start.
 *
 * Never throws: the WhatsApp webhook must answer 200 whatever happens here.
 */
export async function createWaIncomingNotification(
  input: WaNotificationInput
): Promise<{ created: boolean; id: string | null }> {
  try {
    if (!input.messageId) {
      console.warn("[waNotifications] No message id — skipping (cannot de-duplicate).")
      return { created: false, id: null }
    }

    const db = getAdminDb()
    const id = notificationIdFor(input.messageId)
    const audience = await resolveWaAudience(input.assignedTo)
    const preview = previewText(input.message, input.mediaType)
    const receivedAt = input.receivedAt ?? new Date()

    try {
      await db
        .collection(WA_NOTIFICATIONS_COLLECTION)
        .doc(id)
        .create({
          type: WA_NOTIFICATION_TYPE,
          messageId: input.messageId,
          leadId: input.leadId || "",
          leadName: input.leadName || "Customer",
          phone: input.phone || "",
          message: preview,
          mediaType: input.mediaType || "",
          leadStatus: input.leadStatus || "New Lead",
          assignedTo: input.assignedTo || null,
          assignedToName: input.assignedToName || null,
          recipients: audience.recipients,
          audienceReason: audience.reason,
          read: false,
          readAt: null,
          readBy: null,
          receivedAt,
          createdAt: new Date(),
        })
    } catch (error: unknown) {
      // 6 = ALREADY_EXISTS. The notification for this message is already on
      // record, which is exactly the duplicate-suppression this relies on.
      if ((error as { code?: number } | null)?.code === 6) {
        console.log(`[waNotifications] Duplicate suppressed for message ${input.messageId}.`)
        return { created: false, id }
      }
      throw error
    }

    // Push is best-effort on top of the Firestore record, which is what makes
    // the notification survive a refresh and stay unread until it is opened.
    void sendWaIncomingPush(input, preview, audience).catch(error =>
      console.error("[waNotifications] Push failed:", error)
    )

    console.log(
      `[waNotifications] Notified ${audience.recipients.length} identity token(s) (${audience.reason}) for lead ${input.leadId}.`
    )
    return { created: true, id }
  } catch (error) {
    console.error("[waNotifications] Failed to create notification:", error)
    return { created: false, id: null }
  }
}

async function sendWaIncomingPush(
  input: WaNotificationInput,
  preview: string,
  audience: Audience
) {
  const tokens = await fcmTokensFor(audience.emails, audience.uids)
  if (tokens.length === 0) {
    console.log("[waNotifications] No FCM tokens for this audience — Firestore record only.")
    return
  }

  const messaging = getAdminApp()!.messaging()
  const response = await messaging.sendEachForMulticast({
    notification: {
      title: `💬 ${input.leadName || "Lead"} replied on WhatsApp`,
      body: `${preview}\nStatus: ${input.leadStatus || "New Lead"}`,
    },
    data: {
      type: WA_NOTIFICATION_TYPE,
      leadId: input.leadId || "",
      phone: input.phone || "",
      notificationId: notificationIdFor(input.messageId),
    },
    tokens,
  })

  console.log(
    `[waNotifications] Push sent: ${response.successCount} ok, ${response.failureCount} failed.`
  )
}
