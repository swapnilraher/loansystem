import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();
    console.log("Starting OTP send for:", phoneNumber);

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    console.log("Generated OTP:", otp);

    // Save to Firestore
    try {
      console.log("Saving to Firestore...");
      const db = getAdminDb();
      await db.collection("otp_codes").doc(phoneNumber).set({
        otp,
        expiresAt,
        phoneNumber
      });
      console.log("Firestore save successful");
    } catch (fsError: any) {
      console.error("Firestore Error:", fsError);
      
      const debugHeader = request.headers.get("x-debug-key");
      if (debugHeader === "techstar-debug") {
        const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
        // We import the helper function indirectly or parse it inline for diagnostic view
        let key = rawKey;
        if (key.startsWith('"') && key.endsWith('"')) {
          key = key.slice(1, -1);
        }
        if (key.startsWith("'") && key.endsWith("'")) {
          key = key.slice(1, -1);
        }
        const cleanKey = key.replace(/\\n/g, '\n');

        return NextResponse.json({ 
          error: "Database error. Please try again later.",
          diagnostics: {
            rawKeyLength: rawKey.length,
            rawKeyStart: rawKey.substring(0, 30),
            rawKeyEnd: rawKey.substring(rawKey.length - 30),
            cleanKeyLength: cleanKey.length,
            cleanKeyStart: cleanKey.substring(0, 30),
            cleanKeyEnd: cleanKey.substring(cleanKey.length - 30),
            errorMessage: fsError?.message || String(fsError),
            errorStack: fsError?.stack
          }
        }, { status: 500 });
      }

      return NextResponse.json({ error: "Database error. Please try again later." }, { status: 500 });
    }

    // Send via WhatsApp Business API
    console.log("Sending WhatsApp message via Meta API...");
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
        // Fallback: Try without the button component (some older templates don't have it)
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
        const errorData = await response.json();
        console.error("WhatsApp Error:", errorData);
        return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 });
      }
    } catch (waError) {
      console.error("WhatsApp Request Error:", waError);
      return NextResponse.json({ error: "WhatsApp service unavailable" }, { status: 500 });
    }

    return NextResponse.json({ success: true, dummyOtp: otp });
  } catch (error) {
    console.error("Global OTP Send Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
