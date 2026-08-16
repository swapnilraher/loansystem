import { getAdminDb } from "@/lib/firebase-admin";
import { GRAPH_BASE, WHATSAPP_MEDIA_HEADERS } from "@/lib/whatsappConfig";

/**
 * Streams a WhatsApp image or document straight from Meta, by media id.
 *
 * Why this exists: incoming media used to be copied into Firebase Storage and
 * served from there, but this Firebase project has no Storage bucket, so every
 * upload threw, the error was swallowed, and each message was stored with an
 * empty `mediaUrl`. The chat bubble then had nothing to render and fell back to
 * showing only the "📷 Image" caption text.
 *
 * Serving from Meta needs no bucket. The trade-off is retention: Meta keeps
 * media for roughly 30 days, so this is the *display* path, while the Storage
 * copy (once a bucket exists) remains the durable one. `handleIncomingMedia`
 * prefers Storage and falls back here.
 */

/** Meta signs its download URLs for a few minutes, so never cache shared. */
const CACHE_CONTROL = "private, max-age=86400";

function notFound(reason: string) {
  console.warn(`[WhatsApp media] ${reason}`);
  return new Response("Not found", { status: 404 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params;
  if (!mediaId) return notFound("No media id in the request.");

  /**
   * Only ids this CRM has actually recorded may be fetched. Without this the
   * route would proxy any Graph object the access token can reach, for anyone
   * who guessed a URL.
   */
  try {
    const known = await getAdminDb()
      .collection("whatsapp_messages")
      .where("mediaId", "==", mediaId)
      .limit(1)
      .get();
    if (known.empty) return notFound(`Media id ${mediaId} is not on any message.`);
  } catch (error) {
    console.error("[WhatsApp media] Could not verify the media id:", error);
    return new Response("Media lookup failed", { status: 502 });
  }

  try {
    // 1. Media id -> a short-lived, signed CDN URL.
    const detailsRes = await fetch(`${GRAPH_BASE}/${mediaId}`, {
      headers: WHATSAPP_MEDIA_HEADERS,
    });
    if (!detailsRes.ok) {
      console.error(
        `[WhatsApp media] Graph lookup failed (${detailsRes.status}):`,
        (await detailsRes.text()).slice(0, 300)
      );
      return new Response("Upstream media lookup failed", { status: 502 });
    }

    const details = await detailsRes.json();
    if (!details.url) return notFound(`Graph returned no URL for ${mediaId}.`);

    // 2. Download the bytes. This one *must* carry the User-Agent.
    const fileRes = await fetch(details.url, { headers: WHATSAPP_MEDIA_HEADERS });
    if (!fileRes.ok || !fileRes.body) {
      console.error(
        `[WhatsApp media] CDN download failed (${fileRes.status}):`,
        (await fileRes.text()).slice(0, 300)
      );
      return new Response("Upstream media download failed", { status: 502 });
    }

    // 3. Hand the stream to the browser rather than buffering it here.
    return new Response(fileRes.body, {
      status: 200,
      headers: {
        "Content-Type": details.mime_type || fileRes.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": CACHE_CONTROL,
        // Lets the bubble render it inline instead of prompting a download.
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("[WhatsApp media] Unexpected failure:", error);
    return new Response("Media fetch failed", { status: 502 });
  }
}
