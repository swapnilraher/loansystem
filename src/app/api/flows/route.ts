import { NextResponse } from 'next/server';

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo";
const PROJECT_ID = "dsa-loan";

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// GET /api/flows - list all flows
export async function GET() {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/waFlows?key=${FIREBASE_API_KEY}`);
    const data = await res.json();
    if (!res.ok || !data.documents) {
      return NextResponse.json({ flows: [] });
    }
    const flows = data.documents.map((doc: any) => ({
      id: doc.name.split('/').pop(),
      name: doc.fields?.name?.stringValue || '',
      category: doc.fields?.category?.stringValue || '',
      steps: JSON.parse(doc.fields?.steps?.stringValue || '[]'),
      enabled: doc.fields?.enabled?.booleanValue ?? true,
      createdAt: doc.fields?.createdAt?.timestampValue || '',
    }));
    return NextResponse.json({ flows });
  } catch (err: any) {
    return NextResponse.json({ flows: [], error: err.message }, { status: 500 });
  }
}

// POST /api/flows - create a new flow
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, steps, enabled = true } = body;
    const docId = `${category.replace(/\s+/g, '_')}_${Date.now()}`;
    const url = `${FIRESTORE_BASE}/waFlows/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          name: { stringValue: name },
          category: { stringValue: category },
          steps: { stringValue: JSON.stringify(steps) },
          enabled: { booleanValue: enabled },
          createdAt: { timestampValue: new Date().toISOString() },
        }
      })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || 'Failed to create flow');
    return NextResponse.json({ success: true, id: docId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/flows?id=xxx - delete a flow
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const url = `${FIRESTORE_BASE}/waFlows/${id}?key=${FIREBASE_API_KEY}`;
    await fetch(url, { method: 'DELETE' });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH /api/flows?id=xxx - toggle enabled or update
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const body = await request.json();
    const url = `${FIRESTORE_BASE}/waFlows/${id}?key=${FIREBASE_API_KEY}`;
    const fields: Record<string, any> = {};
    if (body.enabled !== undefined) fields.enabled = { booleanValue: body.enabled };
    if (body.steps !== undefined) fields.steps = { stringValue: JSON.stringify(body.steps) };
    if (body.name !== undefined) fields.name = { stringValue: body.name };
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
