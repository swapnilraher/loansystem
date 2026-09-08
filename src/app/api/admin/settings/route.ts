import { guarded, ANY_STAFF, ADMIN_ONLY } from "@/lib/apiCollection"
import { serializeDoc } from "@/lib/serialize"

/**
 * Company profile and notification preferences.
 *
 * Two fixed documents rather than a collection: `system_settings/company` and
 * `system_settings/notifications`. Every role reads them — the company details appear
 * on generated agreements and the notification flags gate outbound messages — but only
 * an Admin may write.
 */

const DOCS = ["company", "notifications"] as const
type SettingsDoc = (typeof DOCS)[number]

const isKnownDoc = (value: string): value is SettingsDoc =>
  (DOCS as readonly string[]).includes(value)

export async function GET(request: Request) {
  return guarded(request, ANY_STAFF, async ({ db, url }) => {
    const requested = String(url.searchParams.get("doc") || "").trim()

    if (requested) {
      if (!isKnownDoc(requested)) throw new Error("Unknown settings document.")
      const snap = await db.collection("system_settings").doc(requested).get()
      return { settings: snap.exists ? serializeDoc(snap.data()) : null }
    }

    // Both at once, which is what the settings screen loads on mount.
    const [company, notifications] = await Promise.all(
      DOCS.map(id => db.collection("system_settings").doc(id).get())
    )
    return {
      company: company.exists ? serializeDoc(company.data()) : null,
      notifications: notifications.exists ? serializeDoc(notifications.data()) : null,
    }
  })
}

export async function PATCH(request: Request) {
  return guarded<{ doc?: string; settings?: Record<string, unknown> }>(
    request,
    ADMIN_ONLY,
    async ({ db, body, caller }) => {
      const id = String(body.doc || "").trim()
      if (!isKnownDoc(id)) throw new Error("Unknown settings document.")

      // merge, so a screen that edits one section cannot blank the other fields
      // in the same document.
      await db.collection("system_settings").doc(id).set(
        {
          ...(body.settings || {}),
          updatedAt: new Date(),
          updatedBy: caller.email || caller.uid,
        },
        { merge: true }
      )
      return { doc: id }
    }
  )
}
