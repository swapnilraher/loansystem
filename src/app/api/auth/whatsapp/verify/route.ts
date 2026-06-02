import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json({ error: "Phone number and OTP are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const otpDoc = await db.collection("otp_codes").doc(phoneNumber).get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: "OTP not found. Please request a new one." }, { status: 404 });
    }

    const data = otpDoc.data();

    // Check expiration
    if (new Date() > data?.expiresAt.toDate()) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    // Check code
    if (data?.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
    }

    // Delete OTP after successful verification
    await db.collection("otp_codes").doc(phoneNumber).delete();

    // Create or get user in Firebase
    const auth = getAdminAuth();
    let userRecord;
    const uid = `whatsapp_${phoneNumber}`;

    try {
      userRecord = await auth.getUser(uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          uid: uid,
          phoneNumber: `+91${phoneNumber}`,
          displayName: `User ${phoneNumber}`,
        });
      } else {
        throw error;
      }
    }

    // Generate Custom Token
    const customToken = await auth.createCustomToken(uid);

    return NextResponse.json({ success: true, customToken });
  } catch (error: any) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
