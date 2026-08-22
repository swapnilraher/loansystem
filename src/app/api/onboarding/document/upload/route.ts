import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string;
    const mobileNumber = formData.get("mobileNumber") as string;

    if (!file || !documentType || !mobileNumber) {
      return NextResponse.json({ error: "File, documentType, and mobileNumber are required" }, { status: 400 });
    }

    // Validate MIME types
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "Invalid file type. Allowed formats: JPG, JPEG, PNG, WEBP, PDF."
      }, { status: 400 });
    }

    // Validate File Size (Max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: "File size exceeds 10 MB limit."
      }, { status: 400 });
    }

    // Convert file to base64 buffer for secure storage in application document
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;

    const documentRecord = {
      documentType,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      base64Data,
      uploadedAt: new Date().toISOString(),
      status: "uploaded"
    };

    const db = getAdminDb();
    const docRef = db.collection("partner_applications").doc(mobileNumber);

    await docRef.set({
      documents: {
        [documentType]: documentRecord
      },
      updatedAt: new Date()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      documentType,
      document: {
        fileName: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
        uploadedAt: documentRecord.uploadedAt,
        status: "uploaded"
      }
    });
  } catch (error: any) {
    console.error("Document Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload document. Please try again." }, { status: 500 });
  }
}
