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

    // Save to MongoDB. `getAdminDb()` has returned the Mongo adapter since the
    // migration — the old "Firestore" wording here sent a live OTP outage
    // investigation after a Firestore quota that nothing reads any more.
    try {
      console.log("Saving OTP to MongoDB...");
      const db = getAdminDb();
      await db.collection("otp_codes").doc(phoneNumber).set({
        otp,
        expiresAt,
        phoneNumber
      });
      console.log("MongoDB save successful");
    } catch (dbError: any) {
      // Deliberately no key material in the response: this used to dump the
      // start and end of FIREBASE_PRIVATE_KEY to any caller who guessed a
      // hardcoded header, and it described Firebase while the failure is Mongo.
      console.error("MongoDB OTP write failed:", dbError);
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
        // Fallback: Try sending direct text message if template dispatch fails
        const textPayload = {
          messaging_product: "whatsapp",
          to: `${process.env.COUNTRY_CODE || "91"}${phoneNumber}`,
          type: "text",
          text: {
            body: `*Techstar Money - Verification OTP*\n\nYour verification code is: *${otp}*\n\nValid for 5 minutes. Do not share this OTP with anyone.`,
          },
        };

        response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(textPayload),
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
