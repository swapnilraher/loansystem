/**
 * WhatsApp attachment rules shared by the composer (browser) and the upload
 * route (server).
 *
 * Deliberately separate from `@/lib/whatsappConfig`: that module carries the
 * access token as a literal fallback, so importing it from a client component
 * would bundle the token into the browser. Nothing here is secret.
 */

/** What WhatsApp calls the attachment when sending it. */
export type WaMediaKind = "image" | "video" | "document"

/**
 * Cloud API size ceilings, in bytes. Exceeding these fails at Meta's end with a
 * generic error, so both the composer and the upload route check first.
 */
export const WA_MEDIA_LIMITS: Record<WaMediaKind, number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  document: 100 * 1024 * 1024,
}

/**
 * WhatsApp only accepts JPEG and PNG as a true `image` message — webp is
 * reserved for stickers, and HEIC is not supported at all. Anything else still
 * goes through, just as a `document`, which is far better than refusing it.
 */
const NATIVE_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"]
const NATIVE_VIDEO_TYPES = ["video/mp4", "video/3gpp"]

/** File-picker `accept` values, mirroring WhatsApp's own attach menu. */
export const PHOTO_ACCEPT = "image/*,video/mp4,video/3gpp"
export const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf," +
  "application/msword,application/vnd.ms-excel,application/vnd.ms-powerpoint," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.openxmlformats-officedocument.presentationml.presentation," +
  "text/plain,text/csv"

/** How a given file should be sent. Falls back to `document`, never refuses. */
export function mediaKindFor(mimeType: string): WaMediaKind {
  const type = (mimeType || "").toLowerCase()
  if (NATIVE_IMAGE_TYPES.includes(type)) return "image"
  if (NATIVE_VIDEO_TYPES.includes(type)) return "video"
  return "document"
}

/** `null` when the file is fine, otherwise a message to show the user. */
export function validateMedia(size: number, mimeType: string): string | null {
  const kind = mediaKindFor(mimeType)
  const max = WA_MEDIA_LIMITS[kind]
  if (size <= 0) return "That file is empty."
  if (size > max) {
    return `${kind === "image" ? "Photos" : kind === "video" ? "Videos" : "Files"} must be under ${formatBytes(max)}. This one is ${formatBytes(size)}.`
  }
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Where the CRM serves a WhatsApp attachment from, by media id. Used for both
 * directions: incoming media the webhook recorded, and outgoing media the
 * composer uploaded to Meta.
 */
export function mediaProxyPath(mediaId: string): string {
  return `/api/whatsapp/media/${encodeURIComponent(mediaId)}`
}

/** The caption/preview text stored against an attachment that has no caption. */
export function defaultMediaText(kind: WaMediaKind, filename: string): string {
  if (kind === "image") return "📷 Image"
  if (kind === "video") return "🎥 Video"
  return `📄 ${filename || "Document"}`
}
