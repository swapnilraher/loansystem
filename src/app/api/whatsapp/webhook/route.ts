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
        en: "Are you Salaried or Self Employed?",
        hi: "क्या आप वेतनभोगी (Salaried) हैं या स्व-व्यवसायी (Self Employed)?",
        mr: "तुम्ही पगारदार (Salaried) आहात की स्वयंरोजगार (Self Employed)?"
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
        en: "Are you Salaried or Self Employed?",
        hi: "क्या आप वेतनभोगी (Salaried) हैं या स्व-व्यवसायी (Self Employed)?",
        mr: "तुम्ही पगारदार (Salaried) आहात की स्वयंरोजगार (Self Employed)?"
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
        en: "Are you Salaried or Self Employed?",
        hi: "क्या आप वेतनभोगी (Salaried) हैं या स्व-व्यवसायी (Self Employed)?",
        mr: "तुम्ही पगारदार (Salaried) आहात की स्वयंरोजगार (Self Employed)?"
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
        en: "Are you Salaried or Self Employed?",
        hi: "क्या आप वेतनभोगी (Salaried) हैं या स्व-व्यवसायी (Self Employed)?",
        mr: "तुम्ही पगारदार (Salaried) आहात की स्वयंरोजगार (Self Employed)?"
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
        en: "What type of insurance are you looking for?",
        hi: "आप किस प्रकार का बीमा (Insurance) चाहते हैं?",
        mr: "तुम्हाला कोणत्या प्रकारचा विमा (Insurance) हवा आहे?"
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
  hi: "आपसे मिलकर अच्छा लगा, *{name}*! 🎉\n\nकृपया उस लोन -उत्पाद (Product) का चयन करें जिसमें आपकी रुचि है:\n\n{menu}\n\n_नंबर के साथ उत्तर दें (जैसे: होम लोन के लिए *1*)_",
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

// ─── WhatsApp Interactive Message Layouts ───────────────────────────────────────
const langInteractive = {
  type: "button",
  body: {
    text: "👋 *Welcome to TechStar Money Solutions!*\n\nPlease select your preferred language below:\n\nकृपया अपनी पसंदीदा भाषा चुनें:\n\nकृपया तुमची आवडती भाषा निवडा:"
  },
  action: {
    buttons: [
      { type: "reply", reply: { id: "1", title: "English" } },
      { type: "reply", reply: { id: "2", title: "हिंदी (Hindi)" } },
      { type: "reply", reply: { id: "3", title: "मराठी (Marathi)" } }
    ]
  }
};

function getCategoryListPayload(lang: string, name: string) {
  const categoriesList = LOCALIZED_CATEGORIES[lang];
  const listTitle = {
    en: "Select Loan Type",
    hi: "लोन प्रकार चुनें",
    mr: "लोनचा प्रकार निवडा"
  }[lang] || "Select Loan Type";

  const bodyText = {
    en: `Nice to meet you, *${name}*! 🎉\n\nPlease select the loan product you are interested in:`,
    hi: `आपसे मिलकर अच्छा लगा, *${name}*! 🎉\n\nकृपया उस लोन प्रकार को चुनें जिसमें आपकी रुचि है:`,
    mr: `तुम्हाला भेटून आनंद झाला, *${name}*! 🎉\n\nकृपया तुम्हाला हव्या असलेल्या लोन प्रकारची निवड करा:`
  }[lang] || `Nice to meet you, *${name}*!`;

  return {
    type: "list",
    body: { text: bodyText },
    action: {
      button: listTitle.length > 20 ? listTitle.substring(0, 20) : listTitle,
      sections: [
        {
          title: listTitle,
          rows: categoriesList.map((cat, i) => ({
            id: String(i + 1),
            title: cat.length > 24 ? cat.substring(0, 24) : cat
          }))
        }
      ]
    }
  };
}

function getDropdownQuestionPayload(lang: string, question: FlowQuestion) {
  const questionText = question.question[lang];
  const rawOptions = question.options || [];
  
  const localizedOptionsMap: Record<string, Record<string, string>> = {
    "Salaried": { en: "Salaried", hi: "वेतनभोगी (Salaried)", mr: "पगारदार (Salaried)" },
    "Self Employed": { en: "Self Employed", hi: "स्व-व्यवसायी", mr: "स्वयंरोजगार" },
    "Life Insurance": { en: "Life Insurance", hi: "जीवन बीमा", mr: "जीवन विमा" },
    "Health Insurance": { en: "Health Insurance", hi: "स्वास्थ्य बीमा", mr: "आरोग्य विमा" },
    "Vehicle Insurance": { en: "Vehicle Insurance", hi: "वाहन बीमा", mr: "वाहन विमा" }
  };

  const buttons = rawOptions.slice(0, 3).map((opt, i) => {
    const title = (localizedOptionsMap[opt] && localizedOptionsMap[opt][lang]) || opt;
    return {
      type: "reply",
      reply: {
        id: String(i + 1),
        title: title.length > 20 ? title.substring(0, 20) : title
      }
    };
  });

  return {
    type: "button",
    body: { text: questionText },
    action: { buttons }
  };
}

function getQuestionPayload(lang: string, currentQ: FlowQuestion) {
  if (currentQ.type === 'dropdown' && currentQ.options) {
    return getDropdownQuestionPayload(lang, currentQ);
  }
  return `*Q:* ${currentQ.question[lang]}`;
}

// Helper to compile details into a structured chat summary
function generateDetailsText(session: { name: string; category: string; language: string; responses: Record<string, string> }): string {
  let text = `WhatsApp Chat Summary:\n`;
  text += `----------------------\n`;
  if (session.language) {
    text += `Preferred Language: ${LANG_NAMES[session.language] || session.language}\n`;
  }
  if (session.name) {
    text += `Name: ${session.name}\n`;
  }
  if (session.category) {
    text += `Loan Category: ${session.category}\n`;
  }
  
  if (session.responses && Object.keys(session.responses).length > 0) {
    text += `\nCollected Answers:\n`;
    for (const [key, value] of Object.entries(session.responses)) {
      if (key === 'adId' || key === 'adHeadline' || key === 'adBody') continue;
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      text += `- ${formattedKey.toUpperCase()}: ${value}\n`;
    }
  }
  
  if (session.responses?.adHeadline) {
    text += `\nReferral Ad: ${session.responses.adHeadline}\n`;
  }
  return text;
}

// ─── Gemini AI Helpers ──────────────────────────────────────────────────────────
async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "";
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 150 }
      })
    });
    if (!res.ok) {
      console.error("Gemini API Error:", await res.text());
      return "";
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text.trim();
  } catch (err) {
    console.error("Failed to call Gemini:", err);
    return "";
  }
}

async function classifyDropdownWithAI(userText: string, question: FlowQuestion): Promise<string> {
  const options = question.options || [];
  if (options.length === 0) return "Unknown";
  
  const prompt = `Classify the user's chat message into one of these exact options: ${JSON.stringify(options)}.
User message: "${userText}"
Return only one of the options from the list if it matches the meaning, otherwise return "Unknown".
Do not include any explanation or extra text in your response.`;

  const result = await callGeminiAPI(prompt);
  if (options.includes(result)) {
    return result;
  }
  return "Unknown";
}

function fallbackAIResponder(userText: string, lang: string): string {
  const lower = userText.toLowerCase();
  
  if (lang === 'mr') {
    if (lower.includes("व्याज") || lower.includes("दर") || lower.includes("interest") || lower.includes("rate")) {
      return "आमचा वैयक्तिक कर्ज (Personal Loan) व्याजदर १०.४९% पासून आणि गृह कर्ज (Home Loan) ८.५०% पासून सुरू होतो. व्याजदर तुमच्या क्रेडिट स्कोरवर अवलंबून असेल.";
    }
    if (lower.includes("कागद") || lower.includes("document")) {
      return "कर्जासाठी लागणारी मुख्य कागदपत्रे: पॅन कार्ड, आधार कार्ड, शेवटच्या ३ महिन्यांची सॅलरी स्लिप आणि ६ महिन्यांचे बँक स्टेटमेंट.";
    }
    if (lower.includes("पात्रता") || lower.includes("eligibility")) {
      return "पात्रतेसाठी तुमचे वय २१ ते ६० वर्षे असावे आणि मासिक पगार किमान ₹१५,००० असावा. चांगला क्रेडिट स्कोर असल्यास मंजुरी लवकर मिळते.";
    }
    if (lower.includes("वेळ") || lower.includes("time") || lower.includes("किती दिवस")) {
      return "कागदपत्रे योग्य असल्यास, २४ ते ४८ तासात कर्ज मंजूर केले जाते.";
    }
    return "तुमच्या प्रश्नाचे उत्तर मिळवण्यासाठी कृपया खालील पर्यायांमधून तुमचे लोन प्रॉडक्ट निवडा, आमचे अधिकारी तुम्हाला फोन करून अधिक माहिती देतील.";
  }
  
  if (lang === 'hi') {
    if (lower.includes("ब्याज") || lower.includes("दर") || lower.includes("interest") || lower.includes("rate")) {
      return "हमारा पर्सनल लोन ब्याज दर 10.49% और होम लोन 8.50% प्रति वर्ष से शुरू होता है। यह आपके सिबिल स्कोर पर निर्भर करता है।";
    }
    if (lower.includes("कागजात") || lower.includes("document")) {
      return "लोन के लिए आवश्यक दस्तावेज: पैन कार्ड, आधार कार्ड, पिछले 3 महीने की सैलरी स्लिप और 6 महीने का बैंक स्टेटमेंट।";
    }
    if (lower.includes("पात्रता") || lower.includes("eligibility")) {
      return "पात्रता के लिए आपकी आयु 21 से 60 वर्ष और न्यूनतम वेतन ₹15,000 होना चाहिए।";
    }
    if (lower.includes("समय") || lower.includes("time") || lower.includes("कितने दिन")) {
      return "सभी दस्तावेज सही होने पर 24 से 48 घंटों में लोन मंजूर हो जाता है।";
    }
    return "आपके प्रश्न का उत्तर जानने के लिए कृपया नीचे दिए गए विकल्पों में से अपना लोन प्रकार चुनें, हमारे अधिकारी आपसे संपर्क करेंगे।";
  }

  if (lower.includes("interest") || lower.includes("rate")) {
    return "Our Personal Loan rates start at 10.49% p.a. and Home Loan rates start at 8.50% p.a. Final rates depend on your credit score.";
  }
  if (lower.includes("document") || lower.includes("paper")) {
    return "Documents required: PAN Card, Aadhaar Card, last 3 months salary slips, and 6 months bank statements.";
  }
  if (lower.includes("eligibility") || lower.includes("criteria")) {
    return "Eligibility: Age 21-60, minimum salary of ₹15,000, and a good CIBIL score (700+ is preferred).";
  }
  if (lower.includes("time") || lower.includes("days") || lower.includes("how long")) {
    return "Once all documents are submitted, loan processing and approval takes 24 to 48 hours.";
  }
  return "To get detailed information, please select your loan product from the menu below, and our executive will contact you shortly.";
}

async function handleAIQuery(userText: string, lang: string): Promise<string> {
  const prompt = `You are a helpful customer support AI for "TechStar Money Solutions", a premium loan marketplace in India.
The customer's preferred language is ${LANG_NAMES[lang]}.
Answer their query in a polite, helpful, and concise manner (maximum 2-3 sentences).
If they ask about interest rates, mention that Home Loan starts at 8.5% p.a. and Personal Loan starts at 10.49% p.a.
If they ask for contact info, mention the phone number 7020646007.
User Query: "${userText}"
Response:`;

  const aiRes = await callGeminiAPI(prompt);
  if (aiRes) {
    return aiRes;
  }
  return fallbackAIResponder(userText, lang);
}

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
    leadId: doc.fields.leadId?.stringValue || "",
  };
}

async function saveSession(phone: string, data: { step: number; category: string; name: string; responses: Record<string, string>; language: string; leadId: string }) {
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
        leadId: { stringValue: data.leadId || "" },
        updatedAt: { timestampValue: new Date().toISOString() },
      }
    })
  });
}

async function deleteSession(phone: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/waSession/${phone}?key=${FIREBASE_API_KEY}`;
  await fetch(url, { method: 'DELETE' });
}

async function createLead(data: Record<string, string>): Promise<string> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?key=${FIREBASE_API_KEY}`;
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = { stringValue: String(v) };
  }
  fields.createdAt = { timestampValue: new Date().toISOString() };
  fields.source = { stringValue: data.source || 'WhatsApp Automation' };
  fields.status = { stringValue: 'New Lead' };
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  
  if (!res.ok) {
    console.error("Failed to create lead:", await res.text());
    return "";
  }
  const result = await res.json();
  const name = result.name;
  return name.split("/").pop() || "";
}

async function updateLead(leadId: string, data: Record<string, string>) {
  if (!leadId) return;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads/${leadId}?key=${FIREBASE_API_KEY}`;
  
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = { stringValue: String(v) };
  }
  
  const queryParams = Object.keys(fields)
    .map(key => `updateMask.fieldPaths=${key}`)
    .join('&');
    
  const patchUrl = `${url}&${queryParams}`;
  
  const res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    console.error("Failed to update lead:", await res.text());
  }
}

async function sendWA(to: string, message: string | any) {
  const finalTo = to.length === 10 ? `91${to}` : to;
  const url = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
  let body: any;
  if (typeof message === 'string') {
    body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: finalTo,
      type: 'text',
      text: { body: message },
    };
  } else {
    body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: finalTo,
      type: 'interactive',
      interactive: message,
    };
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("Failed to send WA message:", await res.text());
  }
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
    const rawFrom: string = msg.from; // sender's phone number
    
    // Sanitize number: strip leading 91 (for 10-digit Indian numbers)
    let cleanPhone = rawFrom.replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.substring(2);
    }
    const from = cleanPhone;

    let text: string = (msg.text?.body || '').trim();

    // Map WhatsApp Cloud API interactive select buttons & lists back to plain text selections
    if (msg.type === 'interactive') {
      const interactive = msg.interactive;
      if (interactive.type === 'button_reply') {
        text = interactive.button_reply?.id || '';
      } else if (interactive.type === 'list_reply') {
        text = interactive.list_reply?.id || '';
      }
    }

    if (!from || !text) return NextResponse.json({ ok: true });

    // Load existing session for this user
    let session = await getSession(from);

    // ── No session: greet, create lead instantly, and ask language ──
    if (!session) {
      const referral = msg.referral;
      const initialResponses: Record<string, string> = {};
      if (referral) {
        initialResponses.adId = referral.source_id || "";
        initialResponses.adHeadline = referral.headline || "";
        initialResponses.adBody = referral.body || "";
      }

      // Generate early details summary
      const initialDetails = generateDetailsText({
        name: "",
        category: "",
        language: "en",
        responses: initialResponses
      });

      // Create initial lead record immediately
      const leadId = await createLead({
        phone: from,
        source: referral ? `Meta Ads - ${referral.headline}` : 'WhatsApp Automation',
        details: initialDetails,
        ...initialResponses
      });

      await sendWA(from, langInteractive);
      await saveSession(from, { step: 1, category: '', name: '', responses: initialResponses, language: 'en', leadId });
      return NextResponse.json({ ok: true });
    }

    // ── Step 1: Wait for language selection ──
    if (session.step === 1) {
      const langKey = text;
      if (langKey !== '1' && langKey !== '2' && langKey !== '3') {
        // Run general AI query handler as fallback, then repeat language choice
        const aiReply = await handleAIQuery(text, 'en');
        await sendWA(from, `${aiReply}\n\n*Please select your language:*`);
        await sendWA(from, langInteractive);
        return NextResponse.json({ ok: true });
      }
      const selectedLang = LANGUAGES[langKey];
      const askNameText = MSG_ASK_NAME[selectedLang];

      const detailsText = generateDetailsText({
        name: "",
        category: "",
        language: selectedLang,
        responses: session.responses
      });

      // Update lead
      await updateLead(session.leadId, {
        language: LANG_NAMES[selectedLang] || "English",
        details: detailsText
      });

      await sendWA(from, askNameText);
      await saveSession(from, { ...session, step: 2, language: selectedLang });
      return NextResponse.json({ ok: true });
    }

    const lang = session.language || 'en';

    // ── Step 2: Got name → show loan category menu ──
    if (session.step === 2) {
      const name = text;
      
      const detailsText = generateDetailsText({
        name: name,
        category: "",
        language: lang,
        responses: session.responses
      });

      // Update lead with name and updated summary
      await updateLead(session.leadId, { name, details: detailsText });

      const catPayload = getCategoryListPayload(lang, name);
      await sendWA(from, catPayload);
      await saveSession(from, { ...session, step: 3, name });
      return NextResponse.json({ ok: true });
    }

    // ── Step 3: Got category number ──
    if (session.step === 3) {
      const num = parseInt(text) - 1;
      if (isNaN(num) || num < 0 || num >= LOAN_CATEGORIES.length) {
        // Run AI query fallback and re-show categories list
        const aiReply = await handleAIQuery(text, lang);
        await sendWA(from, aiReply);
        await sendWA(from, getCategoryListPayload(lang, session.name));
        return NextResponse.json({ ok: true });
      }
      const category = LOAN_CATEGORIES[num];
      const categoryLocalized = LOCALIZED_CATEGORIES[lang][num];
      
      const detailsText = generateDetailsText({
        name: session.name,
        category: category,
        language: lang,
        responses: session.responses
      });

      // Update lead with category choice
      await updateLead(session.leadId, {
        category: category,
        type: category,
        details: detailsText
      });

      const introText = MSG_CAT_INTRO[lang].replace('{category}', categoryLocalized);
      const firstQ = LOAN_FLOWS[category][0];
      const questionPayload = getQuestionPayload(lang, firstQ);
      
      if (typeof questionPayload === 'string') {
        await sendWA(from, `${introText}\n\n${questionPayload}`);
      } else {
        await sendWA(from, introText);
        await sendWA(from, questionPayload);
      }

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

      // Check option index or use AI classification to normalize dropdown responses
      let answer = text;
      let isClassified = false;
      if (currentQ.type === 'dropdown' && currentQ.options) {
        const num = parseInt(text) - 1;
        if (!isNaN(num) && num >= 0 && num < currentQ.options.length) {
          answer = currentQ.options[num];
          isClassified = true;
        } else {
          const aiClassified = await classifyDropdownWithAI(text, currentQ);
          if (aiClassified !== "Unknown") {
            answer = aiClassified;
            isClassified = true;
          }
        }
      } else {
        isClassified = true; // Natural text/number questions always accept responses
      }

      // If cannot be classified or mapped, answer user query and repeat question
      if (!isClassified) {
        const aiReply = await handleAIQuery(text, lang);
        await sendWA(from, aiReply);
        await sendWA(from, getQuestionPayload(lang, currentQ));
        return NextResponse.json({ ok: true });
      }

      const updatedResponses = { ...session.responses, [currentQ.field]: answer };
      
      const detailsText = generateDetailsText({
        name: session.name,
        category: session.category,
        language: lang,
        responses: updatedResponses
      });

      // Update lead in real-time
      await updateLead(session.leadId, {
        [currentQ.field]: answer,
        details: detailsText
      });

      const nextIndex = questionIndex + 1;
      const nextQ = flow[nextIndex];

      if (nextQ) {
        // Send next question
        const questionPayload = getQuestionPayload(lang, nextQ);
        const questionIndexText = {
          en: `Q${nextIndex + 1}: `,
          hi: `Q${nextIndex + 1}: `,
          mr: `Q${nextIndex + 1}: `
        }[lang] || `Q${nextIndex + 1}: `;
        
        if (typeof questionPayload === 'string') {
          await sendWA(from, `${questionIndexText}${questionPayload}`);
        } else {
          await sendWA(from, questionPayload);
        }
        await saveSession(from, { ...session, step: session.step + 1, responses: updatedResponses });
      } else {
        // All questions completed
        const categoryLocalized = LOCALIZED_CATEGORIES[lang][LOAN_CATEGORIES.indexOf(session.category)];

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
