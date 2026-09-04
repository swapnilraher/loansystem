import { NextResponse } from "next/server"
import cloudinary from "@/lib/cloudinary"
import { requireAdmin } from "@/lib/apiAuth"

/**
 * Turns an uploaded campaign image into a public URL.
 *
 * Meta fetches the image itself from the `link` in the outgoing message, so it
 * has to be reachable from the public internet — a server path or a signed
 * Firebase URL would fail on their side, not ours. Cloudinary is already the
 * project's configured cloud storage (`@/lib/cloudinary`, used by the
 * onboarding document upload), so campaigns reuse it rather than introducing a
 * second host.
 *
 * The other image option, a URL the Admin pastes, needs none of this and is
 * passed to WhatsApp unchanged.
 */

/** WhatsApp will not fetch an image larger than this for a message header. */
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ["image/jpeg", "image/jpg", "image/png"]

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const form = await request.formData()
    const file = form.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No image was attached." }, { status: 400 })
    }
    if (!ALLOWED.includes((file.type || "").toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "WhatsApp only accepts JPEG or PNG images." },
        { status: 415 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "The image must be under 5 MB." },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`

    const upload = await cloudinary.uploader.upload(dataUri, {
      folder: "wa-campaigns",
      resource_type: "image",
    })

    if (!upload?.secure_url) {
      return NextResponse.json(
        { success: false, error: "Cloud storage did not return a public URL." },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      url: upload.secure_url,
      publicId: upload.public_id,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed."
    console.error("[wa-campaigns/upload-image]", message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
