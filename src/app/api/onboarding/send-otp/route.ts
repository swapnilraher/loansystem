import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";

export async function POST(request: Request) {
  try {
    const { phoneNumber, isLogin } = await request.json();

    if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      return NextResponse.json({ error: "Valid 10-digit Indian mobile number is required" }, { status: 400 });
    }

    // Generate 6-digit OTP for enhanced security
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const db = getAdminDb();

    // Check if partner is already registered and approved in 'partners' collection
    const partnerSnap = await db.collection("partners").doc(phoneNumber).get();
    let isApprovedPartner = false;
    let dsaCode = "";

    if (partnerSnap.exists) {
      const pData = partnerSnap.data();
      const pStatus = String(pData?.status || pData?.partnerStatus || "").toLowerCase();
      if (pStatus === "active" || pStatus === "approved") {
        isApprovedPartner = true;
        dsaCode = pData?.dsaCode || pData?.partnerId || "";
      }
    } else {
      const partnerQuery = await db.collection("partners").where("mobileNumber", "==", phoneNumber).get();
      if (!partnerQuery.empty) {
        const pData = partnerQuery.docs[0].data();
        const pStatus = String(pData?.status || pData?.partnerStatus || "").toLowerCase();
        if (pStatus === "active" || pStatus === "approved") {
          isApprovedPartner = true;
          dsaCode = pData?.dsaCode || pData?.partnerId || "";
        }
      }
    }

    if (!isLogin && isApprovedPartner) {
      return NextResponse.json({
        error: "Your DSA Partner Application has already been approved! Please log in to access your Partner Portal.",
        alreadyApproved: true,
        dsaCode,
      }, { status: 400 });
    }

    await db.collection("partner_otp_codes").doc(phoneNumber).set({
      otp,
      expiresAt,
      phoneNumber,
      attempts: 0,
      createdAt: new Date(),
    });

    // 1. Send SMS via APITXT OTP API
    const apitxtAuthKey = process.env.APITXT_AUTH_KEY || "DlND6b_O5HBPyIX_vBbgVOms6FhG4SBILVCv3qKQY-o";
    try {
      // APITXT OTP API HTTP GET request
      const smsApiUrl = `https://apitxt.com/api/sendotp?authkey=${encodeURIComponent(apitxtAuthKey)}&mobile=${encodeURIComponent(phoneNumber)}&otp=${encodeURIComponent(otp)}`;
      await fetch(smsApiUrl).catch((e) => console.warn("APITXT GET dispatch note:", e));

      // APITXT OTP API HTTP POST request fallback
      await fetch("https://apitxt.com/api/sendotp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authkey: apitxtAuthKey,
          mobile: phoneNumber,
          otp: otp
        })
      }).catch((e) => console.warn("APITXT POST dispatch note:", e));
    } catch (smsErr) {
      console.warn("APITXT SMS API error:", smsErr);
    }

    // 2. Send WhatsApp OTP via Meta API
    try {
      const templatePayload = {
        messaging_product: "whatsapp",
        to: `${process.env.COUNTRY_CODE || "91"}${phoneNumber}`,
        type: "template",
        template: {
          name: "otp",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: otp }]
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: otp }]
            }
          ]
        }
      };

      let response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templatePayload),
      });

      if (!response.ok) {
        // Fallback: template without button
        templatePayload.template.components = [
          {
            type: "body",
            parameters: [{ type: "text", text: otp }]
          }
        ];
        response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templatePayload),
        });
      }

      if (!response.ok) {
        // Fallback: Send direct text message if template is not registered
        const textPayload = {
          messaging_product: "whatsapp",
          to: `${process.env.COUNTRY_CODE || "91"}${phoneNumber}`,
          type: "text",
          text: {
            body: `*Techstar Money - Partner Registration OTP*\n\nYour verification code is: *${otp}*\n\nValid for 5 minutes. Do not share this OTP with anyone.`
          }
        };

        await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(textPayload),
        });
      }
    } catch (waErr) {
      console.warn("WhatsApp API dispatch note:", waErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Verification OTP code sent successfully",
      expiresInSeconds: 300
    });
  } catch (error: any) {
    console.error("Onboarding OTP Send Error:", error);
    return NextResponse.json({ error: "Failed to send verification OTP. Please try again." }, { status: 500 });
  }
}
