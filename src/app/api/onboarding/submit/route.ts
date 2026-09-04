import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { hasSignedAgreement } from "@/lib/onboarding-steps";

const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { mobileNumber, agreementConsent } = payload;
    const cleanMobile = String(mobileNumber || "").replace(/\D/g, "");

    if (!cleanMobile) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    if (!agreementConsent) {
      return NextResponse.json({ error: "Declaration and terms consent is required" }, { status: 400 });
    }

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const db = getAdminDb();
    const docRef = db.collection("partner_applications").doc(cleanMobile);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "No onboarding application found for this mobile number" }, { status: 404 });
    }

    const appData = docSnap.data();

    // ─── DUPLICATE SUBMISSION GUARD (idempotent) ───
    // Re-submitting an application that already left the partner's hands
    // returns the existing record instead of minting a second application ID.
    const existingStatus = String(appData?.status || "").toLowerCase();
    if (
      appData?.submittedAt ||
      ["under_review", "submitted", "submitted_for_review", "approved", "active", "rejected"].includes(existingStatus)
    ) {
      const existingSubmittedAt = appData?.submittedAt?.toDate
        ? appData.submittedAt.toDate().toISOString()
        : appData?.submittedAt || null;

      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        applicationId: appData?.applicationId,
        status: appData?.status || "under_review",
        submittedAt: existingSubmittedAt,
        agreementStatus: hasSignedAgreement(appData) ? "signed" : "pending",
        message: "Application has already been submitted and is under review.",
      });
    }

    // Verify mandatory steps & document presence
    if (!appData?.panNumber) {
      return NextResponse.json({ error: "PAN number is missing. Please complete Step 2." }, { status: 400 });
    }

    if (!appData?.documents?.panDoc) {
      return NextResponse.json({ error: "PAN document upload is required. Please complete Step 6." }, { status: 400 });
    }

    if (!appData?.documents?.aadhaarDoc && !appData?.documents?.aadhaarFrontDoc) {
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
      submissionIp: clientIp,
      // Canonical step state: preview is done, agreement signing is next.
      basicDetailsStatus: "completed",
      businessDetailsStatus: "completed",
      documentsStatus: "completed",
      previewStatus: "completed",
      agreementStatus: hasSignedAgreement(appData) ? "signed" : "pending",
      currentStepKey: hasSignedAgreement(appData) ? "COMPLETED" : "AGREEMENT",
      timeline: [
        ...(appData?.timeline || []),
        {
          title: "Application Submitted",
          description: `Application ${applicationId} submitted successfully for admin review.`,
          timestamp: submittedAt.toISOString(),
          actor: "applicant",
        },
      ],
    };

    // ─── ATOMIC BATCH WRITE (Applications + Users + Audit) ───
    const batch = db.batch();
    batch.set(docRef, finalApplication);

    const userRef = db.collection("users").doc(cleanMobile);
    batch.set(
      userRef,
      {
        mobileNumber: cleanMobile,
        fullName: appData.fullName || appData.contactPersonName || "Partner Applicant",
        name: appData.fullName || appData.contactPersonName || "Partner Applicant",
        email: appData.email || "",
        role: "partner",
        dsaStatus: "under_review",
        accountStatus: "under_review",
        onboardingStatus: hasSignedAgreement(appData) ? "COMPLETED" : "AGREEMENT",
        applicationId,
        referredByDsaCode: appData.referredByDsaCode || null,
        referringPartnerId: appData.referringPartnerId || null,
        updatedAt: submittedAt,
      },
      { merge: true }
    );

    // ─── LOG IN PARTNER REFERRALS COLLECTION ───
    if (appData.referredByDsaCode) {
      const referralLogRef = db.collection("partner_referrals").doc();
      batch.set(referralLogRef, {
        id: referralLogRef.id,
        referrerDsaCode: appData.referredByDsaCode,
        referringPartnerId: appData.referringPartnerId || "",
        referringPartnerName: appData.referringPartnerName || "",
        newPartnerMobile: cleanMobile,
        newPartnerName: appData.fullName || appData.contactPersonName || "New Partner",
        newPartnerEmail: appData.email || "",
        applicationId,
        status: "under_review",
        createdAt: submittedAt,
      });
    }

    const auditRef = db.collection("partner_audit_logs").doc();
    batch.set(auditRef, {
      event: "APPLICATION_SUBMITTED",
      applicationId,
      phoneNumber: cleanMobile,
      referredByDsaCode: appData.referredByDsaCode || null,
      ip: clientIp,
      timestamp: submittedAt,
    });

    await batch.commit();

    // ─── NOTIFY PARTNER VIA WHATSAPP ───
    if (PHONE_ID && TOKEN) {
      try {
        const partnerMsg = {
          messaging_product: "whatsapp",
          to: `${process.env.COUNTRY_CODE || "91"}${cleanMobile}`,
          type: "text",
          text: {
            body: `*Techstar Money - DSA Partner Application Submitted* 🌟\n\nDear ${appData.fullName || 'Partner'},\n\nYour application has been received successfully!\n\n📌 *Application ID:* ${applicationId}\n📌 *Status:* Under Review\n\nOur onboarding team will review your details and documents. Approval may take up to 24 hours.\n\nTrack Status: https://partner.techstarsolution.in/application-status?id=${applicationId}\n\nRegards,\n*Techstar Money Team*`,
          },
        };

        await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(partnerMsg),
        });
      } catch (waErr) {
        console.warn("Partner WhatsApp notification error:", waErr);
      }
    }

    // ─── NOTIFY ADMIN VIA WHATSAPP ───
    const adminWhatsApp = process.env.ADMIN_WHATSAPP;
    if (PHONE_ID && TOKEN && adminWhatsApp) {
      try {
        const adminMessageText = `🚨 *NEW DSA PARTNER APPROVAL REQUEST* 🚨\n\nA new partner has submitted their onboarding application!\n\n📌 *Application ID:* ${applicationId}\n👤 *Name:* ${appData.fullName || appData.contactPersonName || 'N/A'}\n📞 *Mobile:* +91 ${cleanMobile}\n📧 *Email:* ${appData.email || 'N/A'}\n🏢 *Type:* ${appData.partnerType || 'Individual'}${appData.firmType ? ` (${appData.firmType})` : ''}\n🆔 *PAN:* ${appData.panNumber || 'N/A'}\n\n📍 *Office Address:*\n${appData.addressLine1 || ''}, ${appData.city || ''}, ${appData.district || ''}, ${appData.stateName || ''} - ${appData.pinCode || ''}\n\n🏦 *Bank Details:*\n• Holder: ${appData.bankDetails?.accountHolderName || 'N/A'}\n• Account: ${appData.bankDetails?.accountNumber || 'N/A'} (${appData.bankDetails?.accountType || 'Savings'})\n• Bank: ${appData.bankDetails?.bankName || 'N/A'}\n• Branch: ${appData.bankDetails?.branchName || 'N/A'}\n• IFSC: ${appData.bankDetails?.ifsc || 'N/A'}\n\n🔗 *Review & Approve Now:*\nhttps://admin.techstarsolution.in/partner-applications`;

        const adminPayload = {
          messaging_product: "whatsapp",
          to: `${process.env.COUNTRY_CODE || "91"}${adminWhatsApp.replace(/\D/g, "")}`,
          type: "text",
          text: { body: adminMessageText },
        };

        await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(adminPayload),
        });
      } catch (adminWaErr) {
        console.warn("Admin Notification Error:", adminWaErr);
      }
    }

    return NextResponse.json({
      success: true,
      applicationId,
      status: "under_review",
      submittedAt: submittedAt.toISOString(),
      message: "Application submitted successfully",
    });
  } catch (error: any) {
    console.error("Submit Application Error:", error);
    return NextResponse.json({ error: "Failed to submit application. Please try again." }, { status: 500 });
  }
}
