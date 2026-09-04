import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { memoryOtpStore } from "@/lib/otp-store";
import { deriveOnboardingState, resumeUrlFor } from "@/lib/onboarding-steps";

const OTP_SALT = process.env.OTP_HASH_SALT || "TSM_SECURE_FINTECH_SALT_2026";

function hashOtp(otp: string, phone: string): string {
  return crypto
    .createHmac("sha256", OTP_SALT)
    .update(`${phone}:${otp.trim()}`)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp } = await request.json();
    const cleanPhone = String(phoneNumber || "").replace(/\D/g, "");
    const cleanOtp = String(otp || "").trim();

    if (!cleanPhone || !cleanOtp) {
      return NextResponse.json({ error: "Phone number and OTP are required" }, { status: 400 });
    }

    const clientIp =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const db = getAdminDb();

    let data: any = null;
    let otpDocRef: any = null;

    try {
      if (db) {
        otpDocRef = db.collection("partner_otp_codes").doc(cleanPhone);
        const otpDoc = await otpDocRef.get();
        if (otpDoc.exists) {
          data = otpDoc.data();
        }
      }
    } catch (dbErr) {
      console.warn("Firestore verify-otp fallback (using memory store):", dbErr);
    }

    if (!data) {
      data = memoryOtpStore.get(cleanPhone);
    }

    if (!data) {
      return NextResponse.json({ error: "No active OTP found. Please request a new OTP." }, { status: 404 });
    }

    // Check attempts limit (max 5 attempts)
    if ((data?.verifyAttempts || 0) >= 5) {
      try { await otpDocRef?.delete(); } catch {}
      memoryOtpStore.delete(cleanPhone);
      return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 429 });
    }

    // Check expiration
    const expiresAt = data?.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data?.expiresAt || 0);
    if (new Date() > expiresAt) {
      try { await otpDocRef?.delete(); } catch {}
      memoryOtpStore.delete(cleanPhone);
      return NextResponse.json({ error: "OTP has expired. Please request a new OTP." }, { status: 400 });
    }

    // Verify cryptographic hash (supports fallback for raw OTP if migrating)
    const expectedHashedOtp = data?.hashedOtp;
    const computedHashedOtp = hashOtp(cleanOtp, cleanPhone);
    const isMatched = expectedHashedOtp ? expectedHashedOtp === computedHashedOtp : data?.otp === cleanOtp;

    if (!isMatched) {
      try {
        await otpDocRef?.update({ verifyAttempts: (data?.verifyAttempts || 0) + 1 });
      } catch {}
      if (data) {
        data.verifyAttempts = (data.verifyAttempts || 0) + 1;
        memoryOtpStore.set(cleanPhone, data);
      }
      return NextResponse.json({ error: "Invalid verification OTP code. Please check and try again." }, { status: 400 });
    }

    // Verified! Erase ephemeral OTP record
    try { await otpDocRef?.delete(); } catch {}
    memoryOtpStore.delete(cleanPhone);

    const now = new Date();

    // ─── ATOMIC TRANSACTION: CREATE / UPDATE DRAFT APPLICATION & USER ───
    // An existing application is always reused — verifying an OTP never
    // creates a second onboarding record for the same mobile number.
    const appDocRef = db.collection("partner_applications").doc(cleanPhone);
    const userDocRef = db.collection("users").doc(cleanPhone);

    const appDocSnap = await appDocRef.get();
    const existingAppData = appDocSnap.exists ? appDocSnap.data() : null;

    const currentStatus = existingAppData?.status || "draft";
    const state = deriveOnboardingState(existingAppData, { mobileVerified: true });

    const batch = db.batch();

    if (!appDocSnap.exists) {
      batch.set(
        appDocRef,
        {
          mobileNumber: cleanPhone,
          currentStep: 1,
          currentStepKey: "BASIC_DETAILS",
          mobileVerificationStatus: "completed",
          status: "draft",
          mobileVerified: true,
          mobileVerifiedAt: now,
          createdAt: now,
          updatedAt: now,
          applicationId: `TSM-DRAFT-${cleanPhone}`,
        },
        { merge: true }
      );
    } else {
      batch.set(
        appDocRef,
        {
          mobileVerified: true,
          mobileVerifiedAt: existingAppData?.mobileVerifiedAt || now,
          mobileVerificationStatus: "completed",
          currentStepKey: state.currentStep,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    // Sync to users collection
    batch.set(
      userDocRef,
      {
        mobileNumber: cleanPhone,
        role: "partner",
        dsaStatus: currentStatus,
        accountStatus: currentStatus === "approved" ? "active" : currentStatus,
        onboardingStatus: state.currentStep,
        mobileVerified: true,
        mobileVerifiedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();

    // ─── IMMUTABLE AUDIT LOG ───
    try {
      await db.collection("partner_audit_logs").add({
        event: "OTP_VERIFIED",
        phoneNumber: cleanPhone,
        ip: clientIp,
        timestamp: now,
      });
    } catch (auditErr) {
      console.warn("Audit log note:", auditErr);
    }

    // ─── GENERATE FIREBASE CUSTOM TOKEN FOR SEAMLESS CLIENT AUTH ───
    let customToken = "";
    try {
      const authAdmin = getAdminAuth();
      const uid = cleanPhone;
      try {
        await authAdmin.getUser(uid);
      } catch (uErr: any) {
        if (uErr.code === "auth/user-not-found") {
          await authAdmin.createUser({
            uid,
            phoneNumber: `+91${cleanPhone}`,
            displayName: existingAppData?.fullName || `Partner ${cleanPhone}`,
          });
        }
      }
      customToken = await authAdmin.createCustomToken(uid, {
        role: "partner",
        mobileNumber: cleanPhone,
      });
    } catch (tokenErr) {
      console.warn("Custom token generation warning:", tokenErr);
    }

    const verificationToken = Buffer.from(`${cleanPhone}_${Date.now()}_verified`).toString("base64");
    const applicationId = existingAppData?.applicationId || `TSM-DRAFT-${cleanPhone}`;

    return NextResponse.json({
      success: true,
      phoneNumber: cleanPhone,
      mobileVerified: true,
      currentStep: state.uiStep,
      currentStepKey: state.currentStep,
      onboardingState: state,
      resumeUrl: resumeUrlFor(state, applicationId),
      applicationId,
      status: currentStatus,
      verificationToken,
      customToken,
      verifiedAt: now.toISOString(),
      isExistingPartner: existingAppData ? existingAppData.status === "approved" : false,
      existingDsaCode: existingAppData?.dsaCode || "",
    });
  } catch (error: any) {
    console.error("Onboarding OTP Verify Error:", error);
    return NextResponse.json({ error: "Failed to verify OTP code." }, { status: 500 });
  }
}
