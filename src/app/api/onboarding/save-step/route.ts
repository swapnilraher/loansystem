import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { validateStepPayload } from "@/lib/validations/onboarding";

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
    const cleanMobile = String(mobileNumber || "").replace(/\D/g, "");

    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json({ error: "Valid mobile number is required" }, { status: 400 });
    }

    const stepNum = Number(step) || 1;

    // ─── 1. SERVER-SIDE ZOD VALIDATION ───
    if (stepData && Object.keys(stepData).length > 0) {
      const validation = validateStepPayload(stepNum, stepData);
      if (!validation.success) {
        const errorMessages = validation.error?.issues?.map((i: any) => i.message).join(", ");
        return NextResponse.json(
          { error: errorMessages || "Invalid step payload provided." },
          { status: 400 }
        );
      }
    }

    const db = getAdminDb();
    const docRef = db.collection("partner_applications").doc(cleanMobile);
    const existingDoc = await docRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};

    // ─── 2. STRICT UNIQUE EMAIL CHECK ───
    const targetEmail = String(stepData?.email || existingData?.email || "").trim().toLowerCase();

    if (targetEmail) {
      // Check in partner_applications with a different mobile number
      const appEmailSnap = await db.collection("partner_applications")
        .where("email", "==", targetEmail)
        .get();

      const conflictingApp = appEmailSnap.docs.find((d) => d.id !== cleanMobile);
      if (conflictingApp) {
        return NextResponse.json({
          error: `This Email ID ('${targetEmail}') is already registered with another mobile number (${conflictingApp.id}). Duplicate emails are strictly not allowed.`,
        }, { status: 400 });
      }

      // Check in partners collection with a different mobile number
      const partnerEmailSnap = await db.collection("partners")
        .where("email", "==", targetEmail)
        .get();

      const conflictingPartner = partnerEmailSnap.docs.find((d) => {
        const data = d.data();
        return (data.mobileNumber && data.mobileNumber !== cleanMobile) || d.id !== cleanMobile;
      });

      if (conflictingPartner) {
        return NextResponse.json({
          error: `This Email ID ('${targetEmail}') is already registered with an active DSA partner account. Duplicate emails are strictly not allowed.`,
        }, { status: 400 });
      }
    }

    const now = new Date();
    const currentStep = Math.max(existingData?.currentStep || 1, stepNum);

    const rawPayload = {
      ...existingData,
      ...stepData,
      mobileNumber: cleanMobile,
      currentStep,
      updatedAt: now,
      status: existingData?.status || "draft",
    };

    if (!existingDoc.exists) {
      rawPayload.createdAt = now;
      rawPayload.applicationId = `TSM-DRAFT-${cleanMobile}`;
    }

    const cleanPayload = sanitizePayload(rawPayload);

    // ─── 3. ATOMIC BATCH WRITE (Applications + Users) ───
    const batch = db.batch();
    batch.set(docRef, cleanPayload, { merge: true });

    const userRef = db.collection("users").doc(cleanMobile);
    batch.set(
      userRef,
      {
        mobileNumber: cleanMobile,
        fullName: cleanPayload.fullName || cleanPayload.contactPersonName || "Partner Applicant",
        email: cleanPayload.email || "",
        role: "partner",
        dsaStatus: cleanPayload.status || "draft",
        applicationId: cleanPayload.applicationId || `TSM-DRAFT-${cleanMobile}`,
        currentStep,
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();

    return NextResponse.json({
      success: true,
      currentStep: cleanPayload.currentStep,
      message: "Progress saved successfully",
      savedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Save Step Error:", error);
    return NextResponse.json({ error: "Failed to save progress." }, { status: 500 });
  }
}
