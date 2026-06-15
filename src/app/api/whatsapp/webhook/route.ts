import { NextResponse } from 'next/server';
import { getAdminStorage } from "@/lib/firebase-admin";

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
      if (key === 'adId' || key === 'adHeadline' || key === 'adBody' || key === 'leadId') continue;
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      text += `- ${formattedKey.toUpperCase()}: ${value}\n`;
    }
  }
  
  if (session.responses?.adHeadline) {
    text += `\nReferral Ad: ${session.responses.adHeadline}\n`;
  }
  return text;
}

// ─── Local translations for internally stored Category and Status values ─────────
function getLocalizedCategory(category: string, lang: string): string {
  const c = (category || "").toLowerCase().trim();
  const maps: Record<string, Record<string, string>> = {
    "home loan": { en: "Home Loan", hi: "होम लोन", mr: "होम लोन" },
    "personal loan": { en: "Personal Loan", hi: "पर्सनल लोन", mr: "पर्सनल लोन" },
    "business loan": { en: "Business Loan", hi: "बिजनेस लोन", mr: "बिझनेस लोन" },
    "loan against property": { en: "Loan Against Property", hi: "प्रॉपर्टी पर लोन", mr: "प्रॉपर्टीवर लोन" },
    "credit card": { en: "Credit Card", hi: "क्रेडिट कार्ड", mr: "क्रेडिट कार्ड" },
    "insurance": { en: "Insurance", hi: "बीमा", mr: "विमा" },
    "landing": { en: "Loan Application", hi: "लोन आवेदन", mr: "कर्ज अर्ज" }
  };
  
  for (const [key, map] of Object.entries(maps)) {
    if (c === key || c.includes(key)) {
      return map[lang] || map['en'];
    }
  }
  return { en: "Loan Application", hi: "लोन आवेदन", mr: "कर्ज अर्ज" }[lang] || "Loan Application";
}

function getLocalizedStatus(status: string, lang: string): string {
  const s = (status || "").toLowerCase().trim();
  const maps: Record<string, Record<string, string>> = {
    "new lead": { en: "Under Review", hi: "समीक्षा के अधीन", mr: "तपासणी सुरू आहे" },
    "new": { en: "Under Review", hi: "समीक्षा के अधीन", mr: "तपासणी सुरू आहे" },
    "landing": { en: "Under Review", hi: "समीक्षा के अधीन", mr: "तपासणी सुरू आहे" },
    "contacted": { en: "Under Process", hi: "प्रक्रिया में", mr: "प्रक्रिया सुरू आहे" },
    "interested": { en: "Under Process", hi: "प्रक्रिया में", mr: "प्रक्रिया सुरू आहे" },
    "processed": { en: "Under Process", hi: "प्रक्रिया में", mr: "प्रक्रिया सुरू आहे" },
    "in progress": { en: "Under Process", hi: "प्रक्रिया में", mr: "प्रक्रिया सुरू आहे" },
    "under process": { en: "Under Process", hi: "प्रक्रिया में", mr: "प्रक्रिया सुरू आहे" },
    "approved": { en: "Approved", hi: "स्वीकृत (Approved)", mr: "मंजूर (Approved)" },
    "sanctioned": { en: "Approved", hi: "स्वीकृत (Approved)", mr: "मंजूर (Approved)" },
    "disbursed": { en: "Disbursed", hi: "वितरित (Disbursed)", mr: "वितरित (Disbursed)" },
    "rejected": { en: "Closed", hi: "बंद/अस्वीकृत", mr: "बंद/अमंजूर" },
    "not interested": { en: "Closed", hi: "बंद/अस्वीकृत", mr: "बंद/अमंजूर" }
  };

  for (const [key, map] of Object.entries(maps)) {
    if (s === key || s.includes(key)) {
      return map[lang] || map['en'];
    }
  }
  return { en: "Under Review", hi: "समीक्षा के अधीन", mr: "तपासणी सुरू आहे" }[lang] || "Under Review";
}

// ─── Custom Local AI Responder for Loan Info (Private, Fast, Rule-based NLP) ───
function localLoanAIResponder(userText: string, lang: string): string {
  const lower = userText.toLowerCase().trim();
  
  const mrResponses = {
    greeting: "नमस्कार! मी टेकस्टारचा एआय सहाय्यक आहे. मी तुम्हाला कर्जाविषयी माहिती देऊ शकतो. विचारण्यासाठी कीवर्ड वापरा जसे की: व्याजदर, कागदपत्रे, पात्रता, प्रोसेसिंग फी इ.",
    rate: "कर्जाचे व्याजदर खालीलप्रमाणे आहेत:\n- गृह कर्ज (Home Loan): ८.५०% पासून सुरू\n- वैयक्तिक कर्ज (Personal Loan): १०.४९% पासून सुरू\n- बिझनेस लोन (Business Loan): १२% पासून सुरू\n\nव्याजदर तुमच्या क्रेडिट स्कोर आणि मासिक उत्पन्नावर अवलंबून असेल.",
    docs: "कर्जासाठी आवश्यक कागदपत्रे:\n१. पॅन कार्ड आणि आधार कार्ड\n२. शेवटच्या ३ महिन्यांची सॅलरी स्लिप (नोकरी करत असल्यास)\n३. शेवटच्या ६ महिन्यांचे बँक स्टेटमेंट\n४. आयटीआर (व्यवसाय असल्यास)",
    eligibility: "कर्ज मिळवण्यासाठी पात्रता निकष:\n- तुमचे वय २१ ते ६० वर्षे असावे.\n- नोकरी करत असल्यास मासिक पगार किमान ₹१५,००० असावा.\n- तुमचा क्रेडिट/सिबिल (CIBIL) स्कोर ७००+ असावा.",
    time: "कागदपत्रे योग्य आणि पूर्ण असल्यास, वैयक्तिक कर्ज २४ ते ४८ तासात आणि गृह कर्ज ३ ते ७ दिवसांत मंजूर केले जाते.",
    fee: "लोन प्रोसेसिंग फी बँकेनुसार बदलते, साधारणपणे कर्जाच्या रक्कमेच्या १% ते २% पर्यंत असते.",
    lap: "प्रॉपर्टीवर कर्ज (Loan Against Property) चे व्याजदर ९% ते ११% पर्यंत असून ३० वर्षांपर्यंतची मुदत मिळू शकते. मालमत्तेचे मूल्यांकन आणि उत्पन्न पाहून कर्ज मंजूर केले जाते.",
    card: "आम्ही अग्रगण्य बँकांचे क्रेडिट कार्ड्स उपलब्ध करून देतो. तुमच्या पगार आणि क्रेडिट स्कोरनुसार कार्ड्स मिळतील. कोणतीही कागदपत्रे ऑनलाईन अपलोड करू शकता.",
    insurance: "आम्ही जीवन विमा (Life Insurance), आरोग्य विमा (Health Insurance) आणि वाहन विमा (Vehicle Insurance) प्रदान करतो. तुमचे वय आणि गरजेनुसार सर्वोत्तम पॉलिसी निवडली जाईल.",
    contact: "आमच्याशी थेट बोलण्यासाठी किंवा ऑफलाईन सल्ला घेण्यासाठी संपर्क क्रमांक: ७०२०६४६००७ किंवा ९५७९००५६४५ वर कॉल करा.",
    tenure: "कर्जाची मुदत (Tenure):\n- गृह कर्ज (Home Loan): ३० वर्षांपर्यंत\n- वैयक्तिक कर्ज (Personal Loan): १ ते ५ वर्षे\n- बिझनेस लोन (Business Loan): १ ते ५ वर्षे\n- प्रॉपर्टीवर कर्ज (LAP): १५ ते २० वर्षांपर्यंत",
    limit: "कमाल कर्जाची मर्यादा (Loan Limit):\n- वैयक्तिक/बिझनेस लोन: ₹५० लाखांपर्यंत (तुमच्या प्रोफाइलनुसार)\n- गृह कर्ज / प्रॉपर्टीवर कर्ज (LAP): मालमत्तेच्या बाजार मूल्याच्या ८०% पर्यंत",
    cibil: "सिबिल (CIBIL) स्कोर:\n- त्वरित कर्ज मंजुरी आणि कमी व्याजदरासाठी ७०० किंवा त्याहून अधिक क्रेडिट/सिबिल स्कोर असणे आवश्यक आहे.\n- ७०० पेक्षा कमी स्कोर असल्यास अतिरिक्त कागदपत्रांची पडताळणी होऊ शकते.",
    unknown: "मला तुमचे बोलणे पूर्णपणे समजले नाही. कृपया कर्जाचे व्याजदर, कागदपत्रे, पात्रता, संपर्क याविषयी विचारण्यासाठी योग्य शब्द वापरा."
  };

  const hiResponses = {
    greeting: "नमस्कार! मैं टेकस्टार का एआई सहायक हूँ। मैं आपको लोन के बारे में जानकारी दे सकता हूँ। जैसे: ब्याज दर, दस्तावेज, पात्रता, प्रोसेसिंग फीस आदि।",
    rate: "लोन की ब्याज दरें इस प्रकार हैं:\n- होम लोन (Home Loan): 8.50% से शुरू\n- पर्सनल लोन (Personal Loan): 10.49% से शुरू\n- बिजनेस लोन (Business Loan): 12% से शुरू\n\nअंतिम ब्याज दर आपके सिबिल स्कोर पर निर्भर करती है।",
    docs: "लोन के लिए आवश्यक दस्तावेज:\n1. पैन कार्ड और आधार कार्ड\n2. पिछले 3 महीने की सैलरी स्लिप (नौकरी पेशा के लिए)\n3. पिछले 6 महीने का bank statement\n4. आईटीआर (व्यवसाय के लिए)",
    eligibility: "लोन के लिए पात्रता मानदंड:\n- आपकी आयु 21 से 60 वर्ष होनी चाहिए।\n- न्यूनतम मासिक वेतन ₹15,000 होना चाहिए।\n- सिबिल (CIBIL) स्कोर 700+ होना चाहिए।",
    time: "दस्तावेज सही होने पर पर्सनल लोन 24 से 48 घंटे में और होम लोन 3 से 7 दिनों में मंजूर हो जाता है।",
    fee: "लोन प्रोसेसिंग फीस बैंक के अनुसार लोन राशि का 1% से 2% तक होती है।",
    lap: "प्रॉपर्टी पर लोन (Loan Against Property) की दरें 9% से शुरू होती हैं। संपत्ति का बाजार मूल्य और आपकी आय देखकर लोन दिया जाता है।",
    card: "हम विभिन्न अंकों के क्रेडिट कार्ड प्रदान करते हैं। आपके सैलरी और सिबिल स्कोर के अनुसार सर्वश्रेष्ठ कार्ड दिया जाएगा।",
    insurance: "हम जीवन बीमा (Life Insurance), स्वास्थ्य बीमा (Health Insurance) और वाहन बीमा (Vehicle Insurance) प्रदान करते हैं।",
    contact: "हमसे संपर्क करने के लिए कॉल करें: 7020646007 या 9579005645।",
    tenure: "लोन की अवधि (Tenure):\n- होम लोन (Home Loan): 30 वर्ष तक\n- पर्सनल लोन (Personal Loan): 1 से 5 वर्ष\n- बिजनेस लोन (Business Loan): 1 से 5 वर्ष\n- प्रॉपर्टी पर लोन (LAP): 15 से 20 वर्ष तक",
    limit: "अधिकतम लोन राशि (Loan Limit):\n- पर्सनल/बिजनेस लोन: ₹50 लाख तक (प्रोफाइल के अनुसार)\n- होम लोन / प्रॉपर्टी पर लोन: संपत्ति के ब्याज मूल्य का 80% तक",
    cibil: "सिबिल (CIBIL) स्कोर:\n- त्वरित लोन स्वीकृति और कम ब्याज दरों के लिए 700 या उससे अधिक का सिबिल स्कोर होना अच्छा माना जाता है।\n- 700 से कम स्कोर होने पर अतिरिक्त दस्तावेज सत्यापन की आवश्यकता हो सकती है।",
    unknown: "मुझे आपके द्वारा भेजा गया संदेश समझ नहीं आया। कृपया ब्याज दर, दस्तावेज, पात्रता, संपर्क जैसे कीवर्ड्स का उपयोग करें।"
  };

  const enResponses = {
    greeting: "Hello! I am the Techstar AI Assistant. I can help you with loan information. Ask me about: interest rates, documents, eligibility, processing fee, etc.",
    rate: "Our current interest rates are:\n- Home Loan: Starts at 8.50% p.a.\n- Personal Loan: Starts at 10.49% p.a.\n- Business Loan: Starts at 12.00% p.a.\n\nFinal rates depend on your credit history and profile.",
    docs: "Required documents:\n1. PAN Card and Aadhaar Card\n2. Last 3 months' salary slips (for Salaried)\n3. Last 6 months' bank statements\n4. ITR / Business proof (for Self-Employed)",
    eligibility: "Eligibility Criteria:\n- Age between 21 and 60 years.\n- Minimum monthly salary of ₹15,000.\n- CIBIL score of 700 or above.",
    time: "Approval turnaround time:\n- Personal Loan: 24 to 48 hours\n- Home Loan: 3 to 7 working days (subject to verification).",
    fee: "Processing fees range from 1% to 2% of the loan amount, varying by lender bank.",
    lap: "Loan Against Property interest rates start at 9.00% p.a. with flexible tenure up to 30 years.",
    card: "We facilitate credit card applications from leading banks. Eligible cards depend on your income and credit profile.",
    insurance: "We provide Life Insurance, Health Insurance, and Vehicle Insurance policies tailored to your needs.",
    contact: "For human assistance, call us at 7020646007 or 9579005645.",
    tenure: "Loan Tenure Options:\n- Home Loan: Up to 30 years\n- Personal Loan: 1 to 5 years (12 to 60 months)\n- Business Loan: 1 to 5 years\n- Loan Against Property (LAP): Up to 15-20 years",
    limit: "Maximum Loan Limits:\n- Personal/Business Loan: Up to ₹50 Lakhs (based on income and credit profile)\n- Home Loan / LAP: Up to 80% of property market value",
    cibil: "CIBIL / Credit Score:\n- A credit/CIBIL score of 700 or above is preferred for quick loan approvals at lower interest rates.\n- Scores below 700 may require extra document verification and might attract higher interest rates.",
    unknown: "I did not get your request. Please ask about interest rates, documents, eligibility, processing fee, or contact details."
  };

  const resp = lang === 'mr' ? mrResponses : (lang === 'hi' ? hiResponses : enResponses);

  if (lower.includes("hi") || lower.includes("hello") || lower.includes("नमस्कार") || lower.includes("namaskar")) {
    return resp.greeting;
  }
  if (lower.includes("व्याज") || lower.includes("दर") || lower.includes("interest") || lower.includes("rate") || lower.includes("vyaj") || lower.includes("percent")) {
    return resp.rate;
  }
  if (lower.includes("कागद") || lower.includes("document") || lower.includes("paper") || lower.includes("proof")) {
    return resp.docs;
  }
  if (lower.includes("पात्र") || lower.includes("eligibility") || lower.includes("criteria") || lower.includes("salary") || lower.includes("पगार")) {
    return resp.eligibility;
  }
  if (lower.includes("वेळ") || lower.includes("time") || lower.includes("दिवस") || lower.includes("hours") || lower.includes("approval")) {
    return resp.time;
  }
  if (lower.includes("शुल्क") || lower.includes("processing") || lower.includes("fee") || lower.includes("charges") || lower.includes("फी")) {
    return resp.fee;
  }
  if (lower.includes("प्रॉपर्टी") || lower.includes("property") || lower.includes("lap") || lower.includes("तारण")) {
    return resp.lap;
  }
  if (lower.includes("card") || lower.includes("कार्ड") || lower.includes("credit")) {
    return resp.card;
  }
  if (lower.includes("insurance") || lower.includes("विमा") || lower.includes("बीमा") || lower.includes("accident") || lower.includes("medical")) {
    return resp.insurance;
  }
  if (lower.includes("phone") || lower.includes("contact") || lower.includes("call") || lower.includes("संपर्क") || lower.includes("नंबर")) {
    return resp.contact;
  }
  if (lower.includes("tenure") || lower.includes("term") || lower.includes("duration") || lower.includes("varshe") || lower.includes("varsh") || lower.includes("kalavadhi") || lower.includes("मुदत") || lower.includes("वर्ष") || lower.includes("महिने") || lower.includes("कालावधी") || lower.includes("अवधि") || lower.includes("साल") || lower.includes("महीने")) {
    return resp.tenure;
  }
  if (lower.includes("limit") || lower.includes("amount") || lower.includes("max") || lower.includes("maximum") || lower.includes("paryant") || lower.includes("milnar") || lower.includes("रक्कम") || lower.includes("मर्यादा") || lower.includes("मिळणार") || lower.includes("कर्ज") || lower.includes("राशि") || lower.includes("सीमा")) {
    return resp.limit;
  }
  if (lower.includes("cibil") || lower.includes("score") || lower.includes("credit") || lower.includes("सिबिल") || lower.includes("स्कोर") || lower.includes("क्रेडिट")) {
    return resp.cibil;
  }

  return resp.unknown;
}

// Local natural language classifier for dropdown fields
function localClassifyDropdown(userText: string, question: FlowQuestion): string {
  const lower = userText.toLowerCase().trim();
  const options = question.options || [];
  if (options.length === 0) return "Unknown";

  if (question.field === 'employmentType') {
    const salariedKeywords = ["job", "service", "company", "employ", "salari", "काम करतो", "नोकरी", "पगारदार", "नौकरी", "वेतन", "private", "govt", "सरकारी"];
    const selfKeywords = ["business", "shop", "self", "own", "proprietor", "व्यवसाय", "धंदा", "दुकान", "स्वतःचा", "व्यापार", "दुकानदार", "धंदेवाईक"];
    
    if (salariedKeywords.some(kw => lower.includes(kw))) return "Salaried";
    if (selfKeywords.some(kw => lower.includes(kw))) return "Self Employed";
  }

  if (question.field === 'insuranceType') {
    const lifeKeywords = ["life", "term", "family", "जीवन", "आयुष्य", "मुदत"];
    const healthKeywords = ["health", "medic", "hospital", "doctor", "आरोग्य", "स्वास्थ्य", "वैद्यकीय", "औषध", "आजारी"];
    const vehicleKeywords = ["vehicle", "car", "bike", "auto", "गाडी", "वाहन", "फोर व्हीलर", "टू व्हीलर"];

    if (lifeKeywords.some(kw => lower.includes(kw))) return "Life Insurance";
    if (healthKeywords.some(kw => lower.includes(kw))) return "Health Insurance";
    if (vehicleKeywords.some(kw => lower.includes(kw))) return "Vehicle Insurance";
  }

  for (const opt of options) {
    if (lower === opt.toLowerCase()) {
      return opt;
    }
  }

  return "Unknown";
}

// ─── Firestore REST helpers ──────────────────────────────────────────────────
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

// CRM Helper: Checks if a lead with this phone number already exists
async function findExistingLead(phone: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
  
  const getQueryForPhone = (ph: string) => ({
    structuredQuery: {
      from: [{ collectionId: "leads" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "phone" },
          op: "EQUAL",
          value: { stringValue: ph }
        }
      },
      limit: 1
    }
  });

  try {
    let res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getQueryForPhone(phone))
    });
    if (!res.ok) return null;
    let result = await res.json();
    
    // Fallback: If not found and phone is 10 digits, search with "91" prefix for legacy leads
    if ((!result || result.length === 0 || !result[0].document) && phone.length === 10) {
      const legacyPhone = "91" + phone;
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getQueryForPhone(legacyPhone))
      });
      if (res.ok) {
        result = await res.json();
      }
    }

    if (result && result.length > 0 && result[0].document) {
      const doc = result[0].document;
      return {
        id: doc.name.split("/").pop() || "",
        name: doc.fields?.name?.stringValue || "Customer",
        status: doc.fields?.status?.stringValue || "New Lead",
        category: doc.fields?.category?.stringValue || doc.fields?.type?.stringValue || "Loan Application",
        language: doc.fields?.language?.stringValue || "English",
        botMuted: doc.fields?.botMuted?.booleanValue === true
      };
    }
  } catch (err) {
    console.error("Error finding existing lead in CRM:", err);
  }
  return null;
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

// Helper: Save WhatsApp Message details to Firestore collection for chat history
async function saveWAMessage(
  phone: string,
  text: string,
  sender: 'customer' | 'bot' | 'staff',
  userName: string,
  leadId: string = "",
  mediaType: string = "",
  mediaUrl: string = "",
  filename: string = ""
) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/whatsapp_messages?key=${FIREBASE_API_KEY}`;
  
  const fields: Record<string, any> = {
    phone: { stringValue: phone },
    text: { stringValue: text },
    sender: { stringValue: sender },
    userName: { stringValue: userName },
    timestamp: { timestampValue: new Date().toISOString() },
    mediaType: { stringValue: mediaType || "" },
    mediaUrl: { stringValue: mediaUrl || "" },
    filename: { stringValue: filename || "" }
  };
  
  if (leadId) {
    fields.leadId = { stringValue: leadId };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      console.error("Failed to save WA message to Firestore:", await res.text());
    }
  } catch (err) {
    console.error("Error saving WA message:", err);
  }
}

async function isLeadBotMuted(leadId: string): Promise<boolean> {
  if (!leadId) return false;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads/${leadId}?key=${FIREBASE_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const doc = await res.json();
    return doc.fields?.botMuted?.booleanValue === true;
  } catch (err) {
    console.error("Error checking botMuted status:", err);
    return false;
  }
}

async function handleIncomingMedia(mediaId: string, mimeType: string, filename: string, phone: string): Promise<string> {
  try {
    const mediaUrlRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`
      }
    });
    if (!mediaUrlRes.ok) {
      throw new Error(`Failed to fetch media details: ${await mediaUrlRes.text()}`);
    }
    const mediaDetails = await mediaUrlRes.json();
    const lookasideUrl = mediaDetails.url;
    if (!lookasideUrl) {
      throw new Error("No URL found in media details");
    }

    const fileRes = await fetch(lookasideUrl, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`
      }
    });
    if (!fileRes.ok) {
      throw new Error(`Failed to download file from Facebook: ${await fileRes.text()}`);
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = getAdminStorage().bucket();
    const folder = "whatsapp_incoming";
    const extension = mimeType.split("/")[1]?.split(";")[0] || "bin";
    const destinationPath = `${folder}/${phone}_${mediaId}.${extension}`;
    const file = bucket.file(destinationPath);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          firebaseStorageDownloadTokens: mediaId
        }
      }
    });

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destinationPath)}?alt=media&token=${mediaId}`;
    return downloadUrl;
  } catch (error) {
    console.error("Error in handleIncomingMedia:", error);
    return "";
  }
}

async function sendWA(to: string, message: string | any, leadId: string = "") {
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

  // Auto-save outbound bot message to database
  let logText = "";
  if (typeof message === 'string') {
    logText = message;
  } else if (message.body?.text) {
    logText = message.body.text;
  } else {
    logText = "[Interactive Menu]";
  }
  await saveWAMessage(to, logText, 'bot', 'TechStar Bot', leadId);
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

    // Map WhatsApp Cloud API interactive replies back to plain text keys
    if (msg.type === 'interactive') {
      const interactive = msg.interactive;
      if (interactive.type === 'button_reply') {
        text = interactive.button_reply?.id || '';
      } else if (interactive.type === 'list_reply') {
        text = interactive.list_reply?.id || '';
      }
    }

    let mediaType = "";
    let mediaUrl = "";
    let filename = "";

    if (msg.type === 'image') {
      mediaType = 'image';
      const imageInfo = msg.image;
      const mediaId = imageInfo.id;
      const mimeType = imageInfo.mime_type || "image/jpeg";
      text = imageInfo.caption || "📷 Image";
      mediaUrl = await handleIncomingMedia(mediaId, mimeType, "image", from);
    } else if (msg.type === 'document') {
      mediaType = 'document';
      const docInfo = msg.document;
      const mediaId = docInfo.id;
      const mimeType = docInfo.mime_type || "application/pdf";
      filename = docInfo.filename || "Document";
      text = docInfo.caption || `📄 ${filename}`;
      mediaUrl = await handleIncomingMedia(mediaId, mimeType, filename, from);
    }

    if (!from || (!text && !mediaUrl)) return NextResponse.json({ ok: true });

    // Load existing session for this user
    let session = await getSession(from);

    // Determine if bot is muted
    let isMuted = false;
    let leadId = "";
    let leadName = "Customer";
    let existingLead = null;

    if (session && session.leadId) {
      leadId = session.leadId;
      isMuted = await isLeadBotMuted(leadId);
      leadName = session.name || "Customer";
    } else {
      existingLead = await findExistingLead(from);
      if (existingLead) {
        leadId = existingLead.id;
        isMuted = existingLead.botMuted || false;
        leadName = existingLead.name;
      }
    }

    // If bot is muted, log and exit early
    if (isMuted) {
      await saveWAMessage(from, text, 'customer', leadName, leadId, mediaType, mediaUrl, filename);
      return NextResponse.json({ ok: true });
    }

    // ── No session: Greet and check existing lead in CRM ──
    if (!session) {
      const lead = existingLead || await findExistingLead(from);
      
      if (lead) {
        // Greet user with their status and ask if they need help
        const leadLang = lead.language || "English";
        const LANG_NAME_TO_CODE: Record<string, string> = {
          "English": "en",
          "Hindi": "hi",
          "Marathi": "mr"
        };
        const lang = LANG_NAME_TO_CODE[leadLang] || "en";
        
        const locCategory = getLocalizedCategory(lead.category, lang);
        const locStatus = getLocalizedStatus(lead.status, lang);
        const isLanding = (lead.category || "").toLowerCase().trim() === "landing" || !(lead.category);
        
        let statusMsg = "";
        if (lang === 'mr') {
          const categoryPhrase = isLanding ? "कर्जाच्या अर्जाची" : `${locCategory} च्या कर्जाच्या अर्जाची`;
          statusMsg = `👋 नमस्कार *${lead.name}*!\n\nतुमच्या *${categoryPhrase}* सद्यस्थिती (Status) *${locStatus}* अशी आहे.\n\nतुम्हाला अजून काही मदत पाहिजे का? कृपया तुमचा प्रश्न येथे टाईप करा (उदा. व्याजदर, कागदपत्रे) किंवा नवीन कर्जासाठी *new loan* लिहा.`;
        } else if (lang === 'hi') {
          const categoryPhrase = isLanding ? "लोन आवेदन" : `${locCategory} के आवेदन`;
          statusMsg = `👋 नमस्कार *${lead.name}*!\n\nहमें आपके *${categoryPhrase}* की स्थिति (Status) *${locStatus}* मिली है।\n\nक्या आपको और कोई मदद चाहिए? कृपया अपना प्रश्न यहाँ लिखें (जैसे: ब्याज दर, आवश्यक दस्तावेज) या फिर से आवेदन करने के लिए *new loan* लिखें।`;
        } else {
          const categoryPhrase = isLanding ? "loan application" : `application for *${locCategory}*`;
          statusMsg = `👋 Hello *${lead.name}*!\n\nWe found your existing *${categoryPhrase}*.\n\n📊 *Status:* ${locStatus}\n\nDo you need any further help? Please type your query (e.g. interest rate, required documents) or reply *new loan* to apply again.`;
        }
        
        // Log incoming customer message linked to existing lead
        await saveWAMessage(from, text, 'customer', lead.name, lead.id, mediaType, mediaUrl, filename);
        
        await sendWA(from, statusMsg, lead.id);
        
        // Start session in step 99 (support mode)
        await saveSession(from, {
          step: 99,
          category: lead.category,
          name: lead.name,
          responses: { leadId: lead.id },
          language: lang,
          leadId: lead.id
        });
        return NextResponse.json({ ok: true });
      }

      // No existing lead: Start fresh flow
      const referral = msg.referral;
      const initialResponses: Record<string, string> = {};
      if (referral) {
        initialResponses.adId = referral.source_id || "";
        initialResponses.adHeadline = referral.headline || "";
        initialResponses.adBody = referral.body || "";
      }

      const initialDetails = generateDetailsText({
        name: "",
        category: "",
        language: "en",
        responses: initialResponses
      });

      // Create initial lead record immediately (with phone and referral details)
      const newLeadId = await createLead({
        phone: from,
        source: referral ? `Meta Ads - ${referral.headline}` : 'WhatsApp Automation',
        details: initialDetails,
        ...initialResponses
      });

      // Log incoming customer message linked to new lead
      await saveWAMessage(from, text, 'customer', 'Customer', newLeadId, mediaType, mediaUrl, filename);

      await sendWA(from, langInteractive, newLeadId);
      await saveSession(from, { step: 1, category: '', name: '', responses: initialResponses, language: 'en', leadId: newLeadId });
      return NextResponse.json({ ok: true });
    }

    const lang = session.language || 'en';
    
    // Log incoming message for existing session
    await saveWAMessage(from, text, 'customer', session.name || 'Customer', session.leadId, mediaType, mediaUrl, filename);

    // ── Step 99: Existing Lead Support Mode ──
    if (session.step === 99) {
      const restartKeywords = ["new loan", "apply", "start again", "restart", "नवीन कर्ज", "नया लोन", "आवेदन", "पुन्हा सुरू करा"];
      if (restartKeywords.some(kw => text.toLowerCase().includes(kw))) {
        await deleteSession(from);
        
        // Start fresh flow
        const leadId = await createLead({
          phone: from,
          source: 'WhatsApp Automation',
          details: generateDetailsText({ name: "", category: "", language: "en", responses: {} })
        });
        
        await sendWA(from, langInteractive, leadId);
        await saveSession(from, { step: 1, category: '', name: '', responses: {}, language: 'en', leadId });
        return NextResponse.json({ ok: true });
      }

      // Parse request using the local AI/loan info responder
      const aiReply = localLoanAIResponder(text, lang);
      
      const followUpText = {
        en: `\n\nIs there anything else I can help you with? (Or reply *new loan* to apply again)`,
        hi: `\n\nक्या मैं आपकी किसी और चीज़ में सहायता कर सकता हूँ? (या दोबारा आवेदन करने के लिए *new loan* लिखें)`,
        mr: `\n\nमी तुम्हाला अजून काही मदत करू शकतो का? (किंवा नवीन कर्जासाठी *new loan* लिहा)`
      }[lang] || `\n\nNeed any more help?`;

      await sendWA(from, `${aiReply}${followUpText}`, session.leadId);
      return NextResponse.json({ ok: true });
    }

    // ── Step 1: Wait for language selection ──
    if (session.step === 1) {
      const langKey = text;
      if (langKey !== '1' && langKey !== '2' && langKey !== '3') {
        const aiReply = localLoanAIResponder(text, 'en');
        await sendWA(from, `${aiReply}\n\n*Please select your language:*`, session.leadId);
        await sendWA(from, langInteractive, session.leadId);
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

      await sendWA(from, askNameText, session.leadId);
      await saveSession(from, { ...session, step: 2, language: selectedLang });
      return NextResponse.json({ ok: true });
    }

    // ── Step 2: Got name → show loan category menu ──
    if (session.step === 2) {
      const name = text;
      
      const detailsText = generateDetailsText({
        name: name,
        category: "",
        language: lang,
        responses: session.responses
      });

      await updateLead(session.leadId, { name, details: detailsText });

      const catPayload = getCategoryListPayload(lang, name);
      await sendWA(from, catPayload, session.leadId);
      await saveSession(from, { ...session, step: 3, name });
      return NextResponse.json({ ok: true });
    }

    // ── Step 3: Got category number ──
    if (session.step === 3) {
      const num = parseInt(text) - 1;
      if (isNaN(num) || num < 0 || num >= LOAN_CATEGORIES.length) {
        const aiReply = localLoanAIResponder(text, lang);
        await sendWA(from, aiReply, session.leadId);
        await sendWA(from, getCategoryListPayload(lang, session.name), session.leadId);
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

      await updateLead(session.leadId, {
        category: category,
        type: category,
        details: detailsText
      });

      const introText = MSG_CAT_INTRO[lang].replace('{category}', categoryLocalized);
      const firstQ = LOAN_FLOWS[category][0];
      const questionPayload = getQuestionPayload(lang, firstQ);
      
      if (typeof questionPayload === 'string') {
        await sendWA(from, `${introText}\n\n${questionPayload}`, session.leadId);
      } else {
        await sendWA(from, introText, session.leadId);
        await sendWA(from, questionPayload, session.leadId);
      }

      await saveSession(from, { ...session, step: 4, category });
      return NextResponse.json({ ok: true });
    }

    // ── Step 4+: Flow questions ──
    if (session.step >= 4) {
      const flow = LOAN_FLOWS[session.category];
      if (!flow) {
        await sendWA(from, MSG_ERROR_WARN[lang], session.leadId);
        await deleteSession(from);
        return NextResponse.json({ ok: true });
      }

      const questionIndex = session.step - 4;
      const currentQ = flow[questionIndex];

      if (!currentQ) {
        await deleteSession(from);
        return NextResponse.json({ ok: true });
      }

      // Check option index or use local natural-language classification
      let answer = text;
      let isClassified = false;
      if (currentQ.type === 'dropdown' && currentQ.options) {
        const num = parseInt(text) - 1;
        if (!isNaN(num) && num >= 0 && num < currentQ.options.length) {
          answer = currentQ.options[num];
          isClassified = true;
        } else {
          const localClassified = localClassifyDropdown(text, currentQ);
          if (localClassified !== "Unknown") {
            answer = localClassified;
            isClassified = true;
          }
        }
      } else {
        isClassified = true;
      }

      if (!isClassified) {
        const aiReply = localLoanAIResponder(text, lang);
        await sendWA(from, aiReply, session.leadId);
        await sendWA(from, getQuestionPayload(lang, currentQ), session.leadId);
        return NextResponse.json({ ok: true });
      }

      const updatedResponses = { ...session.responses, [currentQ.field]: answer };
      
      const detailsText = generateDetailsText({
        name: session.name,
        category: session.category,
        language: lang,
        responses: updatedResponses
      });

      await updateLead(session.leadId, {
        [currentQ.field]: answer,
        details: detailsText
      });

      const nextIndex = questionIndex + 1;
      const nextQ = flow[nextIndex];

      if (nextQ) {
        const questionPayload = getQuestionPayload(lang, nextQ);
        const questionIndexText = {
          en: `Q${nextIndex + 1}: `,
          hi: `Q${nextIndex + 1}: `,
          mr: `Q${nextIndex + 1}: `
        }[lang] || `Q${nextIndex + 1}: `;
        
        if (typeof questionPayload === 'string') {
          await sendWA(from, `${questionIndexText}${questionPayload}`, session.leadId);
        } else {
          await sendWA(from, questionPayload, session.leadId);
        }
        await saveSession(from, { ...session, step: session.step + 1, responses: updatedResponses });
      } else {
        const categoryLocalized = LOCALIZED_CATEGORIES[lang][LOAN_CATEGORIES.indexOf(session.category)];

        const thankYouText = MSG_THANK_YOU[lang]
          .replace('{name}', session.name)
          .replace('{category}', categoryLocalized);
          
        await sendWA(from, thankYouText, session.leadId);
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
