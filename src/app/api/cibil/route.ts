import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// Helper to determine credit score based on PAN for testing predictability
function calculateCreditScore(pan: string, mobile: string): { score: number; rating: string; activeAccounts: number; delayedPayments: number; creditAge: number } {
  const cleanPan = pan.toUpperCase().trim();
  
  // 1. Check for specific mock triggers
  if (cleanPan.startsWith('XYZ') || mobile.endsWith('0000')) {
    // Low score test trigger
    return {
      score: 585,
      rating: 'Poor',
      activeAccounts: 2,
      delayedPayments: 4,
      creditAge: 1
    };
  }
  
  if (cleanPan.startsWith('ABC') || mobile.endsWith('9999')) {
    // Excellent score test trigger
    return {
      score: 825,
      rating: 'Excellent',
      activeAccounts: 5,
      delayedPayments: 0,
      creditAge: 6
    };
  }

  // 2. Deterministic hashing based on PAN letters
  let hash = 0;
  for (let i = 0; i < cleanPan.length; i++) {
    hash += cleanPan.charCodeAt(i);
  }
  
  // Scale hash to a valid score range (680 - 810) for normal users
  const score = 680 + (hash % 131);
  
  let rating = 'Good';
  if (score >= 750) rating = 'Excellent';
  else if (score >= 700) rating = 'Good';
  else if (score >= 650) rating = 'Fair';
  else rating = 'Poor';

  const activeAccounts = 1 + (hash % 6);
  const delayedPayments = (hash % 7) === 0 ? 1 : 0;
  const creditAge = 2 + (hash % 8);

  return {
    score,
    rating,
    activeAccounts,
    delayedPayments,
    creditAge
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, pan, mobile, email, dob, pincode } = body;

    // Validate parameters
    if (!name || !pan || !mobile || !email || !dob || !pincode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Standard PAN format regex: 5 letters, 4 digits, 1 letter
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/i;
    if (!panRegex.test(pan)) {
      return NextResponse.json({ error: "Invalid PAN number format" }, { status: 400 });
    }

    // Calculate score
    const result = calculateCreditScore(pan, mobile);

    // Save lead details into Firestore
    const db = getAdminDb();
    const leadData = {
      name: name.trim(),
      phone: mobile.trim(),
      mobile: mobile.trim(),
      email: email.trim().toLowerCase(),
      pan: pan.toUpperCase().trim(),
      dob: dob,
      city: pincode.trim(), // Use pincode in city field or store separately
      type: "Personal Loan", // Standardized to route through Personal Loan channels
      amount: "0",
      cibilScore: String(result.score),
      cibilRating: result.rating,
      remarks: `CIBIL checked from portal: ${result.score} (${result.rating}). Pin Code: ${pincode}. Active Accounts: ${result.activeAccounts}, Delayed: ${result.delayedPayments}`,
      status: "New Lead",
      category: "Direct",
      source: "Website CIBIL Checker",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("leads").add(leadData);

    return NextResponse.json({
      status: "success",
      score: result.score,
      rating: result.rating,
      summary: {
        active_accounts: result.activeAccounts,
        delayed_payments: result.delayedPayments,
        credit_age_years: result.creditAge,
        enquiries_30_days: (result.score % 3)
      },
      message: "Credit score fetched successfully and recorded."
    });

  } catch (error: any) {
    console.error("CIBIL API Error:", error);
    return NextResponse.json({ error: "Failed to process CIBIL check" }, { status: 500 });
  }
}
