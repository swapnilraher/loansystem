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

    if (!docSnap.exists) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const data = docSnap.data();

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
