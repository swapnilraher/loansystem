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
        { error: "file, documentType, and mobileNumber are required." },
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
        { error: "Invalid file type. Allowed: JPG, PNG, WEBP, PDF." },
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

    // ── Convert to base64 data-URI for Cloudinary upload ──────────────────
    const bytes      = await file.arrayBuffer();
    const buffer     = Buffer.from(bytes);
    const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;

    // ── Upload to Cloudinary ───────────────────────────────────────────────
    // Folder structure: partner-kyc/<mobile>/<documentType>
    const publicId = `partner-kyc/${mobileNumber}/${documentType}_${Date.now()}`;

    const uploadResult = await cloudinary.uploader.upload(base64Data, {
      public_id:       publicId,
      folder:          "partner-kyc",
      resource_type:   "auto",          // handles PDFs + images
      overwrite:       false,
      tags:            ["partner-kyc", mobileNumber, documentType],
      context: {
        mobile:       mobileNumber,
        documentType: documentType,
        fileName:     file.name,
      },
    });

    const fileUrl        = uploadResult.secure_url;
    const cloudinaryId   = uploadResult.public_id;
    const uploadedAt     = new Date().toISOString();

    // ── Store metadata (no base64) in Firestore ────────────────────────────
    const documentRecord = {
      documentType,
      fileName:    file.name,
      mimeType:    file.type,
      sizeBytes:   file.size,
      fileUrl,          // ← Cloudinary CDN URL
      cloudinaryId,     // ← for deletion / re-fetch if needed
      uploadedAt,
      status: "uploaded",
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
        uploadedAt,
        status:      "uploaded",
      },
    });
  } catch (error: any) {
    console.error("Document Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload document. Please try again." },
      { status: 500 }
    );
  }
}
