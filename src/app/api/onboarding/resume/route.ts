import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobileNumber = searchParams.get("mobile")?.trim();

    if (!mobileNumber) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const docSnap = await db.collection("partner_applications").doc(mobileNumber).get();
    const userSnap = await db.collection("users").doc(mobileNumber).get();

    const data = docSnap.exists ? docSnap.data() : {};
    const userData = userSnap.exists ? userSnap.data() : {};

    const status = userData?.dsaStatus || userData?.status || data?.status || "draft";
    if (status === "Active" || status === "approved") {
      return NextResponse.json({
        exists: true,
        alreadyApproved: true,
        dsaCode: userData?.dsaCode || data?.dsaCode || "",
        error: "Your DSA Partner Application has already been approved! Please log in to your Partner Portal.",
      }, { status: 400 });
    }

    return NextResponse.json({
      exists: true,
      data: {
        ...data,
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data?.createdAt,
        updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
      }
    });
  } catch (error: any) {
    console.error("Resume Application Error:", error);
    return NextResponse.json({ error: "Failed to fetch saved application." }, { status: 500 });
  }
}
