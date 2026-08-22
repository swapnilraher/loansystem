import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ifsc = searchParams.get("code")?.trim().toUpperCase();

    if (!ifsc || ifsc.length !== 11) {
      return NextResponse.json({ error: "Please enter a valid 11-character IFSC code." }, { status: 400 });
    }

    // Call Razorpay IFSC API
    const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);

    if (!response.ok) {
      return NextResponse.json({
        valid: false,
        error: "Invalid IFSC code. Bank details not found."
      }, { status: 404 });
    }

    const data = await response.json();

    return NextResponse.json({
      valid: true,
      ifsc: data.IFSC || ifsc,
      bank: data.BANK || "",
      branch: data.BRANCH || "",
      city: data.CITY || "",
      state: data.STATE || "",
      address: data.ADDRESS || "",
      micr: data.MICR || "",
      bankCode: data.BANKCODE || ""
    });
  } catch (error: any) {
    console.error("IFSC API Error:", error);
    return NextResponse.json({ error: "Failed to fetch bank details from Razorpay IFSC API." }, { status: 500 });
  }
}
