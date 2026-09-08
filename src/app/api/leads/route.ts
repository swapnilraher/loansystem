import { NextResponse } from 'next/server';
import { sendLeadNotificationToAdmins } from "@/lib/notificationService";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeDocs } from "@/lib/serialize";
import { requireStaffOrPartner } from "@/lib/apiAuth";

export async function GET(request: Request) {
  // This route answered without checking anyone at all, so every lead in the
  // business — names, phone numbers, cities — was readable by anyone who knew the
  // URL. POST below stays public because the marketing forms depend on it, but
  // nothing public ever reads the list.
  const auth = await requireStaffOrPartner(request);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 200);
    const offset = (page - 1) * limit;
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

    const db = getAdminDb();
    let query = db.collection("leads");

    // A portal caller sees only their own leads, whatever they ask for. The two
    // audiences are keyed differently: a DSA partner on the leads they sourced
    // (`partnerId`), a customer on the applications they submitted (`userId`).
    // Both clauses used to live in the browser and had to move here once the query
    // started running under the service account.
    if (auth.who.kind === "partner") {
      const portal = auth.who.partner;
      query =
        portal.portalRole === "partner"
          ? query.where("partnerId", "==", portal.partnerId)
          : query.where("userId", "==", portal.uid);
    }

    if (!includeDeleted) {
      query = query.where("deleted", "!=", true);
    }
    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    const totalSnap = await query.get();
    const total = totalSnap.size;

    const snap = await query.orderBy("createdAt", "desc").offset(offset).limit(limit).get();
    let leads = snap.docs.map((doc: { id: string; data: () => object }) => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter((l: any) =>
        String(l.name || "").toLowerCase().includes(q) ||
        String(l.phone || "").toLowerCase().includes(q) ||
        String(l.city || "").toLowerCase().includes(q)
      );
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      // Dates JSON-serialize to ISO on their own; this also normalises the
      // {_seconds} shapes that came across from Firestore, so the client sees
      // one timestamp format rather than two.
      leads: serializeDocs(leads),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
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
          // The adapter takes a collection NAME, not a Firestore-style path — a
          // slash path here made a literal collection called "leads/<id>/remarks",
          // so these notes landed somewhere nothing ever reads. Subcollections go
          // through the parent document reference.
          await db.collection("leads").doc(existingLeadId).collection("remarks").add({
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
    
    // Insert lead directly into MongoDB
    const db = getAdminDb();
    const newDoc = await db.collection("leads").add({
      name: data.fullName || data.name || 'N/A',
      phone: data.mobileNumber || data.phone || 'N/A',
      email: data.email || 'N/A',
      type: data.type || (data.source?.includes('Home') ? 'Home Loan' : 'Personal Loan'),
      amount: String(data.loanAmount || data.amount || '0'),
      city: data.city || 'N/A',
      employmentType: data.employmentType || 'N/A',
      monthlyIncome: String(data.monthlyIncome || 'N/A'),
      status: data.status || 'New Lead',
      source: data.source || 'Website Landing',
      category: data.category || 'Landing',
      createdAt: new Date(),
    });

    const newLeadId = newDoc.id;

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
          // The welcome message is recorded like any other outbound message so it
          // appears in the lead's chat thread. This previously wrote to Firestore
          // over REST using PROJECT_ID, FIREBASE_API_KEY and firestoreFetch — none
          // of which this file imports, so it threw a ReferenceError into the
          // surrounding catch on every new lead and the message was never logged.
          await getAdminDb().collection("whatsapp_messages").add({
            phone: phone10,
            leadId: newLeadId || "",
            text: message,
            sender: "staff",
            userName: "System",
            timestamp: new Date(),
            mediaType: "",
            mediaUrl: "",
            filename: "",
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
