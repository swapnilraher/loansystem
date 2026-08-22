import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { mobileNumber, agreementConsent } = payload;

    if (!mobileNumber) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    if (!agreementConsent) {
      return NextResponse.json({ error: "Declaration and terms consent is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection("partner_applications").doc(mobileNumber);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "No onboarding application found for this mobile number" }, { status: 404 });
    }

    const appData = docSnap.data();

    // Verify mandatory steps & document presence
    if (!appData?.panNumber) {
      return NextResponse.json({ error: "PAN number is missing. Please complete Step 2." }, { status: 400 });
    }

    if (!appData?.documents?.panDoc) {
      return NextResponse.json({ error: "PAN document upload is required. Please complete Step 6." }, { status: 400 });
    }

    if (!appData?.documents?.aadhaarDoc) {
      return NextResponse.json({ error: "Aadhaar document upload is required. Please complete Step 6." }, { status: 400 });
    }

    if (!appData?.bankDetails?.accountNumber || !appData?.bankDetails?.ifsc) {
      return NextResponse.json({ error: "Bank account details are missing. Please complete Step 7." }, { status: 400 });
    }

    // Generate Unique Application ID: TSM-DSA-2026-XXXXXX
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const year = new Date().getFullYear();
    const applicationId = `TSM-DSA-${year}-${randomSeq}`;

    const submittedAt = new Date();

    const finalApplication = {
      ...appData,
      applicationId,
      status: "under_review",
      submittedAt,
      updatedAt: submittedAt,
      agreementConsent: true,
      timeline: [
        ...(appData?.timeline || []),
        {
          title: "Application Submitted",
          description: `Application ${applicationId} submitted successfully for admin review.`,
          timestamp: submittedAt.toISOString(),
          actor: "applicant"
        }
      ]
    };

    await docRef.set(finalApplication);

    // Send WhatsApp confirmation to Partner
    try {
      const partnerMsg = {
        messaging_product: "whatsapp",
        to: `${process.env.COUNTRY_CODE || "91"}${mobileNumber}`,
        type: "text",
        text: {
          body: `*Techstar Money - DSA Partner Application Submitted* 🌟\n\nDear ${appData.fullName || 'Partner'},\n\nYour application has been received successfully!\n\n📌 *Application ID:* ${applicationId}\n📌 *Status:* Under Review\n\nOur onboarding team will review your details and documents. Approval may take up to 24 hours.\n\nTrack Status: https://partner.swapnilaher.in/application-status?id=${applicationId}\n\nRegards,\n*Techstar Money Team*`
        }
      };

      await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(partnerMsg),
      });
    } catch (waErr) {
      console.warn("Notification error:", waErr);
    }

    return NextResponse.json({
      success: true,
      applicationId,
      status: "under_review",
      submittedAt: submittedAt.toISOString(),
      message: "Application submitted successfully"
    });
  } catch (error: any) {
    console.error("Submit Application Error:", error);
    return NextResponse.json({ error: "Failed to submit application. Please try again." }, { status: 500 });
  }
}
