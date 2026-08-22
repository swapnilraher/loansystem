import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { panNumber, mobileNumber } = await request.json();

    if (!panNumber) {
      return NextResponse.json({ error: "PAN number is required" }, { status: 400 });
    }

    const cleanPan = panNumber.trim().toUpperCase();

    // Regex check: 5 letters, 4 digits, 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(cleanPan)) {
      return NextResponse.json({
        valid: false,
        error: "Please enter a valid 10-character PAN number (e.g. ABCDE1234F)."
      }, { status: 400 });
    }

    const db = getAdminDb();

    // 1. Check existing users in 'users' collection
    const userPanQuery = await db.collection("users")
      .where("panData.panNumber", "==", cleanPan)
      .get();

    if (!userPanQuery.empty) {
      const existingDoc = userPanQuery.docs[0].data();
      if (existingDoc.mobileNumber !== mobileNumber) {
        return NextResponse.json({
          valid: false,
          isDuplicate: true,
          error: "This PAN is already registered with another partner account. Please login to your existing account."
        }, { status: 409 });
      }
    }

    // 2. Check existing applications in 'partner_applications' collection
    const appPanQuery = await db.collection("partner_applications")
      .where("panNumber", "==", cleanPan)
      .get();

    if (!appPanQuery.empty) {
      for (const doc of appPanQuery.docs) {
        const appData = doc.data();
        if (appData.mobileNumber !== mobileNumber && appData.status !== "rejected") {
          return NextResponse.json({
            valid: false,
            isDuplicate: true,
            error: "This PAN is already linked to an active partner application."
          }, { status: 409 });
        }
      }
    }

    return NextResponse.json({
      valid: true,
      panNumber: cleanPan,
      isDuplicate: false,
      message: "PAN number is valid and available."
    });
  } catch (error: any) {
    console.error("PAN Check Error:", error);
    return NextResponse.json({ error: "Failed to validate PAN number." }, { status: 500 });
  }
}
