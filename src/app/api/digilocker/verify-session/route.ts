import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { sessionId, mobileNumber } = await request.json();

    if (!sessionId || !mobileNumber) {
      return NextResponse.json({ error: "Session ID and Mobile Number are required" }, { status: 400 });
    }

    const host = request.headers.get("host") || "partner.techstarsolution.in";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // 1. Fetch documents list from DigiLocker via Sandbox API
    const docsRes = await fetch(`${baseUrl}/api/sandbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get-digilocker-documents",
        payload: { session_id: sessionId }
      })
    });

    const docsData = await docsRes.json();
    console.log("DigiLocker fetched documents response:", JSON.stringify(docsData));

    // 2. Fetch e-Aadhaar & PAN details if available
    let aadhaarDetails: any = null;
    let panDetails: any = null;

    try {
      const eaadhaarRes = await fetch(`${baseUrl}/api/sandbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-digilocker-eaadhaar",
          payload: { session_id: sessionId }
        })
      });
      if (eaadhaarRes.ok) {
        aadhaarDetails = await eaadhaarRes.json();
      }
    } catch (e) {
      console.warn("Could not fetch eAadhaar:", e);
    }

    try {
      const panRes = await fetch(`${baseUrl}/api/sandbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-digilocker-pan",
          payload: { session_id: sessionId }
        })
      });
      if (panRes.ok) {
        panDetails = await panRes.json();
      }
    } catch (e) {
      console.warn("Could not fetch DigiLocker PAN:", e);
    }

    const uploadedAt = new Date().toISOString();

    // Check if Aadhaar and PAN were granted consent and successfully returned by DigiLocker
    const hasAadhaar = Boolean(
      (aadhaarDetails && aadhaarDetails.code === 200) ||
      aadhaarDetails?.data?.pdf_url ||
      aadhaarDetails?.pdf_url ||
      aadhaarDetails?.data?.uid ||
      docsData?.data?.some?.((d: any) => d.doctype === "ADHAR" || d.doctype === "aadhaar")
    );

    const hasPan = Boolean(
      (panDetails && panDetails.code === 200) ||
      panDetails?.data?.pdf_url ||
      panDetails?.pdf_url ||
      panDetails?.data?.pan ||
      docsData?.data?.some?.((d: any) => d.doctype === "PANCR" || d.doctype === "pan")
    );

    console.log(`DigiLocker Session Verification -> hasAadhaar: ${hasAadhaar}, hasPan: ${hasPan}`);

    const aadhaarUrl = aadhaarDetails?.data?.pdf_url || aadhaarDetails?.pdf_url || aadhaarDetails?.fileUrl || "/img/digilocker_aadhaar.pdf";
    const panUrl = panDetails?.data?.pdf_url || panDetails?.pdf_url || panDetails?.fileUrl || "/img/digilocker_pan.pdf";

    const aadhaarDocRecord = {
      documentType: "aadhaarFront",
      fileName: "DigiLocker_Aadhaar.pdf",
      mimeType: "application/pdf",
      sizeBytes: 102400,
      fileUrl: aadhaarUrl,
      base64Data: aadhaarDetails?.data?.base64 || aadhaarDetails?.base64 || undefined,
      uploadMethod: "digilocker",
      uploadedAt,
      status: "verified",
      digilockerVerified: true,
      digilockerSessionId: sessionId
    };

    const panDocRecord = {
      documentType: "panDoc",
      fileName: "DigiLocker_PAN.pdf",
      mimeType: "application/pdf",
      sizeBytes: 102400,
      fileUrl: panUrl,
      base64Data: panDetails?.data?.base64 || panDetails?.base64 || undefined,
      uploadMethod: "digilocker",
      uploadedAt,
      status: "verified",
      digilockerVerified: true,
      digilockerSessionId: sessionId
    };

    const updatedDocuments: Record<string, any> = {};
    if (hasAadhaar) {
      updatedDocuments.aadhaarFrontDoc = aadhaarDocRecord;
      updatedDocuments.aadhaarBackDoc = aadhaarDocRecord;
      updatedDocuments.aadhaarDoc = aadhaarDocRecord;
    }
    if (hasPan) {
      updatedDocuments.panDoc = panDocRecord;
    }

    const bothAllowed = hasAadhaar && hasPan;
    const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);
    const db = getAdminDb();
    const docRef = db.collection("partner_applications").doc(cleanMobile);

    const updatePayload: Record<string, any> = {
      documents: updatedDocuments,
      updatedAt: new Date()
    };

    if (hasAadhaar) {
      updatePayload.aadhaarCombined = true;
    }

    if (bothAllowed) {
      updatePayload.currentStep = 7;
    } else {
      updatePayload.currentStep = 6;
    }

    await docRef.set(updatePayload, { merge: true });

    return NextResponse.json({
      success: true,
      message: bothAllowed
        ? "DigiLocker documents successfully verified and imported!"
        : `DigiLocker imported ${hasAadhaar ? "Aadhaar" : "documents"} successfully, but ${!hasPan ? "PAN card" : "Aadhaar"} consent was not granted. Please upload it manually.`,
      hasAadhaar,
      hasPan,
      bothAllowed,
      documents: {
        ...(hasAadhaar ? { aadhaarFrontDoc: aadhaarDocRecord, aadhaarBackDoc: aadhaarDocRecord } : {}),
        ...(hasPan ? { panDoc: panDocRecord } : {})
      }
    });
  } catch (error: any) {
    console.error("DigiLocker Verify Session Error:", error);
    return NextResponse.json({ error: "Failed to verify DigiLocker session documents." }, { status: 500 });
  }
}
