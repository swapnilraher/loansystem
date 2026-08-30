import { NextResponse } from 'next/server';

async function getAccessToken() {
  try {
    const rawKey = process.env.SANDBOX_KEY || process.env.API_Keysandbox || "key_live_903e7a0839e5458993990c401da8be3c";
    const rawSecret = process.env.SANDBOX_SECRET || process.env.API_Secretsandbox || process.env.API_secret || "secret_live_8015a745cf4a433387ff54040e7453bd";

    const key = String(rawKey).trim().replace(/^["']|["']$/g, '');
    const secret = String(rawSecret).trim().replace(/^["']|["']$/g, '');

    const res = await fetch("https://api.sandbox.co.in/authenticate", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": key,
        "x-api-secret": secret,
        "x-api-version": "1.0.0"
      },
      body: JSON.stringify({ apiKey: key }),
      cache: 'no-store'
    });

    const data = await res.json().catch(() => ({}));
    const token = data?.access_token || data?.data?.access_token || data?.token || null;

    if (!token) {
      const errMsg = data?.message || data?.error || data?.reason || `HTTP ${res.status} Authentication Failed`;
      console.error("Sandbox Auth Failed. Key Prefix:", key.slice(0, 10), "Status:", res.status, "Details:", data);
      return {
        token: null,
        key,
        secret,
        error: `Sandbox Auth Failed (${res.status}): ${typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg}`
      };
    }

    return { token, error: null, key, secret };
  } catch (err: any) {
    console.error("Sandbox authentication token fetch exception:", err);
    return { token: null, key: "", secret: "", error: err?.message || "Network exception during Sandbox authentication." };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    if (!action || !payload) {
      return NextResponse.json({ error: "Action and payload are required." }, { status: 400 });
    }

    const auth = await getAccessToken();
    if (!auth.token) {
      return NextResponse.json({
        error: auth.error || "Failed to authenticate with Sandbox API service.",
        code: 401
      }, { status: 401 });
    }

    const token = auth.token;
    const activeKey = auth.key;

    let url = "";
    let options: RequestInit = {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": token,
        "content-type": "application/json",
        "x-api-key": activeKey,
        "x-api-version": "2.0"
      }
    };

    if (action === 'send-aadhaar-otp') {
      const cleanAadhaar = String(payload.aadhaar_number || "").replace(/\D/g, "");
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return NextResponse.json({ error: "Invalid 12-digit Aadhaar number format." }, { status: 400 });
      }
      url = "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp";
      options.body = JSON.stringify({
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        "aadhaar_number": cleanAadhaar,
        "consent": "y",
        "reason": "For KYC"
      });
    } 
    else if (action === 'verify-aadhaar-otp') {
      if (!payload.reference_id || !payload.otp) {
        return NextResponse.json({ error: "Reference ID and OTP are required." }, { status: 400 });
      }
      url = "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp/verify";
      options.body = JSON.stringify({
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        "reference_id": String(payload.reference_id).trim(),
        "otp": String(payload.otp).trim()
      });
    }
    else if (action === 'verify-pan') {
      const cleanPan = String(payload.pan_number || "").trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        return NextResponse.json({ error: "Invalid 10-character PAN number format." }, { status: 400 });
      }
      url = "https://api.sandbox.co.in/kyc/pan/verify";
      options.body = JSON.stringify({
        "@entity": "in.co.sandbox.kyc.pan_verification.request",
        "pan": cleanPan,
        "name_as_per_pan": payload.name_as_per_pan,
        "date_of_birth": payload.date_of_birth,
        "consent": "y",
        "reason": "For KYC"
      });
    }
    else if (action === 'verify-bank') {
      const cleanIfsc = String(payload.ifsc || "").trim().toUpperCase();
      const cleanAcct = String(payload.account_number || "").trim().replace(/\D/g, "");

      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        return NextResponse.json({ error: "Invalid 11-character IFSC code format." }, { status: 400 });
      }
      if (!cleanAcct || cleanAcct.length < 9) {
        return NextResponse.json({ error: "Invalid bank account number format." }, { status: 400 });
      }

      url = `https://api.sandbox.co.in/bank/${encodeURIComponent(cleanIfsc)}/accounts/${encodeURIComponent(cleanAcct)}/verify`;
      options.method = "GET";
      options.headers = {
        "accept": "application/json",
        "authorization": token,
        "x-api-key": activeKey,
        "x-api-version": "1.0.0"
      };
      delete options.body;
    }
    else if (action === 'initiate-digilocker') {
      if (!payload.redirect_url) {
        return NextResponse.json({ error: "Redirect URL is required for DigiLocker initiation." }, { status: 400 });
      }
      url = "https://api.sandbox.co.in/kyc/digilocker/sessions/init";
      options.headers = {
        "accept": "application/json",
        "authorization": token,
        "content-type": "application/json",
        "x-api-key": activeKey,
        "x-api-version": "1.0.0"
      };
      options.body = JSON.stringify({
        "@entity": "in.co.sandbox.kyc.digilocker.session.request",
        "flow": payload.flow || "signin",
        "redirect_url": payload.redirect_url,
        "doc_types": payload.doc_types || ["aadhaar", "pan"],
        "options": {
          "verification_method": ["aadhaar", "pan", "mobile"],
          "pinless": true,
          "usernameless": true,
          ...(payload.mobileNumber ? { "verified_mobile": String(payload.mobileNumber).replace(/\D/g, "").slice(-10) } : {})
        }
      });
    }
    else if (action === 'get-digilocker-documents') {
      const cleanSessionId = encodeURIComponent(String(payload.session_id || "").trim());
      if (!cleanSessionId) {
        return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
      }
      url = `https://api.sandbox.co.in/kyc/digilocker/sessions/${cleanSessionId}/documents`;
      options.method = "GET";
      options.headers = {
        "accept": "application/json",
        "authorization": token,
        "x-api-key": activeKey,
        "x-api-version": "1.0.0"
      };
      delete options.body;
    }
    else if (action === 'get-digilocker-eaadhaar') {
      const cleanSessionId = encodeURIComponent(String(payload.session_id || "").trim());
      if (!cleanSessionId) {
        return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
      }
      url = `https://api.sandbox.co.in/kyc/digilocker/sessions/${cleanSessionId}/eaadhaar`;
      options.method = "GET";
      options.headers = {
        "accept": "application/json",
        "authorization": token,
        "x-api-key": activeKey,
        "x-api-version": "1.0.0"
      };
      delete options.body;
    }
    else if (action === 'get-digilocker-pan') {
      const cleanSessionId = encodeURIComponent(String(payload.session_id || "").trim());
      if (!cleanSessionId) {
        return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
      }
      url = `https://api.sandbox.co.in/kyc/digilocker/sessions/${cleanSessionId}/pan`;
      options.method = "GET";
      options.headers = {
        "accept": "application/json",
        "authorization": token,
        "x-api-key": activeKey,
        "x-api-version": "1.0.0"
      };
      delete options.body;
    }
    else if (action === 'get-digilocker-status') {
      const cleanSessionId = encodeURIComponent(String(payload.session_id || "").trim());
      if (!cleanSessionId) {
        return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
      }
      url = `https://api.sandbox.co.in/kyc/digilocker/sessions/${cleanSessionId}/status`;
      options.method = "GET";
      options.headers = {
        "accept": "application/json",
        "authorization": token,
        "x-api-key": activeKey,
        "x-api-version": "1.0.0"
      };
      delete options.body;
    }
    else {
      return NextResponse.json({ error: "Invalid or unsupported action." }, { status: 400 });
    }

    const response = await fetch(url, options);
    const data = await response.json();

    // Log status & action safely without exposing PII in server logs
    console.log(`Sandbox API [action: ${action}] -> Response Code: ${data.code || response.status}`);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Sandbox API Gateway Error:", error?.message || error);
    return NextResponse.json({ error: "Internal Server Error during Sandbox API request." }, { status: 500 });
  }
}
