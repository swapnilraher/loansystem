import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";

const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const db = getAdminDb();
    let query: any = db.collection("partner_applications");

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("updatedAt", "desc").get();

    const applications = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data?.createdAt,
        updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
        submittedAt: data?.submittedAt?.toDate ? data.submittedAt.toDate().toISOString() : data?.submittedAt,
      };
    });

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error("Fetch Partner Applications Error:", error);
    return NextResponse.json({ error: "Failed to fetch partner applications." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, id, mobileNumber, reason, querySection, queryMessage } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: "Application ID and action are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection("partner_applications").doc(mobileNumber || id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Partner application not found" }, { status: 404 });
    }

    const appData = docSnap.data();
    const now = new Date();

    if (action === "approve") {
      // 1. Generate Partner ID e.g. TSM-P-100201
      const partnerSeq = Math.floor(100000 + Math.random() * 900000);
      const dsaCode = `TSM-P-${partnerSeq}`;

      // 2. Create / Update User record in 'users' collection with role='partner'
      const userRef = db.collection("users").doc(appData.mobileNumber);
      await userRef.set({
        uid: `partner_${appData.mobileNumber}`,
        fullName: appData.fullName || appData.contactPersonName || "Partner",
        email: appData.email || "",
        mobileNumber: appData.mobileNumber,
        role: "partner",
        dsaStatus: "Active",
        status: "Active",
        dsaCode,
        partnerType: appData.partnerType || "Individual",
        firmType: appData.firmType || "",
        panData: {
          panNumber: appData.panNumber || "",
          status: "verified"
        },
        bankDetails: appData.bankDetails || {},
        address: {
          line1: appData.addressLine1 || "",
          line2: appData.addressLine2 || "",
          city: appData.city || "",
          state: appData.stateName || "",
          pincode: appData.pinCode || ""
        },
        approvedAt: now,
        createdAt: appData.createdAt || now,
        updatedAt: now
      }, { merge: true });

      // 3. Update application status
      await docRef.update({
        status: "approved",
        dsaStatus: "Active",
        dsaCode,
        approvedAt: now,
        updatedAt: now,
        timeline: [
          ...(appData.timeline || []),
          {
            title: "Application Approved",
            description: `Partner account created with DSA Code: ${dsaCode}`,
            timestamp: now.toISOString(),
            actor: "admin"
          }
        ]
      });

      // 4. Send Approval WhatsApp Notification
      try {
        const waPayload = {
          messaging_product: "whatsapp",
          to: `${process.env.COUNTRY_CODE || "91"}${appData.mobileNumber}`,
          type: "text",
          text: {
            body: `🎉 *Congratulations ${appData.fullName || 'Partner'}!*\n\nYour Techstar Money DSA Partner Application has been *APPROVED*! 🌟\n\n📌 *Partner Code (DSA Code):* ${dsaCode}\n📌 *Partner Portal Login:* https://partner.techstarsolution.in/login\n\nYou can now log in using your WhatsApp mobile number to submit loan leads and track commissions!\n\nWelcome to Techstar Money!`
          }
        };

        await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(waPayload),
        });
      } catch (waErr) {
        console.warn("WhatsApp approval notice error:", waErr);
      }

      return NextResponse.json({ success: true, dsaCode, status: "approved" });
    } else if (action === "reject") {
      if (!reason) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      }

      await docRef.update({
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: now,
        updatedAt: now,
        timeline: [
          ...(appData.timeline || []),
          {
            title: "Application Rejected",
            description: `Reason: ${reason}`,
            timestamp: now.toISOString(),
            actor: "admin"
          }
        ]
      });

      return NextResponse.json({ success: true, status: "rejected" });
    } else if (action === "query") {
      if (!queryMessage) {
        return NextResponse.json({ error: "Query message is required" }, { status: 400 });
      }

      const newQuery = {
        section: querySection || "General",
        message: queryMessage,
        raisedAt: now.toISOString(),
        status: "pending"
      };

      await docRef.update({
        status: "query_raised",
        queries: [...(appData.queries || []), newQuery],
        updatedAt: now,
        timeline: [
          ...(appData.timeline || []),
          {
            title: `Query Raised (${newQuery.section})`,
            description: queryMessage,
            timestamp: now.toISOString(),
            actor: "admin"
          }
        ]
      });

      return NextResponse.json({ success: true, status: "query_raised" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Action Error:", error);
    return NextResponse.json({ error: "Failed to perform admin action." }, { status: 500 });
  }
}
