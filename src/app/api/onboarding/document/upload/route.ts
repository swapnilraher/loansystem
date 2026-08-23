import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs"; // Cloudinary SDK needs Node.js runtime

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file         = formData.get("file")         as File   | null;
    const documentType = formData.get("documentType") as string | null;
    const mobileNumber = formData.get("mobileNumber") as string | null;

    if (!file || !documentType || !mobileNumber) {
      return NextResponse.json(
        { error: "File, documentType, and mobileNumber are required." },
        { status: 400 }
      );
    }

    // ── Validate MIME types ────────────────────────────────────────────────
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed formats: JPG, PNG, WEBP, PDF." },
        { status: 400 }
      );
    }

    // ── Validate file size (max 10 MB) ─────────────────────────────────────
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10 MB limit." },
        { status: 400 }
      );
    }

    // ── Convert to base64 buffer for Cloudinary / fallback ───────────────
    const bytes      = await file.arrayBuffer();
    const buffer     = Buffer.from(bytes);
    const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;

    let fileUrl: string = base64Data;
    let cloudinaryId: string | undefined = undefined;
    let uploadMethod: "cloudinary" | "firestore_base64" = "firestore_base64";

    // ── Attempt Cloudinary Upload ─────────────────────────────────────────
    try {
      const publicId = `partner-kyc/${mobileNumber}/${documentType}_${Date.now()}`;
      
      const uploadResult = await cloudinary.uploader.upload(base64Data, {
        public_id:     publicId,
        folder:        "partner-kyc",
        resource_type: "auto",
        overwrite:     false,
        tags:          ["partner-kyc", mobileNumber, documentType],
      });

      if (uploadResult?.secure_url) {
        fileUrl      = uploadResult.secure_url;
        cloudinaryId = uploadResult.public_id;
        uploadMethod = "cloudinary";
      }
    } catch (cloudinaryErr: any) {
      console.warn("Cloudinary upload failed, using secure base64 fallback:", cloudinaryErr?.message || cloudinaryErr);
      // Fallback to storing base64Data directly so user upload NEVER breaks
    }

    const uploadedAt = new Date().toISOString();

    const documentRecord = {
      documentType,
      fileName:    file.name,
      mimeType:    file.type,
      sizeBytes:   file.size,
      fileUrl,
      base64Data:  uploadMethod === "firestore_base64" ? base64Data : undefined,
      cloudinaryId,
      uploadMethod,
      uploadedAt,
      status:      "uploaded",
    };

    const db     = getAdminDb();
    const docRef = db.collection("partner_applications").doc(mobileNumber);

    await docRef.set(
      {
        documents: {
          [documentType]: documentRecord,
        },
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success:      true,
      documentType,
      document: {
        fileName:    file.name,
        sizeBytes:   file.size,
        mimeType:    file.type,
        fileUrl,
        cloudinaryId,
        uploadMethod,
        uploadedAt,
        status:      "uploaded",
      },
    });
  } catch (error: any) {
    console.error("Document Upload Main Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload document. Please try again." },
      { status: 500 }
    );
  }
}
