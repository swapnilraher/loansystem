import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { mobileNumber, redirectUrl } = await request.json();

    if (!mobileNumber) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    const host = request.headers.get("host") || "partner.techstarsolution.in";
    const protocol = host.includes("localhost") ? "http" : "https";
    const finalRedirectUrl = redirectUrl || `${protocol}://${host}/onboarding`;

    // Call Sandbox API route internally or via fetch
    const baseUrl = `${protocol}://${host}`;
    const sandboxRes = await fetch(`${baseUrl}/api/sandbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "initiate-digilocker",
        payload: {
          flow: "signin",
          redirect_url: finalRedirectUrl,
          doc_types: ["aadhaar", "pan"],
          mobileNumber: mobileNumber.replace(/\D/g, "").slice(-10)
        }
      })
    });

    const data = await sandboxRes.json();

    if (!sandboxRes.ok || data.code !== 200 || !data.data?.authorization_url) {
      console.error("DigiLocker Initiate Error:", data);
      return NextResponse.json({
        error: data.message || data.error || "Failed to initialize DigiLocker session."
      }, { status: data.code || 500 });
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      sessionId: data.data.session_id,
      transactionId: data.transaction_id
    });
  } catch (error: any) {
    console.error("DigiLocker Initiate Main Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
