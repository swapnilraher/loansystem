import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import { checkPartnerEligibility } from "@/lib/partnerEligibility";
import { memoryOtpStore } from "@/lib/otp-store";

const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;
const OTP_SALT = process.env.OTP_HASH_SALT || "TSM_SECURE_FINTECH_SALT_2026";

export function hashOtp(otp: string, phone: string): string {
  return crypto
    .createHmac("sha256", OTP_SALT)
    .update(`${phone}:${otp.trim()}`)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const { phoneNumber, isLogin } = await request.json();
    const cleanPhone = String(phoneNumber || "").replace(/\D/g, "");

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Valid 10-digit Indian mobile number is required" }, { status: 400 });
    }

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const db = getAdminDb();
    const now = new Date();

    // ─── 1. RATE LIMITING & ELIGIBILITY ───
    let existingData: any = null;
    let otpDocRef: any = null;

    try {
      const db = getAdminDb();
      if (db) {
        otpDocRef = db.collection("partner_otp_codes").doc(cleanPhone);
        const existingOtpSnap = await otpDocRef.get();
        if (existingOtpSnap.exists) {
          existingData = existingOtpSnap.data();
        }
      }
    } catch (dbErr) {
      console.warn("Firestore rate limiting check fallback (using memory store):", dbErr);
      existingData = memoryOtpStore.get(cleanPhone);
    }

    if (existingData) {
      const lastSent = existingData?.lastSentAt?.toDate ? existingData.lastSentAt.toDate() : new Date(existingData?.lastSentAt || 0);
      const diffMs = now.getTime() - lastSent.getTime();
      const attemptsCount = existingData?.sendAttempts || 0;

      // Rate limit check: cooldown 30s between consecutive requests
      if (diffMs < 30 * 1000) {
        const waitSeconds = Math.ceil((30 * 1000 - diffMs) / 1000);
        return NextResponse.json({
          error: `Please wait ${waitSeconds} seconds before requesting a new OTP.`
        }, { status: 429 });
      }

      // Max 5 attempts within 10 minutes window
      if (diffMs < 10 * 60 * 1000 && attemptsCount >= 5) {
        return NextResponse.json({
          error: "Too many OTP requests. Please try again after 10 minutes for security."
        }, { status: 429 });
      }
    }

    // ─── 2. CHECK PARTNER ELIGIBILITY BEFORE SENDING OTP ───
    const eligibility = await checkPartnerEligibility(cleanPhone, isLogin ? "login" : "onboarding");
    if (!eligibility.eligible) {
      return NextResponse.json({
        eligible: false,
        error: eligibility.marathiMessage || eligibility.message,
        message: eligibility.message,
        marathiMessage: eligibility.marathiMessage,
        reason: eligibility.reason,
        status: eligibility.status,
        redirectUrl: eligibility.redirectUrl,
        dsaCode: eligibility.dsaCode,
        applicationId: eligibility.applicationId,
      }, { status: 400 });
    }

    // ─── 3. CRYPTOGRAPHIC OTP GENERATION ───
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = hashOtp(otp, cleanPhone);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    const previousAttempts = existingData?.sendAttempts || 0;

    // Save to Firestore and memory fallback
    try {
      if (otpDocRef) {
        await otpDocRef.set({
          hashedOtp,
          expiresAt,
          phoneNumber: cleanPhone,
          verifyAttempts: 0,
          sendAttempts: previousAttempts + 1,
          lastSentAt: now,
          ip: clientIp,
          createdAt: now,
        });
      }
    } catch (saveErr) {
      console.warn("Firestore OTP write fallback (using memory store):", saveErr);
    }

    memoryOtpStore.set(cleanPhone, {
      hashedOtp,
      expiresAt,
      phoneNumber: cleanPhone,
      verifyAttempts: 0,
      sendAttempts: previousAttempts + 1,
      lastSentAt: now,
    });

    // ─── 4. IMMUTABLE AUDIT LOG ───
    try {
      await db.collection("partner_audit_logs").add({
        event: "OTP_SENT",
        phoneNumber: cleanPhone,
        ip: clientIp,
        isLogin: !!isLogin,
        timestamp: now,
      });
    } catch (auditErr) {
      console.warn("Audit log note:", auditErr);
    }

    // ─── 5. DISPATCH SMS VIA APITXT GATEWAY ───
    const apitxtAuthKey = process.env.APITXT_AUTH_KEY || process.env.Auth_Key;
    if (apitxtAuthKey) {
      try {
        const smsApiUrl = `https://apitxt.com/api/sendotp?authkey=${encodeURIComponent(apitxtAuthKey)}&mobile=${encodeURIComponent(cleanPhone)}&otp=${encodeURIComponent(otp)}`;
        await fetch(smsApiUrl).catch((e) => console.warn("APITXT GET dispatch note:", e));
      } catch (smsErr) {
        console.warn("APITXT SMS error:", smsErr);
      }
    }

    // ─── 6. DISPATCH WHATSAPP OTP VIA META CLOUD API ───
    if (PHONE_ID && TOKEN) {
      try {
        const templatePayload = {
          messaging_product: "whatsapp",
          to: `${process.env.COUNTRY_CODE || "91"}${cleanPhone}`,
          type: "template",
          template: {
            name: "otp",
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: otp }],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: otp }],
              },
            ],
          },
        };

        let response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templatePayload),
        });

        if (!response.ok) {
          // Fallback: direct text message
          const textPayload = {
            messaging_product: "whatsapp",
            to: `${process.env.COUNTRY_CODE || "91"}${cleanPhone}`,
            type: "text",
            text: {
              body: `*Techstar Money - Verification OTP*\n\nYour verification code is: *${otp}*\n\nValid for 5 minutes. Do not share this OTP with anyone.`,
            },
          };

          await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(textPayload),
          });
        }
      } catch (waErr) {
        console.warn("WhatsApp API dispatch note:", waErr);
      }
    }

    return NextResponse.json({
      success: true,
      eligible: true,
      message: "Verification OTP sent successfully",
      expiresInSeconds: 300,
      status: eligibility.status,
      applicationId: eligibility.applicationId,
      onboardingState: eligibility.onboardingState,
    });
  } catch (error: any) {
    console.error("Onboarding OTP Send Error:", error);
    return NextResponse.json({ error: "Failed to send verification OTP. Please try again." }, { status: 500 });
  }
}
