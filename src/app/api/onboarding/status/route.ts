import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("id")?.trim();
    const mobileNumber = searchParams.get("mobile")?.trim();

    if (!applicationId && !mobileNumber) {
      return NextResponse.json({ error: "Application ID or registered mobile number is required" }, { status: 400 });
    }

    const db = getAdminDb();
    let querySnap;

    if (applicationId) {
      querySnap = await db.collection("partner_applications")
        .where("applicationId", "==", applicationId)
        .get();
    } else {
      querySnap = await db.collection("partner_applications")
        .where("mobileNumber", "==", mobileNumber)
        .get();
    }

    if (querySnap.empty) {
      return NextResponse.json({ error: "Application not found. Please check Application ID or Mobile number." }, { status: 404 });
    }

    const appData = querySnap.docs[0].data();

    // Strip sensitive raw document base64 data for public status lookup
    const { documents, ...publicData } = appData;

    const documentStatuses = {
      panDocUploaded: !!documents?.panDoc,
      aadhaarDocUploaded: !!documents?.aadhaarDoc,
      gstDocUploaded: !!documents?.gstDoc,
    };

    return NextResponse.json({
      success: true,
      application: {
        applicationId: publicData.applicationId,
        status: publicData.status || "under_review",
        fullName: publicData.fullName || publicData.contactPersonName || "",
        partnerType: publicData.partnerType || "Individual",
        firmType: publicData.firmType || "",
        submittedAt: publicData.submittedAt?.toDate ? publicData.submittedAt.toDate().toISOString() : publicData.submittedAt,
        updatedAt: publicData.updatedAt?.toDate ? publicData.updatedAt.toDate().toISOString() : publicData.updatedAt,
        queries: publicData.queries || [],
        timeline: publicData.timeline || [],
        documentStatuses
      }
    });
  } catch (error: any) {
    console.error("Status Tracker Error:", error);
    return NextResponse.json({ error: "Failed to fetch application status." }, { status: 500 });
  }
}
