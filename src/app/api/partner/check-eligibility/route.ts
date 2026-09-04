import { NextResponse } from "next/server";
import { checkPartnerEligibility } from "@/lib/partnerEligibility";

export type { PartnerEligibilityResult } from "@/lib/partnerEligibility";

async function respond(mobile: string, mode: "login" | "onboarding") {
  const cleanPhone = String(mobile).replace(/\D/g, "").slice(-10);

  if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    return NextResponse.json(
      { eligible: false, error: "Valid 10-digit Indian mobile number is required" },
      { status: 400 }
    );
  }

  const result = await checkPartnerEligibility(cleanPhone, mode);
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get("mobile") || searchParams.get("phoneNumber") || "";
    const mode = (searchParams.get("mode") || "onboarding") as "login" | "onboarding";
    return await respond(mobile, mode);
  } catch (error: any) {
    console.error("Partner eligibility check error:", error);
    return NextResponse.json({ eligible: false, error: "Failed to check partner eligibility" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mobile = body.phoneNumber || body.mobile || "";
    const mode = (body.mode || (body.isLogin ? "login" : "onboarding")) as "login" | "onboarding";
    return await respond(mobile, mode);
  } catch (error: any) {
    console.error("Partner eligibility check error:", error);
    return NextResponse.json({ eligible: false, error: "Failed to check partner eligibility" }, { status: 500 });
  }
}
