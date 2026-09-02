import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("id")?.trim();
    const rawMobile = searchParams.get("mobile")?.trim();
    const email = searchParams.get("email")?.trim().toLowerCase();
    const cleanMobile = rawMobile ? rawMobile.replace(/\D/g, "").slice(-10) : "";

    if (!applicationId && !cleanMobile && !email) {
      return NextResponse.json(
        { error: "Application ID, registered mobile number, or email is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    let appData: any = null;

    // 1. Lookup by direct doc ID if mobile provided
    if (cleanMobile) {
      const directDoc = await db.collection("partner_applications").doc(cleanMobile).get();
      if (directDoc.exists) {
        appData = directDoc.data();
      }
    }

    // 2. Lookup by Application ID
    if (!appData && applicationId) {
      const q = await db
        .collection("partner_applications")
        .where("applicationId", "==", applicationId)
        .limit(1)
        .get();
      if (!q.empty) {
        appData = q.docs[0].data();
      }
    }

    // 3. Lookup by Mobile Query
    if (!appData && cleanMobile) {
      const q = await db
        .collection("partner_applications")
        .where("mobileNumber", "==", cleanMobile)
        .limit(1)
        .get();
      if (!q.empty) {
        appData = q.docs[0].data();
      }
    }

    // 4. Lookup by Email
    if (!appData && email) {
      const q = await db
        .collection("partner_applications")
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!q.empty) {
        appData = q.docs[0].data();
      }
    }

    // 5. Fallback: check users collection
    if (!appData && cleanMobile) {
      const userDoc = await db.collection("users").doc(cleanMobile).get();
      if (userDoc.exists) {
        const u = userDoc.data();
        appData = {
          applicationId: u?.applicationId || `TSM-DSA-${cleanMobile}`,
          status: u?.dsaStatus || u?.status || (u?.role === "partner" ? "approved" : "draft"),
          fullName: u?.fullName || u?.name || "",
          partnerType: u?.partnerType || "Individual",
          dsaCode: u?.dsaCode || "",
        };
      }
    }

    if (!appData) {
      return NextResponse.json(
        { error: "Application not found. Please check Application ID or Mobile number." },
        { status: 404 }
      );
    }

    // Strip sensitive raw document base64 data for public status lookup
    const { documents, ...publicData } = appData;

    const documentStatuses = {
      panDocUploaded: !!documents?.panDoc,
      aadhaarDocUploaded: !!(documents?.aadhaarDoc || documents?.aadhaarFrontDoc),
      gstDocUploaded: !!documents?.gstDoc,
    };

    return NextResponse.json({
      success: true,
      application: {
        applicationId: publicData.applicationId,
        status: publicData.status || publicData.dsaStatus || "under_review",
        fullName: publicData.fullName || publicData.contactPersonName || "",
        partnerType: publicData.partnerType || "Individual",
        firmType: publicData.firmType || "",
        dsaCode: publicData.dsaCode || "",
        submittedAt: publicData.submittedAt?.toDate
          ? publicData.submittedAt.toDate().toISOString()
          : publicData.submittedAt,
        updatedAt: publicData.updatedAt?.toDate
          ? publicData.updatedAt.toDate().toISOString()
          : publicData.updatedAt,
        queries: publicData.queries || [],
        timeline: publicData.timeline || [],
        documentStatuses,
      },
    });
  } catch (error: any) {
    console.error("Status Tracker Error:", error);
    return NextResponse.json({ error: "Failed to fetch application status." }, { status: 500 });
  }
}
