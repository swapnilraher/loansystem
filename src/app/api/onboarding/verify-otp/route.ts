import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json({ error: "Phone number and OTP are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const otpDocRef = db.collection("partner_otp_codes").doc(phoneNumber);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: "No active OTP found. Please request a new OTP." }, { status: 404 });
    }

    const data = otpDoc.data();

    // Check attempts limit (max 5 attempts)
    if (data?.attempts >= 5) {
      await otpDocRef.delete();
      return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 429 });
    }

    // Check expiration
    const expiresAt = data?.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data?.expiresAt);
    if (new Date() > expiresAt) {
      await otpDocRef.delete();
      return NextResponse.json({ error: "OTP has expired. Please request a new OTP." }, { status: 400 });
    }

    // Check OTP match
    if (data?.otp !== otp.trim()) {
      await otpDocRef.update({ attempts: (data?.attempts || 0) + 1 });
      return NextResponse.json({ error: "Invalid verification OTP code. Please check and try again." }, { status: 400 });
    }

    // Verified! Clear OTP code
    await otpDocRef.delete();

    // Create or update draft partner application so drop-offs are captured in Admin Panel right after mobile verification
    const now = new Date();
    const appDocRef = db.collection("partner_applications").doc(phoneNumber);
    const appDocSnap = await appDocRef.get();
    if (!appDocSnap.exists) {
      await appDocRef.set({
        mobileNumber: phoneNumber,
        currentStep: 1,
        status: "draft",
        mobileVerified: true,
        createdAt: now,
        updatedAt: now,
        applicationId: `TSM-DRAFT-${phoneNumber}`
      }, { merge: true });
    } else {
      await appDocRef.set({
        mobileVerified: true,
        updatedAt: now
      }, { merge: true });
    }

    // Check if partner already has a completed application or existing partner account
    const existingUserSnap = await db.collection("users").where("mobileNumber", "==", phoneNumber).get();
    let isExistingPartner = false;
    let existingDsaCode = "";

    if (!existingUserSnap.empty) {
      const userDoc = existingUserSnap.docs[0].data();
      isExistingPartner = true;
      existingDsaCode = userDoc.dsaCode || "";
    }

    // Generate Firebase Auth user & Custom Token so Firebase Auth signs in on client side
    let customToken = "";
    try {
      const authAdmin = getAdminAuth();
      const uid = phoneNumber;
      try {
        await authAdmin.getUser(uid);
      } catch (uErr: any) {
        if (uErr.code === "auth/user-not-found") {
          await authAdmin.createUser({
            uid,
            phoneNumber: `+91${phoneNumber}`,
            displayName: `Partner ${phoneNumber}`
          });
        }
      }
      customToken = await authAdmin.createCustomToken(uid);
    } catch (tokenErr) {
      console.warn("Custom token generation warning:", tokenErr);
    }

    // Create session token string
    const verificationToken = Buffer.from(`${phoneNumber}_${Date.now()}_verified`).toString("base64");

    return NextResponse.json({
      success: true,
      phoneNumber,
      verificationToken,
      customToken,
      verifiedAt: new Date().toISOString(),
      isExistingPartner,
      existingDsaCode
    });
  } catch (error: any) {
    console.error("Onboarding OTP Verify Error:", error);
    return NextResponse.json({ error: "Failed to verify OTP code." }, { status: 500 });
  }
}
