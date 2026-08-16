import { NextResponse } from 'next/server';
import { firestoreFetch } from '@/lib/firestore-rest';
import { sendLeadNotificationToAdmins } from "@/lib/notificationService";
import { getAdminDb } from "@/lib/firebase-admin";

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo";
const PROJECT_ID = "dsa-loan";

export async function GET() {
  return NextResponse.json({ status: 'API is working (REST Mode)' });
}

const lastLeadSubmissionByPhone = new Map<string, number>();

function isDuplicateLeadSubmission(phone: string): boolean {
  if (!phone || phone === 'N/A' || phone === '') return false;
  const now = Date.now();
  const lastTime = lastLeadSubmissionByPhone.get(phone);
  if (lastTime && now - lastTime < 15000) {
    return true;
  }
  lastLeadSubmissionByPhone.set(phone, now);
  if (lastLeadSubmissionByPhone.size > 500) {
    const oldestKey = lastLeadSubmissionByPhone.keys().next().value;
    if (oldestKey) {
      lastLeadSubmissionByPhone.delete(oldestKey);
    }
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const rawPhone = data.mobileNumber || data.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone && isDuplicateLeadSubmission(cleanPhone)) {
      console.log(`[Leads API] Duplicate lead submission for phone: ${cleanPhone} inside 15s window. Ignoring.`);
      return NextResponse.json({ success: true, message: "Duplicate submission ignored" }, { status: 200 });
    }

    // Check if a lead with this phone number already exists in CRM
    const phone10 = cleanPhone.length === 12 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;
    if (phone10) {
      try {
        const db = getAdminDb();
        let existingLeadId: string | null = null;
        
        const snap = await db.collection("leads").where("phone", "in", [phone10, `91${phone10}`, rawPhone]).limit(1).get();
        if (!snap.empty) {
          existingLeadId = snap.docs[0].id;
        } else {
          const snapMobile = await db.collection("leads").where("mobile", "in", [phone10, `91${phone10}`, rawPhone]).limit(1).get();
          if (!snapMobile.empty) {
            existingLeadId = snapMobile.docs[0].id;
          }
        }

        if (existingLeadId) {
          console.log(`[Leads API] Found existing lead ${existingLeadId} for phone: ${phone10}. Updating existing lead & moving to top.`);
          const now = new Date();
          const updateData: any = {
            updatedAt: now,
            lastActivityNote: `Re-submitted lead (${data.source || 'Web Form'})`,
            lastActivityType: "Update",
            lastActivityTime: now
          };
          if (data.fullName || data.name) updateData.name = data.fullName || data.name;
          if (data.type) updateData.type = data.type;
          if (data.loanAmount || data.amount) updateData.amount = String(data.loanAmount || data.amount);
          if (data.city) updateData.city = data.city;
          if (data.monthlyIncome) updateData.monthlyIncome = String(data.monthlyIncome);

          await db.collection("leads").doc(existingLeadId).update(updateData);
          await db.collection(`leads/${existingLeadId}/remarks`).add({
            note: `Re-submitted lead details from ${data.source || 'Web Form'} (Amount: ₹${data.loanAmount || data.amount || '0'})`,
            type: "Note",
            addedBy: "System",
            createdAt: now
          });

          return NextResponse.json({ success: true, message: "Existing lead updated and moved to top", leadId: existingLeadId });
        }
      } catch (checkErr) {
        console.error("Error checking existing lead by phone in API:", checkErr);
      }
    }
    
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
    
    const response = await firestoreFetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Firestore REST API Error');
    }

    const newLeadId = result.name.split('/').pop();

    // Trigger FCM push notification for the new lead concurrently (do not await yet)
    let notificationPromise: Promise<void> | null = null;
    try {
      notificationPromise = sendLeadNotificationToAdmins({ 
        id: newLeadId, 
        name: data.fullName || data.name || 'N/A',
        city: data.city || data.district || data.location || 'N/A', 
        type: data.type || (data.source?.includes('Home') ? 'Home Loan' : 'Personal Loan'),
        amount: data.loanAmount || data.amount || '0'
      });
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
          await firestoreFetch(firestoreUrlMsg, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msgData)
          });
        }
      } catch (waError) {
        console.error('Failed to send welcome WhatsApp message:', waError);
      }
    }
    
    // Await notification promise to ensure serverless context is preserved before returning
    if (notificationPromise) {
      try {
        await notificationPromise;
      } catch (err) {
        console.error("Error waiting for notification dispatch:", err);
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
