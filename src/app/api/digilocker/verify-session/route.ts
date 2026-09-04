import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { extractImageSource, extractAnyFileUrl, uploadDigilockerImage } from "@/lib/digilockerAssets";
import { stepFieldsFor } from "@/lib/onboarding-steps";

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

    const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);

    // -- AADHAAR & PAN AS ORIGINAL IMAGES --
    // Images coming back from DigiLocker are uploaded to Cloudinary as image
    // assets. They are never converted into (or wrapped in) a PDF.
    const aadhaarImageSource =
      extractImageSource(aadhaarDetails) || extractImageSource(fetchAadhaarDoc);
    const panImageSource = extractImageSource(panDetails) || extractImageSource(fetchPanDoc);

    const [aadhaarImage, panImage] = await Promise.all([
      hasAadhaar && aadhaarImageSource
        ? uploadDigilockerImage(aadhaarImageSource, {
            publicId: `aadhaar_${cleanMobile}`,
            folder: "partner-kyc/digilocker",
            tags: ["digilocker", "aadhaar", cleanMobile],
          })
        : Promise.resolve(null),
      hasPan && panImageSource
        ? uploadDigilockerImage(panImageSource, {
            publicId: `pan_${cleanMobile}`,
            folder: "partner-kyc/digilocker",
            tags: ["digilocker", "pan", cleanMobile],
          })
        : Promise.resolve(null),
    ]);

    // Fall back to whatever document reference DigiLocker issued when no
    // image was available (e.g. an issuer that only exposes a PDF).
    const aadhaarFallbackUrl =
      extractAnyFileUrl(fetchAadhaarDoc) || extractAnyFileUrl(aadhaarDetails) || "";
    const panFallbackUrl = extractAnyFileUrl(fetchPanDoc) || extractAnyFileUrl(panDetails) || "";

    const aadhaarUrl = aadhaarImage?.secureUrl || aadhaarFallbackUrl;
    const panUrl = panImage?.secureUrl || panFallbackUrl;

    const aadhaarDocRecord = {
      documentType: "aadhaarFront",
      fileName: aadhaarImage
        ? `DigiLocker_Aadhaar.${aadhaarImage.format || "jpg"}`
        : "DigiLocker_Aadhaar",
      mimeType: aadhaarImage ? `image/${aadhaarImage.format || "jpeg"}` : "application/pdf",
      sizeBytes: aadhaarImage?.bytes ?? null,
      fileUrl: aadhaarUrl,
      cloudinaryId: aadhaarImage?.publicId || null,
      cloudinaryAssetId: aadhaarImage?.assetId || null,
      resourceType: aadhaarImage?.resourceType || null,
      source: "digilocker",
      uploadMethod: "digilocker",
      uploadedAt,
      // Consent can be granted without the issuer returning a retrievable
      // file; that is recorded rather than papered over with a dead URL.
      status: aadhaarUrl ? "verified" : "consented_no_file",
      fileMissing: !aadhaarUrl,
      digilockerVerified: true,
      digilockerSessionId: sessionId
    };

    const panDocRecord = {
      documentType: "panDoc",
      fileName: panImage ? `DigiLocker_PAN.${panImage.format || "jpg"}` : "DigiLocker_PAN",
      mimeType: panImage ? `image/${panImage.format || "jpeg"}` : "application/pdf",
      sizeBytes: panImage?.bytes ?? null,
      fileUrl: panUrl,
      cloudinaryId: panImage?.publicId || null,
      cloudinaryAssetId: panImage?.assetId || null,
      resourceType: panImage?.resourceType || null,
      source: "digilocker",
      uploadMethod: "digilocker",
      uploadedAt,
      status: panUrl ? "verified" : "consented_no_file",
      fileMissing: !panUrl,
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
    const db = getAdminDb();
    const docRef = db.collection("partner_applications").doc(cleanMobile);
    const existingSnap = await docRef.get();
    const existingData = existingSnap.exists ? existingSnap.data() : {};

    const updatePayload: Record<string, any> = {
      documents: { ...(existingData?.documents || {}), ...updatedDocuments },
      docUploadMethod: "digilocker",
      digilockerSessionId: sessionId,
      digilockerVerifiedAt: uploadedAt,
      updatedAt: new Date()
    };

    if (hasAadhaar) {
      updatePayload.aadhaarCombined = true;
    }

    // -- CLOUDINARY REFERENCES ON THE APPLICATION --
    if (aadhaarImage) {
      updatePayload.aadhaar_image_url = aadhaarImage.secureUrl;
      updatePayload.aadhaar_cloudinary_public_id = aadhaarImage.publicId;
      updatePayload.aadhaar_cloudinary_asset_id = aadhaarImage.assetId;
      updatePayload.aadhaar_image_format = aadhaarImage.format;

      // The Aadhaar image doubles as the partner profile photo -- referenced,
      // never uploaded a second time.
      if (!existingData?.profile_photo_url) {
        updatePayload.profile_photo_url = aadhaarImage.secureUrl;
        updatePayload.profilePhotoUrl = aadhaarImage.secureUrl;
        updatePayload.profile_photo_source = "digilocker_aadhaar";
      }
    }

    if (panImage) {
      updatePayload.pan_image_url = panImage.secureUrl;
      updatePayload.pan_cloudinary_public_id = panImage.publicId;
      updatePayload.pan_cloudinary_asset_id = panImage.assetId;
      updatePayload.pan_image_format = panImage.format;
    }

    Object.assign(
      updatePayload,
      stepFieldsFor({ ...existingData, ...updatePayload }, { mobileVerified: true })
    );

    await docRef.set(updatePayload, { merge: true });

    // Mirror the profile photo onto the user record so the portal avatar works
    // straight after login.
    if (updatePayload.profile_photo_url) {
      try {
        await db.collection("users").doc(cleanMobile).set(
          {
            profile_photo_url: updatePayload.profile_photo_url,
            profilePhotoUrl: updatePayload.profile_photo_url,
            photoURL: updatePayload.profile_photo_url,
            updatedAt: new Date()
          },
          { merge: true }
        );
      } catch (photoErr) {
        console.warn("Profile photo sync note:", photoErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: bothAllowed
        ? "DigiLocker documents successfully verified and imported!"
        : `DigiLocker imported ${hasAadhaar ? "Aadhaar" : "documents"} successfully. Please upload any missing document manually.`,
      hasAadhaar,
      hasPan,
      bothAllowed,
      aadhaarImageUrl: aadhaarImage?.secureUrl || null,
      panImageUrl: panImage?.secureUrl || null,
      profilePhotoUrl: updatePayload.profile_photo_url || existingData?.profile_photo_url || null,
      currentStep: updatePayload.currentStep,
      currentStepKey: updatePayload.currentStepKey,
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
