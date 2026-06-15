import { NextResponse } from 'next/server';

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo";
const PROJECT_ID = "dsa-loan";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "swapnil942040020202";

interface FlowQuestion {
  field: string;
  type: string;
  options?: string[];
  question: Record<string, string>;
}

// ─── Loan categories and their flows in English, Hindi, and Marathi ───────────────
const LOAN_FLOWS: Record<string, FlowQuestion[]> = {
  "Home Loan": [
    {
      field: "loanAmount",
      type: "number",
      question: {
        en: "What loan amount are you looking for? (e.g. 50 lakhs)",
        hi: "आप कितना लोन चाहते हैं? (जैसे: 50 लाख)",
        mr: "तुम्हाला किती लोन हवे आहे? (उदा. ५० लाख)"
      }
    },
    {
      field: "city",
      type: "text",
      question: {
        en: "Which city is the property located in?",
        hi: "संपत्ति (Property) किस शहर में स्थित है?",
        mr: "मालमत्ता (Property) कोणत्या शहरात आहे?"
      }
    },
    {
      field: "employmentType",
      type: "dropdown",
      options: ["Salaried", "Self Employed"],
      question: {
        en: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed",
        hi: "क्या आप वेतनभोगी (Salaried) हैं या स्व-व्यवसायी (Self Employed)?\n1️⃣ वेतनभोगी (Salaried)\n2️⃣ स्व-व्यवसायी (Self Employed)",
        mr: "तुम्ही पगारदार (Salaried) आहात की स्वयंरोजगार (Self Employed)?\n1️⃣ पगारदार (Salaried)\n2️⃣ स्वयंरोजगार (Self Employed)"
      }
    },
    {
      field: "monthlyIncome",
      type: "number",
      question: {
        en: "What is your monthly income? (in ₹)",
        hi: "आपकी मासिक आय (Monthly Income) कितनी है? (₹ में)",
        mr: "तुमचे मासिक उत्पन्न किती आहे? (₹ मध्ये)"
      }
    }
  ],
  "Personal Loan": [
    {
      field: "monthlyIncome",
      type: "number",
      question: {
        en: "What is your monthly income? (in ₹)",
        hi: "आपकी मासिक आय (Monthly Income) कितनी है? (₹ में)",
        mr: "तुमचे मासिक उत्पन्न किती आहे? (₹ मध्ये)"
      }
    },
    {
      field: "employmentType",
      type: "dropdown",
      options: ["Salaried", "Self Employed"],
      question: {
        en: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed",
        hi: "क्या आप वेतनभोगी (Salaried) हैं या स्व-व्यवसायी (Self Employed)?\n1️⃣ वेतनभोगी (Salaried)\n2️⃣ स्व-व्यवसायी (Self Employed)",
        mr: "तुम्ही पगारदार (Salaried) आहात की स्वयंरोजगार (Self Employed)?\n1️⃣ पगारदार (Salaried)\n2️⃣ स्वयंरोजगार (Self Employed)"
      }
    },
    {
      field: "city",
      type: "text",
      question: {
        en: "Which city do you live in?",
        hi: "आप किस शहर में रहते हैं?",
        mr: "तुम्ही कोणत्या शहरात राहता?"
      }
    }
  ],
  "Business Loan": [
    {
      field: "businessName",
      type: "text",
      question: {
        en: "What is your business name?",
        hi: "आपके व्यवसाय/कंपनी का नाम क्या है?",
        mr: "तुमच्या व्यवसायाचे/कंपनीचे नाव काय आहे?"
      }
    },
    {
      field: "businessVintage",
      type: "text",
      question: {
        en: "How long has your business been running? (e.g. 3 years)",
        hi: "आपका व्यवसाय कितने समय से चल रहा है? (जैसे: 3 वर्ष)",
        mr: "तुमचा व्यवसाय किती वर्षांपासून चालू आहे? (उदा. ३ वर्षे)"
      }
    },
    {
      field: "annualTurnover",
      type: "number",
      question: {
        en: "What is your annual turnover? (in ₹)",
        hi: "आपका वार्षिक टर्नओवर (Annual Turnover) कितना है? (₹ में)",
        mr: "तुमचा वार्षिक टर्नओवर (Annual Turnover) किती आहे? (₹ मध्ये)"
      }
    },
    {
      field: "loanAmount",
      type: "number",
      question: {
        en: "How much loan amount do you require? (in ₹)",
        hi: "आपको कितने लोन की आवश्यकता है? (₹ में)",
        mr: "तुम्हाला किती लोन हवे आहे? (₹ मध्ये)"
      }
    }
  ],
  "Loan Against Property": [
    {
      field: "propertyValue",
      type: "number",
      question: {
        en: "What is the approximate value of your property? (in ₹)",
        hi: "आपकी संपत्ति का अनुमानित मूल्य क्या है? (₹ में)",
        mr: "तुमच्या मालमत्तेचे अंदाजे मूल्य किती आहे? (₹ मध्ये)"
      }
    },
    {
      field: "city",
      type: "text",
      question: {
        en: "Which city is the property located in?",
        hi: "संपत्ति (Property) किस शहर में स्थित है?",
        mr: "मालमत्ता (Property) कोणत्या शहरात आहे?"
      }
    },
    {
      field: "loanAmount",
      type: "number",
      question: {
        en: "How much loan amount do you require? (in ₹)",
        hi: "आपको कितने लोन की आवश्यकता है? (₹ में)",
        mr: "तुम्हाला किती लोन हवे आहे? (₹ मध्ये)"
      }
    },
    {
      field: "employmentType",
      type: "dropdown",
      options: ["Salaried", "Self Employed"],
      question: {
        en: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed",
        hi: "क्या आप वेतनभोगी (Salaried) हैं या स्व-व्यवसायी (Self Employed)?\n1️⃣ वेतनभोगी (Salaried)\n2️⃣ स्व-व्यवसायी (Self Employed)",
        mr: "तुम्ही पगारदार (Salaried) आहात की स्वयंरोजगार (Self Employed)?\n1️⃣ पगारदार (Salaried)\n2️⃣ स्वयंरोजगार (Self Employed)"
      }
    }
  ],
  "Credit Card": [
    {
      field: "monthlyIncome",
      type: "number",
      question: {
        en: "What is your monthly income? (in ₹)",
        hi: "आपकी मासिक आय (Monthly Income) कितनी है? (₹ में)",
        mr: "तुमचे मासिक उत्पन्न किती आहे? (₹ मध्ये)"
      }
    },
    {
      field: "employmentType",
      type: "dropdown",
      options: ["Salaried", "Self Employed"],
      question: {
        en: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed",
        hi: "क्या आप वेतनभोगी (Salaried) हैं या स्व-व्यवसायी (Self Employed)?\n1️⃣ वेतनभोगी (Salaried)\n2️⃣ स्व-व्यवसायी (Self Employed)",
        mr: "तुम्ही पगारदार (Salaried) आहात की स्वयंरोजगार (Self Employed)?\n1️⃣ पगारदार (Salaried)\n2️⃣ स्वयंरोजगार (Self Employed)"
      }
    },
    {
      field: "city",
      type: "text",
      question: {
        en: "Which city do you live in?",
        hi: "आप किस शहर में रहते हैं?",
        mr: "तुम्ही कोणत्या शहरात राहता?"
      }
    }
  ],
  "Insurance": [
    {
      field: "insuranceType",
      type: "dropdown",
      options: ["Life Insurance", "Health Insurance", "Vehicle Insurance"],
      question: {
        en: "What type of insurance are you looking for?\n1️⃣ Life Insurance\n2️⃣ Health Insurance\n3️⃣ Vehicle Insurance",
        hi: "आप किस प्रकार का बीमा (Insurance) चाहते हैं?\n1️⃣ जीवन बीमा (Life Insurance)\n2️⃣ स्वास्थ्य बीमा (Health Insurance)\n3️⃣ वाहन बीमा (Vehicle Insurance)",
        mr: "तुम्हाला कोणत्या प्रकारचा विमा (Insurance) हवा आहे?\n1️⃣ जीवन विमा (Life Insurance)\n2️⃣ आरोग्य विमा (Health Insurance)\n3️⃣ वाहन विमा (Vehicle Insurance)"
      }
    },
    {
      field: "age",
      type: "number",
      question: {
        en: "What is your age?",
        hi: "आपकी उम्र (Age) क्या है?",
        mr: "तुमचे वय (Age) किती आहे?"
      }
    },
    {
      field: "city",
      type: "text",
      question: {
        en: "Which city do you live in?",
        hi: "आप किस शहर में रहते हैं?",
        mr: "तुम्ही कोणत्या शहरात राहता?"
      }
    }
  ]
};

const LOAN_CATEGORIES = Object.keys(LOAN_FLOWS);

const LOCALIZED_CATEGORIES: Record<string, string[]> = {
  en: ["Home Loan", "Personal Loan", "Business Loan", "Loan Against Property", "Credit Card", "Insurance"],
  hi: ["होम लोन", "पर्सनल लोन", "बिजनेस लोन", "प्रॉपर्टी पर लोन", "क्रेडिट कार्ड", "बीमा"],
  mr: ["होम लोन", "पर्सनल लोन", "बिझनेस लोन", "प्रॉपर्टीवर लोन", "क्रेडिट कार्ड", "विमा"]
};

// ─── Localized Messages ──────────────────────────────────────────────────────
const MSG_ASK_NAME: Record<string, string> = {
  en: "Thank you! First, may I know your *full name*? 😊",
  hi: "धन्यवाद! सबसे पहले, क्या मैं आपका *पूरा नाम* जान सकता हूँ? 😊",
  mr: "धन्यवाद! सर्वात आधी, मला तुमचे *पूर्ण नाव* समजेल का? 😊"
};

const MSG_CAT_PROMPT: Record<string, string> = {
  en: "Nice to meet you, *{name}*! 🎉\n\nPlease select the loan product you're interested in:\n\n{menu}\n\n_Reply with the number (e.g. *1* for Home Loan)_",
  hi: "आपसे मिलकर अच्छा लगा, *{name}*! 🎉\n\nकृपया उस लोन प्रोडक्ट का चयन करें जिसमें आपकी रुचि है:\n\n{menu}\n\n_नंबर के साथ उत्तर दें (जैसे: होम लोन के लिए *1*)__",
  mr: "तुम्हाला भेटून आनंद झाला, *{name}*! 🎉\n\nकृपया तुम्हाला हव्या असलेल्या लोन प्रोडक्टची निवड करा:\n\n{menu}\n\n_नंबर लिहून उत्तर द्या (उदा. होम लोनसाठी *1*)_"
};

const MSG_CAT_INTRO: Record<string, string> = {
  en: "Great choice! You selected *{category}* 🎯\n\nLet me quickly collect some details to find the best offer for you.",
  hi: "बेहतरीन विकल्प! आपने *{category}* चुना है 🎯\n\nआइए आपके लिए सबसे अच्छा ऑफर ढूंढने के लिए कुछ विवरण एकत्र करें।",
  mr: "उत्तम पर्याय! तुम्ही *{category}* निवडले आहे 🎯\n\nतुमच्यासाठी सर्वोत्तम ऑफर शोधण्यासाठी काही माहिती गोळा करूया."
};

const MSG_INVALID_WARN: Record<string, string> = {
  en: "❗ Please reply with a valid option number.",
  hi: "❗ कृपया एक मान्य विकल्प नंबर के साथ उत्तर दें।",
  mr: "❗ कृपया एक वैध पर्याय नंबर लिहून उत्तर द्या."
};

const MSG_ERROR_WARN: Record<string, string> = {
  en: "Something went wrong. Please reply *Hi* to start again.",
  hi: "कुछ गलत हो गया। कृपया फिर से शुरू करने के लिए *Hi* भेजें।",
  mr: "काहीतरी त्रुटी आली. कृपया पुन्हा सुरू करण्यासाठी *Hi* पाठवा."
};

const MSG_THANK_YOU: Record<string, string> = {
  en: "✅ *Thank you, {name}!*\n\nWe've received all your details for *{category}*. 📋\n\nOur loan expert will contact you within *15 minutes* with the best options tailored just for you! 🚀\n\n_TechStar Money Solutions_\n📞 *7020646007*",
  hi: "✅ *धन्यवाद, {name}!*\n\nहमें *{category}* के लिए आपके सभी विवरण प्राप्त हो गए हैं। 📋\n\nहमारे लोन एक्सपर्ट अगले *15 मिनट* में आपसे संपर्क करेंगे! 🚀\n\n_TechStar Money Solutions_\n📞 *7020646007*",
  mr: "✅ *धन्यवाद, {name}!*\n\nआम्हाला *{category}* साठी तुमची सर्व माहिती मिळाली आहे. 📋\n\nआमचे लोन एक्सपर्ट पुढील *१५ मिनिटांत* तुमच्याशी संपर्क साधतील! 🚀\n\n_TechStar Money Solutions_\n📞 *७०२०६४६००७*"
};

const LANGUAGES: Record<string, string> = {
  "1": "en",
  "2": "hi",
  "3": "mr"
};

const LANG_NAMES: Record<string, string> = {
  "en": "English",
  "hi": "Hindi",
  "mr": "Marathi"
};

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
    language: doc.fields.language?.stringValue || "en",
  };
}

async function saveSession(phone: string, data: { step: number; category: string; name: string; responses: Record<string, string>; language: string }) {
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
        language: { stringValue: data.language || "en" },
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

    // ── No session: greet and ask language ──
    if (!session) {
      await sendWA(from,
        `👋 *Welcome to TechStar Money Solutions!*\n\nPlease select your preferred language:\n\n1️⃣ English\n2️⃣ हिंदी (Hindi)\n3️⃣ मराठी (Marathi)\n\n_Reply with the number (e.g. *1* for English)_`
      );
      await saveSession(from, { step: 1, category: '', name: '', responses: {}, language: 'en' });
      return NextResponse.json({ ok: true });
    }

    // ── Step 1: Wait for language selection ──
    if (session.step === 1) {
      const langKey = text;
      if (langKey !== '1' && langKey !== '2' && langKey !== '3') {
        await sendWA(from,
          `❗ Please reply with 1, 2, or 3 to select your language.\n\n1️⃣ English\n2️⃣ हिंदी (Hindi)\n3️⃣ मराठी (Marathi)`
        );
        return NextResponse.json({ ok: true });
      }
      const selectedLang = LANGUAGES[langKey];
      const askNameText = MSG_ASK_NAME[selectedLang];
      await sendWA(from, askNameText);
      await saveSession(from, { ...session, step: 2, language: selectedLang });
      return NextResponse.json({ ok: true });
    }

    const lang = session.language || 'en';

    // ── Step 2: Got name → show loan category menu ──
    if (session.step === 2) {
      const name = text;
      const categoriesList = LOCALIZED_CATEGORIES[lang];
      const menu = categoriesList.map((c, i) => `${i + 1}️⃣ *${c}*`).join('\n');
      
      const promptText = MSG_CAT_PROMPT[lang].replace('{name}', name).replace('{menu}', menu);
      await sendWA(from, promptText);
      await saveSession(from, { ...session, step: 3, name });
      return NextResponse.json({ ok: true });
    }

    // ── Step 3: Got category number ──
    if (session.step === 3) {
      const num = parseInt(text) - 1;
      if (isNaN(num) || num < 0 || num >= LOAN_CATEGORIES.length) {
        await sendWA(from, MSG_INVALID_WARN[lang]);
        return NextResponse.json({ ok: true });
      }
      const category = LOAN_CATEGORIES[num]; // English name like "Home Loan"
      const categoryLocalized = LOCALIZED_CATEGORIES[lang][num];
      
      const introText = MSG_CAT_INTRO[lang].replace('{category}', categoryLocalized);
      const firstQ = LOAN_FLOWS[category][0];
      const questionText = firstQ.question[lang];
      
      await sendWA(from, `${introText}\n\n*Q1:* ${questionText}`);
      await saveSession(from, { ...session, step: 4, category });
      return NextResponse.json({ ok: true });
    }

    // ── Step 4+: Flow questions ──
    if (session.step >= 4) {
      const flow = LOAN_FLOWS[session.category];
      if (!flow) {
        await sendWA(from, MSG_ERROR_WARN[lang]);
        await deleteSession(from);
        return NextResponse.json({ ok: true });
      }

      const questionIndex = session.step - 4;
      const currentQ = flow[questionIndex];

      if (!currentQ) {
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
        const questionText = nextQ.question[lang];
        await sendWA(from, `*Q${nextIndex + 1}:* ${questionText}`);
        await saveSession(from, { ...session, step: session.step + 1, responses: updatedResponses });
      } else {
        // All questions answered → save lead and thank user
        const categoryLocalized = LOCALIZED_CATEGORIES[lang][LOAN_CATEGORIES.indexOf(session.category)];
        await saveLead({
          name: session.name,
          phone: from,
          type: session.category,
          category: session.category,
          language: LANG_NAMES[lang] || "English",
          ...updatedResponses,
        });

        const thankYouText = MSG_THANK_YOU[lang]
          .replace('{name}', session.name)
          .replace('{category}', categoryLocalized);
          
        await sendWA(from, thankYouText);
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
