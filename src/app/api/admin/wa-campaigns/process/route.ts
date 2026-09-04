import { NextResponse } from "next/server"
import { after } from "next/server"
import { runCampaign, WORKER_HEADER, WORKER_SECRET } from "@/lib/waCampaigns"

/**
 * The campaign worker's continuation hop.
 *
 * A batch that runs out of invocation time calls this to hand the rest of the
 * campaign to a fresh function. It answers 202 straight away and does the work
 * in `after()`, so the caller is not left holding a connection open for the
 * length of the next batch.
 *
 * The worker has no Firebase ID token, so this route cannot use `requireAdmin`.
 * It authenticates with a shared secret header instead — without which anyone
 * who found the URL could re-run somebody's campaign.
 */

export const maxDuration = 60

export async function POST(request: Request) {
  if (request.headers.get(WORKER_HEADER) !== WORKER_SECRET) {
    return NextResponse.json({ success: false, error: "Not authorised." }, { status: 401 })
  }

  let campaignId = ""
  try {
    const body = await request.json()
    campaignId = String(body?.campaignId || "")
  } catch {
    return NextResponse.json({ success: false, error: "Bad request body." }, { status: 400 })
  }

  if (!campaignId) {
    return NextResponse.json({ success: false, error: "campaignId is required." }, { status: 400 })
  }

  after(async () => {
    try {
      await runCampaign(campaignId)
    } catch (error) {
      console.error(`[wa-campaigns/process] Batch failed for ${campaignId}:`, error)
    }
  })

  return NextResponse.json({ success: true, campaignId }, { status: 202 })
}
