import { NextResponse } from 'next/server';
import { getAdminDb } from "@/lib/firebase-admin";

const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";

// Outbound WhatsApp message sender (for OTP, notifications, manual messages)
export async function POST(request: Request) {
  try {
    const { phone, name, message, leadId, senderName } = await request.json();
    
    if (!phone || !message) {
      return NextResponse.json({ success: false, error: "Phone and message are required" }, { status: 400 });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const phone10 = finalPhone.startsWith('91') && finalPhone.length === 12 ? finalPhone.substring(2) : finalPhone;

    const url = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
    
    const body: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: finalPhone,
      type: "text",
      text: {
        body: message
      }
    };

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', result);
      return NextResponse.json({ success: false, error: result.error?.message || 'Failed to send message' }, { status: response.status });
    }

    // Save message to database
    try {
      const db = getAdminDb();
      await db.collection("whatsapp_messages").add({
        phone: phone10,
        leadId: leadId || "",
        text: message,
        sender: "staff",
        userName: senderName || "Staff",
        timestamp: new Date()
      });
    } catch (dbError) {
      console.error('Failed to log WhatsApp chat message:', dbError);
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('WhatsApp Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
