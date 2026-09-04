import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/apiAuth"
import { fetchTemplates } from "@/lib/waCampaigns"

/**
 * The approved WhatsApp templates the campaign builder can choose from.
 *
 * Admin-only and fetched fresh every time: the list is small, it changes
 * whenever Meta approves or pauses a template, and a stale list here means a
 * campaign built against a template that no longer exists.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const templates = await fetchTemplates()
    return NextResponse.json({ success: true, templates })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load templates."
    console.error("[wa-campaigns/templates]", message)
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
