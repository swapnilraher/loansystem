import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const {
      name,
      phone,
      mobile,
      city,
      type = "Personal Loan",
      amount,
      employmentType = "Salaried",
      monthlyIncome,
      remarks,
      refCode, // DSA Code (e.g. TMS-552)
    } = await request.json();

    const cleanMobile = String(mobile || phone || "").replace(/\D/g, "");
    const cleanName = String(name || "").trim();

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: "Customer full name is required." }, { status: 400 });
    }
    if (!cleanMobile || cleanMobile.length !== 10) {
      return NextResponse.json({ error: "Valid 10-digit mobile number is required." }, { status: 400 });
    }

    const db = getAdminDb();
    const now = new Date();
    const cleanRefCode = String(refCode || "").trim().toUpperCase();

    let partnerId = "";
    let partnerName = "";
    let dsaCode = cleanRefCode;

    // 1. Look up referring DSA Partner in Firestore if referral code provided
    if (cleanRefCode) {
      // Check in users collection
      const userSnap = await db
        .collection("users")
        .where("dsaCode", "==", cleanRefCode)
        .limit(1)
        .get();

      if (!userSnap.empty) {
        const partnerDoc = userSnap.docs[0];
        partnerId = partnerDoc.id;
        const pData = partnerDoc.data();
        partnerName = pData.name || pData.fullName || pData.contactPersonName || "DSA Partner";
      } else {
        // Check in partner_applications collection
        const appSnap = await db
          .collection("partner_applications")
          .where("dsaCode", "==", cleanRefCode)
          .limit(1)
          .get();

        if (!appSnap.empty) {
          const appDoc = appSnap.docs[0];
          partnerId = appDoc.id;
          const aData = appDoc.data();
          partnerName = aData.fullName || aData.contactPersonName || aData.name || "DSA Partner";
        }
      }
    }

    // 2. Create Lead Record in CRM
    const leadRef = db.collection("leads").doc();
    const leadData = {
      id: leadRef.id,
      name: cleanName,
      phone: cleanMobile,
      mobile: cleanMobile,
      city: city ? String(city).trim() : "",
      type: type || "Personal Loan",
      amount: String(amount || "500000"),
      employmentType: employmentType || "Salaried",
      monthlyIncome: monthlyIncome ? String(monthlyIncome) : "",
      remarks: remarks ? String(remarks).trim() : "Applied via Partner Referral Link",
      status: "New Lead",
      category: "Customer Referral",
      source: cleanRefCode ? `Partner Referral (${cleanRefCode})` : "Direct Website",
      dsaCode: cleanRefCode,
      partnerId: partnerId || "",
      partnerName: partnerName || "",
      createdAt: now,
      updatedAt: now,
    };

    await leadRef.set(leadData);

    return NextResponse.json({
      success: true,
      message: "Loan application submitted successfully! Our banking desk will contact you shortly.",
      leadId: leadRef.id,
      partnerName: partnerName || null,
      dsaCode: cleanRefCode || null,
    });
  } catch (error: any) {
    console.error("Apply Lead Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit loan application." },
      { status: 500 }
    );
  }
}
