import { NextResponse } from 'next/server';

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo";
const PROJECT_ID = "dsa-loan";

export async function GET() {
  return NextResponse.json({ status: 'API is working (REST Mode)' });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Map form fields to Firestore REST format
    const leadData = {
      fields: {
        name: { stringValue: data.fullName || data.name || 'N/A' },
        phone: { stringValue: data.mobileNumber || data.phone || 'N/A' },
        email: { stringValue: data.email || 'N/A' },
        type: { stringValue: data.type || (data.source?.includes('Home') ? 'Home Loan' : 'Personal Loan') },
        amount: { stringValue: data.loanAmount || data.amount || '0' },
        city: { stringValue: data.city || 'N/A' },
        employmentType: { stringValue: data.employmentType || 'N/A' },
        monthlyIncome: { stringValue: data.monthlyIncome || 'N/A' },
        status: { stringValue: data.status || 'New Lead' },
        source: { stringValue: data.source || 'Website Landing' },
        category: { stringValue: data.category || 'Landing' },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };

    // Use standard fetch to Firestore REST API (Firewall-safe)
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?key=${FIREBASE_API_KEY}`;
    
    const response = await fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Firestore REST API Error');
    }

    return NextResponse.json({ 
      success: true, 
      id: result.name.split('/').pop() 
    }, { status: 201 });

  } catch (error: any) {
    console.error('REST API ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
