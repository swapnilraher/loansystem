import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";

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

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const db = getAdminDb();
    const otpDocRef = db.collection("partner_otp_codes").doc(cleanPhone);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: "No active OTP found. Please request a new OTP." }, { status: 404 });
    }

    const data = otpDoc.data();

    // Check attempts limit (max 5 attempts)
    if ((data?.verifyAttempts || 0) >= 5) {
      await otpDocRef.delete();
      return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 429 });
    }

    // Check expiration
    const expiresAt = data?.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data?.expiresAt || 0);
    if (new Date() > expiresAt) {
      await otpDocRef.delete();
      return NextResponse.json({ error: "OTP has expired. Please request a new OTP." }, { status: 400 });
    }

    // Verify cryptographic hash (supports fallback for raw OTP if migrating)
    const expectedHashedOtp = data?.hashedOtp;
    const computedHashedOtp = hashOtp(cleanOtp, cleanPhone);
    const isMatched = expectedHashedOtp ? expectedHashedOtp === computedHashedOtp : data?.otp === cleanOtp;

    if (!isMatched) {
      await otpDocRef.update({ verifyAttempts: (data?.verifyAttempts || 0) + 1 });
      return NextResponse.json({ error: "Invalid verification OTP code. Please check and try again." }, { status: 400 });
    }

    // Verified! Erase ephemeral OTP record
    await otpDocRef.delete();

    const now = new Date();

    // ─── ATOMIC TRANSACTION: CREATE / UPDATE DRAFT APPLICATION & USER ───
    const appDocRef = db.collection("partner_applications").doc(cleanPhone);
    const userDocRef = db.collection("users").doc(cleanPhone);

    const appDocSnap = await appDocRef.get();
    const existingAppData = appDocSnap.exists ? appDocSnap.data() : null;

    const currentStep = existingAppData?.currentStep || 1;
    const currentStatus = existingAppData?.status || "draft";

    const batch = db.batch();

    if (!appDocSnap.exists) {
      batch.set(
        appDocRef,
        {
          mobileNumber: cleanPhone,
          currentStep: 1,
          status: "draft",
          mobileVerified: true,
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
        mobileVerified: true,
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

    return NextResponse.json({
      success: true,
      phoneNumber: cleanPhone,
      currentStep,
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
