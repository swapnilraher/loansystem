import { NextResponse } from 'next/server';

const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";

// Outbound WhatsApp message sender (for OTP, notifications, manual messages)
export async function POST(request: Request) {
  try {
    const { phone, name, message } = await request.json();
    
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const url = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
    
    const body: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: finalPhone,
      type: "text",
      text: {
        body: message || `Hello ${name || 'Customer'}, this is TechStar. We received your request for a loan. When is a good time to talk?`
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

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('WhatsApp Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
