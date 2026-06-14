import { NextResponse } from 'next/server';

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo";
const PROJECT_ID = "dsa-loan";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "swapnil942040020202";

// ─── Loan categories and their flows ──────────────────────────────────────────
const LOAN_FLOWS: Record<string, { question: string; field: string; type: string; options?: string[] }[]> = {
  "Home Loan": [
    { question: "What loan amount are you looking for? (e.g. 50 lakhs)", field: "loanAmount", type: "number" },
    { question: "Which city is the property located in?", field: "city", type: "text" },
    { question: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed", field: "employmentType", type: "dropdown", options: ["Salaried", "Self Employed"] },
    { question: "What is your monthly income? (in ₹)", field: "monthlyIncome", type: "number" },
  ],
  "Personal Loan": [
    { question: "What is your monthly income? (in ₹)", field: "monthlyIncome", type: "number" },
    { question: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed", field: "employmentType", type: "dropdown", options: ["Salaried", "Self Employed"] },
    { question: "Which city do you live in?", field: "city", type: "text" },
  ],
  "Business Loan": [
    { question: "What is your business name?", field: "businessName", type: "text" },
    { question: "How long has your business been running? (e.g. 3 years)", field: "businessVintage", type: "text" },
    { question: "What is your annual turnover? (in ₹)", field: "annualTurnover", type: "number" },
    { question: "How much loan amount do you require? (in ₹)", field: "loanAmount", type: "number" },
  ],
  "Loan Against Property": [
    { question: "What is the approximate value of your property? (in ₹)", field: "propertyValue", type: "number" },
    { question: "Which city is the property located in?", field: "city", type: "text" },
    { question: "How much loan amount do you require? (in ₹)", field: "loanAmount", type: "number" },
    { question: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed", field: "employmentType", type: "dropdown", options: ["Salaried", "Self Employed"] },
  ],
  "Credit Card": [
    { question: "What is your monthly income? (in ₹)", field: "monthlyIncome", type: "number" },
    { question: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed", field: "employmentType", type: "dropdown", options: ["Salaried", "Self Employed"] },
    { question: "Which city do you live in?", field: "city", type: "text" },
  ],
  "Insurance": [
    { question: "What type of insurance are you looking for?\n1️⃣ Life Insurance\n2️⃣ Health Insurance\n3️⃣ Vehicle Insurance", field: "insuranceType", type: "dropdown", options: ["Life Insurance", "Health Insurance", "Vehicle Insurance"] },
    { question: "What is your age?", field: "age", type: "number" },
    { question: "Which city do you live in?", field: "city", type: "text" },
  ],
};

const LOAN_CATEGORIES = Object.keys(LOAN_FLOWS);

// ─── Firestore helpers ─────────────────────────────────────────────────────────
async function getSession(phone: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/waSession/${phone}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;
  return {
    step: parseInt(doc.fields.step?.integerValue || "0"),
    category: doc.fields.category?.stringValue || "",
    name: doc.fields.name?.stringValue || "",
    responses: JSON.parse(doc.fields.responses?.stringValue || "{}"),
  };
}

async function saveSession(phone: string, data: { step: number; category: string; name: string; responses: Record<string, string> }) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/waSession/${phone}?key=${FIREBASE_API_KEY}`;
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        step: { integerValue: data.step.toString() },
        category: { stringValue: data.category },
        name: { stringValue: data.name },
        responses: { stringValue: JSON.stringify(data.responses) },
        updatedAt: { timestampValue: new Date().toISOString() },
      }
    })
  });
}

async function deleteSession(phone: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/waSession/${phone}?key=${FIREBASE_API_KEY}`;
  await fetch(url, { method: 'DELETE' });
}

async function saveLead(data: Record<string, string>) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?key=${FIREBASE_API_KEY}`;
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = { stringValue: String(v) };
  }
  fields.createdAt = { timestampValue: new Date().toISOString() };
  fields.source = { stringValue: 'WhatsApp Automation' };
  fields.status = { stringValue: 'New Lead' };
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

async function sendWA(to: string, text: string) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
}

// ─── GET: Facebook webhook verification ───────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp Webhook Verified');
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ─── POST: Incoming message handler ───────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Extract message from Facebook webhook payload
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ ok: true }); // not a message event
    }

    const msg = messages[0];
    const from: string = msg.from; // sender's phone number (with country code)
    const text: string = (msg.text?.body || '').trim();

    if (!from || !text) return NextResponse.json({ ok: true });

    // Load existing session for this user
    let session = await getSession(from);

    // ── No session: greet and ask name ──
    if (!session) {
      await sendWA(from,
        `👋 *Welcome to TechStar Money Solutions!*\n\nI'm your personal loan assistant. I'll help you find the best loan offers in just a few simple steps.\n\nFirst, may I know your *full name*? 😊`
      );
      await saveSession(from, { step: 1, category: '', name: '', responses: {} });
      return NextResponse.json({ ok: true });
    }

    // ── Step 1: Got name → show loan category menu ──
    if (session.step === 1) {
      const name = text;
      const menu = LOAN_CATEGORIES.map((c, i) => `${i + 1}️⃣ *${c}*`).join('\n');
      await sendWA(from,
        `Nice to meet you, *${name}*! 🎉\n\nPlease select the loan product you're interested in:\n\n${menu}\n\n_Reply with the number (e.g. *1* for Home Loan)_`
      );
      await saveSession(from, { ...session, step: 2, name });
      return NextResponse.json({ ok: true });
    }

    // ── Step 2: Got category number ──
    if (session.step === 2) {
      const num = parseInt(text) - 1;
      if (isNaN(num) || num < 0 || num >= LOAN_CATEGORIES.length) {
        await sendWA(from, `❗ Please reply with a number between *1* and *${LOAN_CATEGORIES.length}*.`);
        return NextResponse.json({ ok: true });
      }
      const category = LOAN_CATEGORIES[num];
      const firstQ = LOAN_FLOWS[category][0];
      await sendWA(from,
        `Great choice! You selected *${category}* 🎯\n\nLet me quickly collect some details to find the best offer for you.\n\n*Q1:* ${firstQ.question}`
      );
      await saveSession(from, { ...session, step: 3, category });
      return NextResponse.json({ ok: true });
    }

    // ── Step 3+: Flow questions ──
    if (session.step >= 3) {
      const flow = LOAN_FLOWS[session.category];
      if (!flow) {
        await sendWA(from, `Something went wrong. Please send *Hi* to start again.`);
        await deleteSession(from);
        return NextResponse.json({ ok: true });
      }

      const questionIndex = session.step - 3;
      const currentQ = flow[questionIndex];

      if (!currentQ) {
        // Should not happen, but guard
        await deleteSession(from);
        return NextResponse.json({ ok: true });
      }

      // Normalize dropdown answer (accept number or text)
      let answer = text;
      if (currentQ.type === 'dropdown' && currentQ.options) {
        const num = parseInt(text) - 1;
        if (!isNaN(num) && num >= 0 && num < currentQ.options.length) {
          answer = currentQ.options[num];
        }
      }

      const updatedResponses = { ...session.responses, [currentQ.field]: answer };
      const nextIndex = questionIndex + 1;
      const nextQ = flow[nextIndex];

      if (nextQ) {
        // Send next question
        await sendWA(from, `*Q${nextIndex + 1}:* ${nextQ.question}`);
        await saveSession(from, { ...session, step: session.step + 1, responses: updatedResponses });
      } else {
        // All questions answered → save lead and thank user
        await saveLead({
          name: session.name,
          phone: from,
          type: session.category,
          category: session.category,
          ...updatedResponses,
        });
        await sendWA(from,
          `✅ *Thank you, ${session.name}!*\n\nWe've received all your details for *${session.category}*. 📋\n\nOur loan expert will contact you within *15 minutes* with the best options tailored just for you! 🚀\n\n_TechStar Money Solutions_\n📞 *7020646007*`
        );
        await deleteSession(from);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Facebook
  }
}
