import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/apiAuth"
import { stepCampaign } from "@/lib/waCampaigns"

export const maxDuration = 60

/**
 * Step runner for real-time campaign dispatch.
 *
 * Processes a small batch of recipients (default: 5) and returns progress
 * immediately, so the admin browser can show a real-time progress bar.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing campaign ID" }, { status: 400 })
  }

  try {
    let limit = 5
    try {
      const body = await request.json()
      if (typeof body?.limit === "number" && body.limit > 0 && body.limit <= 20) {
        limit = body.limit
      }
    } catch {
      // default limit
    }

    const result = await stepCampaign(id, limit)
    return NextResponse.json({ success: true, ...result })
  } catch (error: unknown) {
    console.error(`[wa-campaigns/${id}/step] Step failed:`, error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to process campaign step." },
      { status: 500 }
    )
  }
}
