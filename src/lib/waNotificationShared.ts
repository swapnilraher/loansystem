/**
 * Shared contract for incoming-WhatsApp staff notifications.
 *
 * Imported by BOTH the server (the webhook, via `@/lib/waNotifications`) and the
 * browser (via `@/lib/hooks/useWaNotifications`), so it must stay free of any
 * `firebase-admin` or `firebase/*` import.
 *
 * Why an opaque token list rather than a single `assignedToUid`:
 * `leads.assignedTo` is not one kind of id in this CRM. `useLeadMutations`
 * auto-claims a lead with `user.uid` (a Firebase Auth uid), while the assignment
 * dropdown on the lead sheet writes `admin_users` *document* ids. Both shapes
 * are already live in Firestore. Rather than migrate that (which would change
 * behaviour the brief says to leave alone), a notification carries every
 * identifier that could legitimately match its intended reader, and the client
 * checks whether any of *its* identifiers is in that list.
 */

export const WA_NOTIFICATIONS_COLLECTION = "wa_notifications"

/** Marks these apart from the lead/partner FCM pushes already in the CRM. */
export const WA_NOTIFICATION_TYPE = "wa_incoming"

export interface WaNotification {
  id: string
  /** WhatsApp `wamid` of the message that caused this. The dedupe key. */
  messageId: string
  leadId: string
  leadName: string
  /** Bare 10-digit number — the key `whatsapp_messages` is written against. */
  phone: string
  /** The latest message text from the lead (already trimmed for display). */
  message: string
  mediaType?: string
  /** The lead's CRM status at the moment the message arrived. */
  leadStatus: string
  /** Raw `leads.assignedTo`, whichever id shape it happens to hold. */
  assignedTo?: string | null
  assignedToName?: string | null
  /** Identity tokens allowed to see this. See the note at the top of the file. */
  recipients: string[]
  read: boolean
  readAt?: unknown
  readBy?: string | null
  /** When the message was received. */
  receivedAt?: unknown
  createdAt?: unknown
}

/** Lower-cases and trims one identifier; drops anything empty. */
export function identityToken(raw?: string | null): string | null {
  const value = (raw ?? "").trim().toLowerCase()
  return value.length > 0 ? value : null
}

/**
 * De-duplicated, normalised identifier list for one person. Order is not
 * meaningful — this is only ever used as a set.
 */
export function identityTokens(...raw: (string | null | undefined)[]): string[] {
  const tokens = new Set<string>()
  for (const value of raw) {
    const token = identityToken(value)
    if (token) tokens.add(token)
  }
  return [...tokens]
}

/** True when any of the reader's identifiers is on the notification. */
export function isRecipient(
  notification: Pick<WaNotification, "recipients">,
  viewerTokens: string[]
): boolean {
  if (viewerTokens.length === 0) return false
  return notification.recipients.some(recipient => viewerTokens.includes(recipient))
}

/**
 * Firestore document ids may not contain `/`, and WhatsApp's `wamid` is base64,
 * which can. Using the message id as the document id is what makes creating a
 * notification idempotent, so it has to survive the trip intact enough to stay
 * unique — a straight character swap does that without collapsing two distinct
 * ids together.
 */
export function notificationIdFor(messageId: string): string {
  return messageId.replace(/\//g, "_").slice(0, 1400)
}

/** Single-line preview of a message, for the bell and the push body. */
export function previewText(text: string, mediaType?: string): string {
  const collapsed = (text || "").replace(/\s+/g, " ").trim()
  if (collapsed) return collapsed
  if (mediaType === "image") return "📷 Photo"
  if (mediaType === "document") return "📄 Document"
  return "(empty message)"
}
