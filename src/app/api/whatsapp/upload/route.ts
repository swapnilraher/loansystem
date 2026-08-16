import { NextResponse } from "next/server";
import { GRAPH_BASE, WHATSAPP_PHONE_ID, WHATSAPP_TOKEN } from "@/lib/whatsappConfig";
import { mediaKindFor, validateMedia } from "@/lib/whatsappMediaShared";

/**
 * Uploads a staff attachment to WhatsApp's own media store and hands back the
 * media id.
 *
 * This is why the composer works without any file hosting of our own. The Cloud
 * API can send media either by public `link` or by `id`, and the `id` route
 * puts the bytes on Meta's servers — which matters here because this Firebase
 * project has no Storage bucket, so the previous `uploadBytes` path could never
 * have worked. The same id is then serveable back to the CRM through
 * `/api/whatsapp/media/[mediaId]`.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file was attached." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    const invalid = validateMedia(file.size, mimeType);
    if (invalid) {
      return NextResponse.json({ success: false, error: invalid }, { status: 413 });
    }

    const upstream = new FormData();
    upstream.append("messaging_product", "whatsapp");
    upstream.append("type", mimeType);
    upstream.append("file", file, file.name || "attachment");

    // No Content-Type header on purpose — `fetch` has to set it itself so the
    // multipart boundary matches the body it generates.
    const response = await fetch(`${GRAPH_BASE}/${WHATSAPP_PHONE_ID}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      body: upstream,
    });

    const result = await response.json();

    if (!response.ok || !result.id) {
      console.error("[WhatsApp upload] Meta rejected the upload:", result);
      return NextResponse.json(
        {
          success: false,
          error: result?.error?.message || "WhatsApp rejected the attachment.",
        },
        { status: response.status === 200 ? 502 : response.status }
      );
    }

    return NextResponse.json({
      success: true,
      mediaId: result.id,
      mediaKind: mediaKindFor(mimeType),
      mimeType,
      filename: file.name || "attachment",
      size: file.size,
    });
  } catch (error: unknown) {
    console.error("[WhatsApp upload] Unexpected failure:", error);
    return NextResponse.json(
      { success: false, error: "Could not upload the attachment." },
      { status: 500 }
    );
  }
}
