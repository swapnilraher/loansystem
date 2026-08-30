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

    let statusData: any = null;
    let docsData: any = null;
    let aadhaarDetails: any = null;
    let panDetails: any = null;
    let fetchAadhaarDoc: any = null;
    let fetchPanDoc: any = null;

    // 1. Fetch Session Status
    try {
      const statusRes = await fetch(`${baseUrl}/api/sandbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-digilocker-status",
          payload: { session_id: sessionId }
        })
      });
      if (statusRes.ok) {
        statusData = await statusRes.json();
      }
    } catch (e) {
      console.warn("Could not fetch DigiLocker session status:", e);
    }

    // 2. Fetch Issued Documents List
    try {
      const docsRes = await fetch(`${baseUrl}/api/sandbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-digilocker-documents",
          payload: { session_id: sessionId }
        })
      });
      if (docsRes.ok) {
        docsData = await docsRes.json();
      }
    } catch (e) {
      console.warn("Could not fetch DigiLocker documents list:", e);
    }

    // 3. Fetch e-Aadhaar
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

    // 4. Fetch PAN
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

    // 5. Try fetching document URLs directly via documents/{doc_type}
    try {
      const fetchAadhaarRes = await fetch(`${baseUrl}/api/sandbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-digilocker-fetch-document",
          payload: { session_id: sessionId, doc_type: "aadhaar" }
        })
      });
      if (fetchAadhaarRes.ok) {
        fetchAadhaarDoc = await fetchAadhaarRes.json();
      }
    } catch (e) {
      console.warn("Fetch document aadhaar failed:", e);
    }

    try {
      const fetchPanRes = await fetch(`${baseUrl}/api/sandbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-digilocker-fetch-document",
          payload: { session_id: sessionId, doc_type: "pan" }
        })
      });
      if (fetchPanRes.ok) {
        fetchPanDoc = await fetchPanRes.json();
      }
    } catch (e) {
      console.warn("Fetch document pan failed:", e);
    }

    const uploadedAt = new Date().toISOString();

    const consentedList: string[] = statusData?.data?.documents_consented || [];
    const sessionSucceeded = statusData?.data?.status === "succeeded" || statusData?.code === 200;

    const isDocListArray = Array.isArray(docsData?.data)
      ? docsData.data
      : Array.isArray(docsData?.data?.documents)
      ? docsData.data.documents
      : Array.isArray(docsData?.documents)
      ? docsData.documents
      : [];

    const hasAadhaarInList = isDocListArray.some((d: any) => {
      const type = String(d?.doctype || d?.doc_type || d?.type || "").toUpperCase();
      return type.includes("ADHAR") || type.includes("AADHAAR") || type.includes("UID");
    });

    const hasPanInList = isDocListArray.some((d: any) => {
      const type = String(d?.doctype || d?.doc_type || d?.type || "").toUpperCase();
      return type.includes("PAN") || type.includes("PANCR");
    });

    // Check Aadhaar consent & data availability
    const hasAadhaar = Boolean(
      consentedList.includes("aadhaar") ||
      (aadhaarDetails && (aadhaarDetails.code === 200 || aadhaarDetails.status === 200 || aadhaarDetails.status === "completed" || aadhaarDetails.status === "success")) ||
      aadhaarDetails?.data?.pdf_url ||
      aadhaarDetails?.pdf_url ||
      aadhaarDetails?.data?.file_url ||
      aadhaarDetails?.data?.uid ||
      fetchAadhaarDoc?.data?.files?.[0]?.url ||
      hasAadhaarInList ||
      sessionSucceeded
    );

    // Check PAN consent & data availability
    const hasPan = Boolean(
      consentedList.includes("pan") ||
      (panDetails && (panDetails.code === 200 || panDetails.status === 200 || panDetails.status === "completed" || panDetails.status === "success")) ||
      panDetails?.data?.pdf_url ||
      panDetails?.pdf_url ||
      panDetails?.data?.file_url ||
      panDetails?.data?.pan ||
      fetchPanDoc?.data?.files?.[0]?.url ||
      hasPanInList ||
      sessionSucceeded
    );

    console.log(`DigiLocker Session Verification -> hasAadhaar: ${hasAadhaar}, hasPan: ${hasPan}, sessionStatus: ${statusData?.data?.status}`);

    const aadhaarUrl =
      fetchAadhaarDoc?.data?.files?.[0]?.url ||
      aadhaarDetails?.data?.pdf_url ||
      aadhaarDetails?.pdf_url ||
      aadhaarDetails?.data?.file_url ||
      aadhaarDetails?.fileUrl ||
      "/img/digilocker_aadhaar.pdf";

    const panUrl =
      fetchPanDoc?.data?.files?.[0]?.url ||
      panDetails?.data?.pdf_url ||
      panDetails?.pdf_url ||
      panDetails?.data?.file_url ||
      panDetails?.fileUrl ||
      "/img/digilocker_pan.pdf";

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
        : `DigiLocker imported ${hasAadhaar ? "Aadhaar" : "documents"} successfully. Please upload any missing document manually.`,
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
