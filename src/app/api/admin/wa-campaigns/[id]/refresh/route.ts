import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/apiAuth"
import { recomputeCampaign } from "@/lib/waCampaigns"

/**
 * The report's Refresh button, and the only thing that recalculates a campaign.
 *
 * Delivery receipts arrive continuously on the WhatsApp webhook and are written
 * straight onto each recipient, so the per-recipient log is always current. The
 * campaign's headline counts are a running tally that this recount rebuilds
 * from those recipients — which also repairs the totals if a counter increment
 * was ever lost to a failed write.
 *
 * Deliberately not called when the report page loads: opening a report should
 * cost one document read, not a full scan.
 */

export const maxDuration = 60

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const { id } = await ctx.params

  try {
    const { counts, processed } = await recomputeCampaign(id)
    return NextResponse.json({ success: true, counts, processed })
  } catch (error: unknown) {
    console.error(`[wa-campaigns/${id}/refresh] Failed:`, error)
    return NextResponse.json(
      { success: false, error: "Could not refresh the report." },
      { status: 500 }
    )
  }
}
