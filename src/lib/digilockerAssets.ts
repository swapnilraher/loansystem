import cloudinary from "@/lib/cloudinary";

/**
 * DigiLocker asset handling.
 *
 * Aadhaar and PAN arriving from DigiLocker are kept as their original image
 * files — they are uploaded to Cloudinary as images and referenced by URL.
 * No PDF is generated for them, and no PDF is converted from them.
 */

export interface CloudinaryImageMeta {
  secureUrl: string;
  publicId: string;
  assetId: string | null;
  format: string | null;
  resourceType: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp|tiff?)(\?|#|$)/i;

/** Data URI or bare base64 payload that decodes to an image. */
function asImageDataUri(value: string): string | null {
  const trimmed = value.trim();
  if (/^data:image\//i.test(trimmed)) return trimmed;
  if (/^data:/i.test(trimmed)) return null; // some other data URI (e.g. PDF)
  // Bare base64 with no prefix — assume JPEG, the format DigiLocker returns.
  if (trimmed.length > 256 && /^[A-Za-z0-9+/=\s]+$/.test(trimmed)) {
    return `data:image/jpeg;base64,${trimmed.replace(/\s+/g, "")}`;
  }
  return null;
}

/**
 * Find an image source inside a DigiLocker/Sandbox response.
 * Returns something Cloudinary can ingest directly (a remote URL or a data URI),
 * or `null` when the response only carries a PDF.
 */
export function extractImageSource(payload: any): string | null {
  if (!payload) return null;

  const containers = [payload, payload.data, payload.data?.data, payload.result].filter(Boolean);

  // 1. Explicit image / photo fields (DigiLocker returns the holder photo as base64).
  const imageKeys = [
    "photo",
    "photo_base64",
    "image",
    "image_base64",
    "aadhaar_image",
    "pan_image",
    "profile_image",
    "base64_image",
  ];
  for (const container of containers) {
    for (const key of imageKeys) {
      const value = container?.[key];
      if (typeof value === "string" && value.length > 64) {
        if (/^https?:\/\//i.test(value)) return value;
        const dataUri = asImageDataUri(value);
        if (dataUri) return dataUri;
      }
    }
  }

  // 2. File URLs that point at an image rather than a PDF.
  const urlCandidates: string[] = [];
  for (const container of containers) {
    for (const key of ["file_url", "fileUrl", "url", "document_url"]) {
      const value = container?.[key];
      if (typeof value === "string") urlCandidates.push(value);
    }
    const files = container?.files;
    if (Array.isArray(files)) {
      for (const file of files) {
        const value = file?.url || file?.file_url || file?.link;
        if (typeof value === "string") urlCandidates.push(value);
      }
    }
  }
  const imageUrl = urlCandidates.find((u) => IMAGE_EXTENSIONS.test(u));
  if (imageUrl) return imageUrl;

  return null;
}

/** Any usable source, image or not — used for the document reference fallback. */
export function extractAnyFileUrl(payload: any): string | null {
  if (!payload) return null;
  const containers = [payload, payload.data, payload.data?.data, payload.result].filter(Boolean);
  for (const container of containers) {
    const files = container?.files;
    if (Array.isArray(files) && files[0]?.url) return files[0].url;
    for (const key of ["pdf_url", "file_url", "fileUrl", "url", "document_url"]) {
      const value = container?.[key];
      if (typeof value === "string" && value) return value;
    }
  }
  return null;
}

/**
 * Upload a DigiLocker image to Cloudinary as an image asset.
 * Returns `null` (rather than throwing) so a Cloudinary outage can never
 * break the DigiLocker import itself.
 */
export async function uploadDigilockerImage(
  source: string,
  opts: { publicId: string; folder?: string; tags?: string[] }
): Promise<CloudinaryImageMeta | null> {
  try {
    const result = await cloudinary.uploader.upload(source, {
      public_id: opts.publicId,
      folder: opts.folder || "partner-kyc/digilocker",
      resource_type: "image", // never converted to or wrapped in a PDF
      overwrite: true,
      tags: opts.tags || ["digilocker"],
    });

    if (!result?.secure_url) return null;

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      assetId: (result as any).asset_id || null,
      format: result.format || null,
      resourceType: result.resource_type || "image",
      bytes: result.bytes ?? null,
      width: result.width ?? null,
      height: result.height ?? null,
    };
  } catch (err: any) {
    console.warn(`DigiLocker Cloudinary upload failed for ${opts.publicId}:`, err?.message || err);
    return null;
  }
}
