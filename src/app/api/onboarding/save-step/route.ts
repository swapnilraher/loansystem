import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

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

    const updatedPayload = {
      ...existingData,
      ...stepData,
      mobileNumber,
      currentStep: Math.max(existingData?.currentStep || 1, step || 1),
      updatedAt: new Date(),
      status: existingData?.status || "draft"
    };

    if (!existingDoc.exists) {
      updatedPayload.createdAt = new Date();
      updatedPayload.applicationId = `TSM-DRAFT-${mobileNumber}`;
    }

    await docRef.set(updatedPayload, { merge: true });

    return NextResponse.json({
      success: true,
      currentStep: updatedPayload.currentStep,
      message: "Progress saved successfully"
    });
  } catch (error: any) {
    console.error("Save Step Error:", error);
    return NextResponse.json({ error: "Failed to save progress." }, { status: 500 });
  }
}
