import { NextResponse } from 'next/server';
import { sendLeadNotificationToAdmins } from "@/lib/notificationService";

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo";
const PROJECT_ID = "dsa-loan";

export async function GET() {
  return NextResponse.json({ status: 'API is working (REST Mode)' });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Map form fields to Firestore REST format
    const leadData = {
      fields: {
        name: { stringValue: data.fullName || data.name || 'N/A' },
        phone: { stringValue: data.mobileNumber || data.phone || 'N/A' },
        email: { stringValue: data.email || 'N/A' },
        type: { stringValue: data.type || (data.source?.includes('Home') ? 'Home Loan' : 'Personal Loan') },
        amount: { stringValue: data.loanAmount || data.amount || '0' },
        city: { stringValue: data.city || 'N/A' },
        employmentType: { stringValue: data.employmentType || 'N/A' },
        monthlyIncome: { stringValue: data.monthlyIncome || 'N/A' },
        status: { stringValue: data.status || 'New Lead' },
        source: { stringValue: data.source || 'Website Landing' },
        category: { stringValue: data.category || 'Landing' },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };

    // Use standard fetch to Firestore REST API (Firewall-safe)
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?key=${FIREBASE_API_KEY}`;
    
    const response = await fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Firestore REST API Error');
    }

    const newLeadId = result.name.split('/').pop();

    // Trigger FCM push notification for the new lead
    try {
      sendLeadNotificationToAdmins({ 
        id: newLeadId, 
        name: data.fullName || data.name || 'N/A', 
        type: data.type || (data.source?.includes('Home') ? 'Home Loan' : 'Personal Loan'),
        amount: data.loanAmount || data.amount || '0'
      }).catch(console.error);
    } catch (err) {
      console.error("Error triggering push notification:", err);
    }

    // Send welcome WhatsApp message if phone is present
    const phone = data.mobileNumber || data.phone;
    if (phone) {
      try {
        const cleanPhone = phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const phone10 = finalPhone.startsWith('91') && finalPhone.length === 12 ? finalPhone.substring(2) : finalPhone;

        const name = data.fullName || data.name || 'Customer';
        const loanType = data.type || (data.source?.includes('Home') ? 'Home Loan' : 'Personal Loan');

        const message = `👋 *नमस्कार ${name}!*\nTechStar Money Solutions मध्ये आपले स्वागत आहे. \n\nतुमचा *${loanType}* चा अर्ज आम्हाला मिळाला आहे. आमचे loan advisor लवकरच तुम्हाला संपर्क करतील.\n\nआम्ही market मधील top banks आणि NBFCs सोबत official partner आहोत. आम्ही तुमची profile बघून कोणती बँक किंवा NBFC तुम्हाला जास्तीत जास्त (maximum) loan, कमीत कमी (minimum) interest rate मध्ये देऊ शकते, हे शोधून देतो.\n\nधन्यवाद!`;

        const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
        const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";

        const url = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
        const body = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: finalPhone,
          type: "text",
          text: { body: message }
        };

        const waResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (waResponse.ok) {
          // Log message to firebase firestore
          const firestoreUrlMsg = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/whatsapp_messages?key=${FIREBASE_API_KEY}`;
          const msgData = {
            fields: {
              phone: { stringValue: phone10 },
              leadId: { stringValue: newLeadId || "" },
              text: { stringValue: message },
              sender: { stringValue: "staff" },
              userName: { stringValue: "System" },
              timestamp: { timestampValue: new Date().toISOString() },
              mediaType: { stringValue: "" },
              mediaUrl: { stringValue: "" },
              filename: { stringValue: "" }
            }
          };
          await fetch(firestoreUrlMsg, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msgData)
          });
        }
      } catch (waError) {
        console.error('Failed to send welcome WhatsApp message:', waError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      id: newLeadId 
    }, { status: 201 });

  } catch (error: any) {
    console.error('REST API ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
