import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

function sanitizePayload(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    const val = sanitizePayload(obj[key]);
    if (val !== undefined && val !== null) {
      clean[key] = val;
    }
  }
  return clean;
}

export async function POST(request: Request) {
  try {
    const { mobileNumber, step, stepData } = await request.json();

    if (!mobileNumber) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection("partner_applications").doc(mobileNumber);

    const existingDoc = await docRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};

    const rawPayload = {
      ...existingData,
      ...stepData,
      mobileNumber,
      currentStep: Math.max(existingData?.currentStep || 1, step || 1),
      updatedAt: new Date(),
      status: existingData?.status || "draft"
    };

    if (!existingDoc.exists) {
      rawPayload.createdAt = new Date();
      rawPayload.applicationId = `TSM-DRAFT-${mobileNumber}`;
    }

    const cleanPayload = sanitizePayload(rawPayload);

    await docRef.set(cleanPayload, { merge: true });

    return NextResponse.json({
      success: true,
      currentStep: cleanPayload.currentStep,
      message: "Progress saved successfully"
    });
  } catch (error: any) {
    console.error("Save Step Error:", error);
    return NextResponse.json({ error: "Failed to save progress." }, { status: 500 });
  }
}
