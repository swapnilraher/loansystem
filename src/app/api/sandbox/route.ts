import { NextResponse } from 'next/server';

const SANDBOX_KEY = "key_live_903e7a0839e5458993990c401da8be3c";
const SANDBOX_SECRET = "secret_live_8015a745cf4a433387ff54040e7453bd";

async function getAccessToken() {
  const res = await fetch("https://api.sandbox.co.in/authenticate", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": SANDBOX_KEY,
      "x-api-secret": SANDBOX_SECRET
    },
    body: JSON.stringify({ apiKey: SANDBOX_KEY })
  });
  const data = await res.json();
  return data?.access_token || data?.data?.access_token || null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const token = await getAccessToken();

    if (!token) return NextResponse.json({ error: "Failed to get access token" }, { status: 500 });

    let url = "";
    let options: RequestInit = {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": token,
        "content-type": "application/json",
        "x-api-key": SANDBOX_KEY,
        "x-api-version": "2.0"
      }
    };

    if (action === 'send-aadhaar-otp') {
      url = "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp";
      options.body = JSON.stringify({
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        "aadhaar_number": payload.aadhaar_number,
        "consent": "y",
        "reason": "For KYC"
      });
    } 
    else if (action === 'verify-aadhaar-otp') {
      url = "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp/verify";
      options.body = JSON.stringify({
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        "reference_id": String(payload.reference_id),
        "otp": String(payload.otp)
      });
    }
    else if (action === 'verify-pan') {
      url = "https://api.sandbox.co.in/kyc/pan/verify";
      options.body = JSON.stringify({
        "@entity": "in.co.sandbox.kyc.pan_verification.request",
        "pan": payload.pan_number,
        "name_as_per_pan": payload.name_as_per_pan,
        "date_of_birth": payload.date_of_birth,
        "consent": "y",
        "reason": "For KYC"
      });
    }
    else if (action === 'verify-bank') {
      url = `https://api.sandbox.co.in/bank/${payload.ifsc}/accounts/${payload.account_number}/verify`;
      options.method = "GET";
      delete options.body;
    }
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`Sandbox API Response for action ${action}:`, JSON.stringify(data));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sandbox API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
