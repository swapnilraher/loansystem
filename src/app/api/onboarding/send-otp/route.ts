import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import { checkPartnerEligibility } from "@/lib/partnerEligibility";
import { memoryOtpStore } from "@/lib/otp-store";

import { WHATSAPP_PHONE_ID, WHATSAPP_TOKEN, GRAPH_VERSION } from "@/lib/whatsappConfig";

const PHONE_ID = WHATSAPP_PHONE_ID;
const TOKEN = WHATSAPP_TOKEN;
const OTP_SALT = process.env.OTP_HASH_SALT || "TSM_SECURE_FINTECH_SALT_2026";

/**
 * The eligibility lookup plus the OTP write plus the Meta round trip do not fit
 * inside the platform default. When the function was killed part-way the audit
 * log already held OTP_SENT while Meta had never been called, so the CRM showed
 * a sent OTP that no one could receive. The campaign routes already run at 60.
 */
export const maxDuration = 60;

/** Meta rejects a send with a JSON error body; keep it so the caller sees why. */
async function describeFailure(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return (
      body?.error?.error_user_msg ||
      body?.error?.error_data?.details ||
      body?.error?.message ||
      `HTTP ${response.status}`
    );
  } catch {
    return `HTTP ${response.status}`;
  }
}

// Not exported: a route file may only export handlers and segment config, and
// verify-otp / agreement-sign each hold their own copy of this.
function hashOtp(otp: string, phone: string): string {
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

    // ─── 4. DISPATCH SMS VIA APITXT GATEWAY ───
    // Every dispatch attempt records its own outcome. Reporting success while
    // both channels had failed is what let a whole week of OTPs go out to
    // nobody while the CRM insisted they had been sent.
    const failures: string[] = [];
    let delivered = false;

    const apitxtAuthKey = process.env.APITXT_AUTH_KEY || process.env.Auth_Key;
    if (apitxtAuthKey) {
      try {
        const smsApiUrl = `https://apitxt.com/api/sendotp?authkey=${encodeURIComponent(apitxtAuthKey)}&mobile=${encodeURIComponent(cleanPhone)}&otp=${encodeURIComponent(otp)}`;
        const smsRes = await fetch(smsApiUrl);
        if (smsRes.ok) delivered = true;
        else failures.push(`sms: HTTP ${smsRes.status}`);
      } catch (smsErr: any) {
        failures.push(`sms: ${smsErr?.message || String(smsErr)}`);
      }
    } else {
      failures.push("sms: APITXT_AUTH_KEY not configured");
    }

    // ─── 5. DISPATCH WHATSAPP OTP VIA META CLOUD API ───
    if (PHONE_ID && TOKEN) {
      const to = `${process.env.COUNTRY_CODE || "91"}${cleanPhone}`;
      const post = (payload: unknown) =>
        fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

      try {
        const templatePayload = {
          messaging_product: "whatsapp",
          to,
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

        const templateRes = await post(templatePayload);
        if (templateRes.ok) {
          delivered = true;
        } else {
          failures.push(`whatsapp template: ${await describeFailure(templateRes)}`);

          // Fallback: direct text message. Only reaches the handset inside an
          // open 24-hour service window, so its result is checked too.
          const textRes = await post({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: {
              body: `*Techstar Money - Verification OTP*\n\nYour verification code is: *${otp}*\n\nValid for 5 minutes. Do not share this OTP with anyone.`,
            },
          });
          if (textRes.ok) delivered = true;
          else failures.push(`whatsapp text: ${await describeFailure(textRes)}`);
        }
      } catch (waErr: any) {
        failures.push(`whatsapp: ${waErr?.message || String(waErr)}`);
      }
    } else {
      failures.push("whatsapp: credentials not configured");
    }

    // ─── 6. IMMUTABLE AUDIT LOG ───
    // Written after dispatch so the recorded event is what actually happened.
    try {
      await db.collection("partner_audit_logs").add({
        event: delivered ? "OTP_SENT" : "OTP_SEND_FAILED",
        phoneNumber: cleanPhone,
        ip: clientIp,
        isLogin: !!isLogin,
        dispatchErrors: failures,
        timestamp: now,
      });
    } catch (auditErr) {
      console.warn("Audit log note:", auditErr);
    }

    if (!delivered) {
      // The stored OTP is useless if nothing carried it, and leaving it behind
      // would hold the caller in the 30-second cooldown for an OTP they never got.
      try {
        await otpDocRef?.delete();
      } catch {}
      memoryOtpStore.delete(cleanPhone);

      console.error("[send-otp] every dispatch channel failed:", failures);
      return NextResponse.json(
        {
          error: "Could not deliver the verification OTP. Please try again or contact support.",
          dispatchErrors: failures,
        },
        { status: 502 }
      );
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
