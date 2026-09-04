import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import cloudinary from "@/lib/cloudinary";
import { stepFieldsFor } from "@/lib/onboarding-steps";

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

    const cleanNum = mobileNumber.replace(/\D/g, "");
    const db = getAdminDb();
    const existingDocSnap = await db.collection("partner_applications").doc(cleanNum).get();
    if (existingDocSnap.exists) {
      const existingData = existingDocSnap.data();
      const status = String(existingData?.status || "").toLowerCase();
      if (
        status === "under_review" ||
        status === "approved" ||
        status === "rejected" ||
        Boolean(existingData?.submittedAt) ||
        (existingData?.applicationId && !existingData.applicationId.startsWith("TSM-DRAFT-"))
      ) {
        return NextResponse.json(
          {
            error: "Application is already submitted and locked for review. Document uploads are disabled.",
            locked: true,
          },
          { status: 403 }
        );
      }
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

    const documentRecord: Record<string, any> = {
      documentType,
      fileName:    file.name,
      mimeType:    file.type,
      sizeBytes:   file.size,
      fileUrl,
      source:      "manual",
      uploadMethod,
      uploadedAt,
      status:      "uploaded",
    };
    if (cloudinaryId) {
      documentRecord.cloudinaryId = cloudinaryId;
    } else {
      // Only inline the file when Cloudinary was unavailable, and only when it
      // fits: a Firestore document is capped at 1 MB, and base64 inflates by ~33%.
      const base64Bytes = Buffer.byteLength(base64Data, "utf8");
      if (base64Bytes < 700 * 1024) {
        documentRecord.base64Data = base64Data;
      } else {
        return NextResponse.json(
          {
            error:
              "Document storage is temporarily unavailable for files this large. Please retry, or upload a smaller (under 700 KB) copy.",
          },
          { status: 503 }
        );
      }
    }

    const docRef = db.collection("partner_applications").doc(cleanNum);
    const currentSnap = await docRef.get();
    const currentData = currentSnap.exists ? currentSnap.data() : {};

    const mergedDocuments = {
      ...(currentData?.documents || {}),
      [documentType]: documentRecord,
    };

    await docRef.set(
      {
        documents: mergedDocuments,
        ...stepFieldsFor({ ...currentData, documents: mergedDocuments }, { mobileVerified: true }),
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
