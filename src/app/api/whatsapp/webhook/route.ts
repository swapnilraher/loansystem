import { NextResponse } from 'next/server';
import { getAdminStorage } from "@/lib/firebase-admin";
import { firestoreFetch } from '@/lib/firestore-rest';
import { sendLeadNotificationToAdmins } from "@/lib/notificationService";
import { createWaIncomingNotification } from "@/lib/waNotifications";
import { lookupPincode, pincodeLeadFields, type PincodeDetails } from "@/lib/pincode";
import { currentDistrictName } from "@/lib/locationMatch";
import {
  GRAPH_BASE,
  WHATSAPP_MEDIA_HEADERS,
  mediaProxyPath,
  WHATSAPP_TOKEN as WA_TOKEN,
  WHATSAPP_PHONE_ID as WA_PHONE_ID,
  WHATSAPP_VERIFY_TOKEN as WA_VERIFY_TOKEN,
} from "@/lib/whatsappConfig";
import { loadFlowConfig } from "@/lib/waFlowStore";
import {
  flowByCategory,
  menuFlows,
  nextStepIndex,
  pick,
  type FlowStep,
  type MessageKey,
  type WaFlow,
  type WaFlowConfig,
} from "@/lib/waFlows";

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo";
const PROJECT_ID = "dsa-loan";

// Credentials now live in one place — see `@/lib/whatsappConfig`.
const WHATSAPP_TOKEN = WA_TOKEN;
const PHONE_ID = WA_PHONE_ID;
const VERIFY_TOKEN = WA_VERIFY_TOKEN;

/**
 * The bot's questions and messages are no longer written here.
 *
 * They live in `@/lib/waFlows` as data and in Firestore as an Admin's edits, and
 * `loadFlowConfig` merges the two — so changing a question is a CRM edit rather
 * than a deploy. The shipped defaults are byte-identical to the constants this
 * file used to hold, which is what makes the switch safe: an empty `waFlows`
 * collection, or an unreachable one, runs exactly the old script.
 */
type MessageBag = WaFlowConfig["messages"];

/** One message, in the customer's language. `{name}` / `{category}` filled in. */
function say(
  messages: MessageBag,
  key: MessageKey,
  lang: string,
  tokens: { name?: string; category?: string } = {}
): string {
  let text = pick(messages[key], lang);
  if (tokens.name !== undefined) text = text.replace(/\{name\}/g, tokens.name);
  if (tokens.category !== undefined) text = text.replace(/\{category\}/g, tokens.category);
  return text;
}

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

/**
 * The product menu, built from whichever flows the Admin has enabled.
 *
 * The row ids are positions in `menuFlows(config)`, and step 3 reads them back
 * the same way — so a product the Admin disables or reorders changes the menu
 * and the answer mapping together, and never leaves a customer selecting "3" to
 * mean a product that is no longer third.
 */
function getCategoryListPayload(config: WaFlowConfig, lang: string, name: string) {
  const flows = menuFlows(config);
  const listTitle = {
    en: "Select Loan Type",
    hi: "लोन प्रकार चुनें",
    mr: "लोनचा प्रकार निवडा"
  }[lang] || "Select Loan Type";

  const bodyText = say(config.messages, "chooseProduct", lang, { name });

  return {
    type: "list",
    body: { text: bodyText },
    action: {
      button: listTitle.length > 20 ? listTitle.substring(0, 20) : listTitle,
      sections: [
        {
          title: listTitle,
          // WhatsApp allows ten rows in a section; more products than that need
          // sections of their own, which no CRM has asked for yet.
          rows: flows.slice(0, 10).map((flow, i) => {
            const label = pick(flow.label, lang) || flow.category;
            return {
              id: String(i + 1),
              title: label.length > 24 ? label.substring(0, 24) : label
            };
          })
        }
      ]
    }
  };
}

/**
 * WhatsApp renders at most three reply buttons. A question with more options has
 * to be sent as a list, and the fourth option onwards used to be dropped on the
 * floor — which is why Home Loan's five purposes could not be asked as buttons.
 */
const MAX_REPLY_BUTTONS = 3;

function getDropdownQuestionPayload(messages: MessageBag, lang: string, step: FlowStep) {
  const questionText = pick(step.question, lang);
  const options = step.options || [];
  const labelFor = (option: { value: string; label: Record<string, string | undefined> }) =>
    pick(option.label, lang) || option.value;

  // More options than WhatsApp will render as buttons — send a list instead.
  if (options.length > MAX_REPLY_BUTTONS) {
    const button = say(messages, "pickOption", lang);
    return {
      type: "list",
      body: { text: questionText },
      action: {
        button: button.length > 20 ? button.substring(0, 20) : button,
        sections: [
          {
            title: button.length > 24 ? button.substring(0, 24) : button,
            rows: options.slice(0, 10).map((option, i) => {
              const title = labelFor(option);
              const description = pick(option.description, lang);
              return {
                id: String(i + 1),
                title: title.length > 24 ? title.substring(0, 24) : title,
                ...(description ? { description: description.substring(0, 72) } : {})
              };
            })
          }
        ]
      }
    };
  }

  const buttons = options.slice(0, MAX_REPLY_BUTTONS).map((option, i) => {
    const title = labelFor(option);
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

function getQuestionPayload(messages: MessageBag, lang: string, step: FlowStep) {
  if (step.type === 'dropdown' && step.options && step.options.length > 0) {
    return getDropdownQuestionPayload(messages, lang, step);
  }
  return `*Q:* ${pick(step.question, lang)}`;
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
      // `_`-prefixed keys are the flow's own bookkeeping (retry counters), not
      // anything the customer said.
      if (key.startsWith('_')) continue;
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      text += `- ${formattedKey.toUpperCase()}: ${value}\n`;
    }
  }
  
  if (session.responses?.adHeadline) {
    text += `\nReferral Ad: ${session.responses.adHeadline}\n`;
  }
  return text;
}

/**
 * The status a lead reaches when the bot has collected every answer and the
 * qualification rules passed. It sits between "New Lead" and "Contacted": the
 * file is ready for a human, but no human has touched it yet.
 *
 * Kept in sync with `STATUS_OPTIONS` in `@/components/admin/leads/leadFilters` —
 * duplicated rather than imported because this route runs on the server and the
 * CRM module is a client bundle.
 */
const STATUS_SYSTEM_QUALIFIED = "System Qualified";

type CallbackWindow = "soon" | "tomorrow" | "thisMorning";

const OFFICE_OPENS_HOUR = 10;
const OFFICE_CLOSES_HOUR = 18;

/**
 * Which callback promise is honest right now, in Indian Standard Time.
 *
 * IST explicitly, not the server clock: this deploys to hosts that run on UTC,
 * where every evening lead would be told "within 15 minutes" at what is actually
 * the middle of the night for the office.
 */
function callbackWindow(now: Date = new Date()): CallbackWindow {
  const istHour = Number(
    // `hourCycle: "h23"` rather than `hour12: false`, which reports midnight as
    // "24" on some engines and would push every 00:xx lead into the wrong branch.
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now)
  );

  if (istHour < OFFICE_OPENS_HOUR) return "thisMorning";
  if (istHour >= OFFICE_CLOSES_HOUR) return "tomorrow";
  return "soon";
}

/** One human-readable line for the chat summary staff read in the CRM. */
function pincodeSummaryLine(details: PincodeDetails): string {
  const head = [details.city, currentDistrictName(details.district), details.state]
    .filter(Boolean)
    .filter((part, i, all) => all.indexOf(part) === i)
    .join(", ");
  const extras: string[] = [];
  if (details.taluka) extras.push(`Taluka: ${details.taluka}`);
  if (details.postOffice) extras.push(`PO: ${details.postOffice}`);
  if (details.urbanRural) extras.push(details.urbanRural);
  return extras.length > 0 ? `${head} (${extras.join(", ")})` : head;
}

/**
 * Everything a resolved PIN code adds to the lead document.
 *
 * `state` and `city` are the CRM's general-purpose fields and are set here so
 * the leads table and banker card work without knowing about `pin*`. The `pin*`
 * copies made by `pincodeLeadFields` are the ones that must survive: a later
 * flow answer ("which city is the property in?") overwrites `city`, and staff
 * re-point the banker search independently — neither may erase where the PIN
 * code said the customer is.
 */
async function resolvePincodeFields(
  rawAnswer: string,
  responses: Record<string, string>
): Promise<Record<string, string>> {
  const details = await lookupPincode(rawAnswer);
  // An unresolvable or unreachable PIN code leaves the raw answer standing on
  // its own. Nothing is inferred from a failed lookup.
  if (!details) return {};

  responses.location = pincodeSummaryLine(details);

  const fields: Record<string, string> = { ...pincodeLeadFields(details) };
  if (details.state) fields.state = details.state;
  if (details.city) fields.city = details.city;
  return fields;
}

/**
 * Sends one flow question, numbered by its position.
 *
 * Extracted because the same three lines are now needed in four places — the
 * first question of a flow, the next question, the first question after a
 * switch to Loan Against Property, and a re-ask.
 */
async function sendQuestion(
  phone: string,
  messages: MessageBag,
  lang: string,
  step: FlowStep,
  index: number,
  leadId: string
) {
  const payload = getQuestionPayload(messages, lang, step);
  if (typeof payload === 'string') {
    await sendWA(phone, `Q${index + 1}: ${payload}`, leadId);
  } else {
    await sendWA(phone, payload, leadId);
  }
}

/** Field → label for the one-line qualification summary staff see in the CRM. */
const QUALIFICATION_LABELS: [string, string][] = [
  ["occupation", "Occupation"],
  ["homeLoanPurpose", "Purpose"],
  ["incomePaymentMode", "Income"],
  ["monthlyIncome", "Monthly income"],
  ["existingLoanEmi", "Existing EMI"],
  ["existingLoanDetails", "Existing loan"],
  ["cibilScore", "CIBIL"],
  ["employmentType", "Employment"],
  ["businessVintage", "Vintage"],
  ["annualTurnover", "Turnover"],
  ["propertyValue", "Property value"],
  ["loanAmount", "Amount"],
];

/** "Occupation: Job · Income: Bank Account · Existing EMI: No · CIBIL: 750" */
function qualificationSummary(responses: Record<string, string>): string {
  return QUALIFICATION_LABELS
    .filter(([field]) => responses[field])
    .map(([field, label]) => `${label}: ${responses[field]}`)
    .join(" · ");
}

/**
 * Ends a completed flow: every question answered, so the lead is handed to a
 * human.
 *
 * The lead is left unassigned on purpose. Whichever staff member acts on it
 * first claims it, through the CRM's existing auto-claim rule — assigning here
 * would pick an owner who has not agreed to take the call.
 */
async function completeQualification(
  phone: string,
  config: WaFlowConfig,
  session: WaSessionState,
  lang: string
) {
  const flow = flowByCategory(config, session.category);
  const categoryLocalized = pick(flow?.label, lang) || session.category;

  const qualifiedAt = new Date().toISOString();

  await updateLead(session.leadId, {
    status: STATUS_SYSTEM_QUALIFIED,
    qualifiedAt,
    qualificationDetails: qualificationSummary(session.responses),
    /**
     * The leads table ranks on `statusUpdatedAt`. Setting a status without it
     * would drop a lead that qualified thirty seconds ago to the bottom of the
     * list, under files nobody has touched in weeks.
     *
     * An ISO string rather than a Firestore timestamp because `updateLead`
     * sends every field as `stringValue` — `toDate` in `@/lib/dates` reads both
     * shapes, so the CRM cannot tell the difference.
     */
    statusUpdatedAt: qualifiedAt,
  });

  // Which promise is honest depends on the hour — see `callbackWindow`.
  const closingKey: MessageKey = {
    soon: "thankYouSoon",
    tomorrow: "thankYouTomorrow",
    thisMorning: "thankYouThisMorning",
  }[callbackWindow()] as MessageKey;

  const text = say(config.messages, closingKey, lang, {
    name: session.name || "Sir/Madam",
    category: categoryLocalized,
  });

  await sendWA(phone, text, session.leadId);
  await deleteSession(phone);
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
    // Internal wording; the customer is only told a staff member will call.
    "system qualified": {
      en: "Awaiting our call",
      hi: "हमारे कॉल की प्रतीक्षा में",
      mr: "आमच्या कॉलची प्रतीक्षा"
    },
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

/**
 * A typed answer mapped onto one of a question's options.
 *
 * The keyword lists below stay in code rather than moving to the flow editor:
 * they are how the bot understands a customer who types "नोकरी" instead of
 * pressing a button, and getting them wrong silently mis-files a lead. An Admin
 * adding their own option is still covered — the label match at the end of this
 * function reads whatever labels the flow currently carries, in all three
 * languages.
 */
function localClassifyDropdown(userText: string, question: FlowStep, lang: string): string {
  const lower = userText.toLowerCase().trim();
  const options = question.options || [];
  if (options.length === 0) return "Unknown";

  const values = options.map(o => o.value);
  const has = (value: string) => values.includes(value);

  /**
   * The hand-written vocabulary, keyed on the field the answer is saved to.
   * Its verdict is only accepted when the question still offers that option —
   * an Admin who renamed the choices must not have answers filed under the old
   * ones.
   */
  const byKeyword = (): string => {
  if (question.field === 'employmentType') {
    const salariedKeywords = ["job", "service", "company", "employ", "salari", "काम करतो", "नोकरी", "पगारदार", "नौकरी", "वेतन", "private", "govt", "सरकारी"];
    const selfKeywords = ["business", "shop", "self", "own", "proprietor", "व्यवसाय", "धंदा", "दुकान", "स्वतःचा", "व्यापार", "दुकानदार", "धंदेवाईक"];
    
    if (salariedKeywords.some(kw => lower.includes(kw))) return "Salaried";
    if (selfKeywords.some(kw => lower.includes(kw))) return "Self Employed";
  }

  // Personal Loan qualification. Customers routinely type a word instead of
  // pressing the button, in any of the three languages plus romanised Marathi.
  if (question.field === 'occupation') {
    const jobKeywords = ["job", "naukri", "service", "salari", "employ", "company", "नोकरी", "नौकरी", "पगार", "वेतन", "कामाला", "सर्विस"];
    const businessKeywords = ["business", "vyavsay", "dhanda", "shop", "self", "own", "व्यवसाय", "व्यापार", "धंदा", "दुकान", "स्वतःचा", "बिझनेस", "बिजनेस"];

    if (jobKeywords.some(kw => lower.includes(kw))) return "Job";
    if (businessKeywords.some(kw => lower.includes(kw))) return "Business";
  }

  if (question.field === 'incomePaymentMode') {
    const bankKeywords = ["bank", "account", "khate", "salary account", "neft", "बँक", "बैंक", "खाते", "खात्यात", "अकाउंट"];
    const cashKeywords = ["cash", "rokh", "nagad", "hand", "रोख", "नकद", "नगद", "हातात", "कॅश", "कैश"];

    if (bankKeywords.some(kw => lower.includes(kw))) return "Bank Account";
    if (cashKeywords.some(kw => lower.includes(kw))) return "Cash Payment";
  }

  // Home Loan purpose. Checked most-specific-first: "balance transfer" and
  // "top-up" both mention an existing loan, and a plain "घर" appears in almost
  // every one of these phrases, so it can only be the fallback.
  if (question.field === 'homeLoanPurpose') {
    if (["balance transfer", "bt", "transfer", "बॅलन्स", "बैलेंस", "ट्रान्सफर", "ट्रांसफर"].some(kw => lower.includes(kw))) {
      return "Balance Transfer";
    }
    if (["top up", "top-up", "topup", "टॉप अप", "टॉप-अप", "टॉपअप", "अतिरिक्त"].some(kw => lower.includes(kw))) {
      return "Top-Up Loan";
    }
    if (["construct", "build", "bandhkam", "bandhaycha", "बांधकाम", "बांधणार", "बांधाय", "निर्माण", "बनवा", "बनाना", "प्लॉट", "plot"].some(kw => lower.includes(kw))) {
      return "House Construction";
    }
    if (["flat", "apartment", "फ्लॅट", "फ्लैट", "सदनिका"].some(kw => lower.includes(kw))) {
      return "Flat Purchase";
    }
    if (["new home", "new house", "navin ghar", "ghar kharedi", "buy", "purchase", "नवीन घर", "नया घर", "घर खरेदी", "घर खरीद", "घर"].some(kw => lower.includes(kw))) {
      return "New Home Purchase";
    }
  }

  // Every remaining new question is a plain Yes / No.
  if (has("Yes") && has("No")) {
    const yesKeywords = ["yes", "ya", "yeah", "ok", "okay", "sure", "havi", "pahije", "chalel", "barobar", "हो", "होय", "हाँ", "हा", "हवी", "हवे", "पाहिजे", "आहे", "चालेल", "जरूर"];
    const noKeywords = ["no", "nope", "nahi", "nako", "नाही", "नहीं", "नको", "नाहीये"];

    // "नाही" contains "हा"; check the negative first so it is not read as a yes.
    if (noKeywords.some(kw => lower.includes(kw))) return "No";
    if (yesKeywords.some(kw => lower.includes(kw))) return "Yes";
  }

  if (question.field === 'insuranceType') {
    const lifeKeywords = ["life", "term", "family", "जीवन", "आयुष्य", "मुदत"];
    const healthKeywords = ["health", "medic", "hospital", "doctor", "आरोग्य", "स्वास्थ्य", "वैद्यकीय", "औषध", "आजारी"];
    const vehicleKeywords = ["vehicle", "car", "bike", "auto", "गाडी", "वाहन", "फोर व्हीलर", "टू व्हीलर"];

    if (lifeKeywords.some(kw => lower.includes(kw))) return "Life Insurance";
    if (healthKeywords.some(kw => lower.includes(kw))) return "Health Insurance";
    if (vehicleKeywords.some(kw => lower.includes(kw))) return "Vehicle Insurance";
  }

    return "";
  };

  const keyword = byKeyword();
  if (keyword && has(keyword)) return keyword;

  /**
   * Last resort, and the only part that knows about options an Admin added
   * themselves: the customer typed the option back, in their own language.
   * Exact match first, then containment, so "नवीन घर खरेदी करायचे आहे" still
   * lands on "नवीन घर खरेदी" without "घर" alone matching three of them.
   */
  const labels = options.map(option => ({
    value: option.value,
    texts: [option.value, pick(option.label, lang), option.label.en, option.label.hi, option.label.mr]
      .filter((t): t is string => !!t)
      .map(t => t.toLowerCase().trim()),
  }));

  for (const option of labels) {
    if (option.texts.some(text => text === lower)) return option.value;
  }
  for (const option of labels) {
    if (option.texts.some(text => text.length >= 3 && lower.includes(text))) return option.value;
  }

  return "Unknown";
}

/**
 * What the customer actually picked, for the chat log.
 *
 * The flow keys on the position the customer replies with ("1"), and that bare
 * digit was what got written into `whatsapp_messages` — so the CRM thread read
 * "1" where the customer had chosen "Salaried". The number is still what drives
 * the flow below; this resolves it against whichever menu the session is
 * currently sitting on, purely for display.
 *
 * Interactive replies already arrive with their own title, so they never reach
 * this — see the `button_reply` / `list_reply` handling in the webhook body.
 */
function optionLabelFor(
  text: string,
  session: WaSessionState | null,
  config: WaFlowConfig
): string {
  if (!session) return text;
  if (!/^\d+$/.test(text.trim())) return text;

  const index = parseInt(text.trim(), 10) - 1;
  if (index < 0) return text;

  // Language buttons.
  if (session.step === 1) {
    return LANG_NAMES[LANGUAGES[text.trim()]] || text;
  }

  // The loan-product list.
  if (session.step === 3) {
    return menuFlows(config)[index]?.category || text;
  }

  // A dropdown question inside the product's flow.
  if (session.step >= 4) {
    const question = flowByCategory(config, session.category)?.steps[session.step - 4];
    if (question?.type === 'dropdown' && question.options) {
      return question.options[index]?.value || text;
    }
  }

  return text;
}

// ─── Firestore REST helpers ──────────────────────────────────────────────────
interface WaSessionState {
  step: number;
  category: string;
  name: string;
  responses: Record<string, string>;
  language: string;
  leadId: string;
}

async function getSession(phone: string): Promise<WaSessionState | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/waSession/${phone}?key=${FIREBASE_API_KEY}`;
  const res = await firestoreFetch(url);
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;
  return {
    step: parseInt(doc.fields.step?.integerValue || "0"),
    category: doc.fields.category?.stringValue || "",
    name: doc.fields.name?.stringValue || "",
    responses: JSON.parse(doc.fields.responses?.stringValue || "{}"),
    language: doc.fields.language?.stringValue || "mr",
    leadId: doc.fields.leadId?.stringValue || "",
  };
}

async function saveSession(phone: string, data: { step: number; category: string; name: string; responses: Record<string, string>; language: string; leadId: string }) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/waSession/${phone}?key=${FIREBASE_API_KEY}`;
  await firestoreFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        step: { integerValue: data.step.toString() },
        category: { stringValue: data.category },
        name: { stringValue: data.name },
        responses: { stringValue: JSON.stringify(data.responses) },
        language: { stringValue: data.language || "mr" },
        leadId: { stringValue: data.leadId || "" },
        updatedAt: { timestampValue: new Date().toISOString() },
      }
    })
  });
}

async function deleteSession(phone: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/waSession/${phone}?key=${FIREBASE_API_KEY}`;
  await firestoreFetch(url, { method: 'DELETE' });
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
    let res = await firestoreFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getQueryForPhone(phone))
    });
    if (!res.ok) return null;
    let result = await res.json();
    
    // Fallback: If not found and phone is 10 digits, search with "91" prefix for legacy leads
    if ((!result || result.length === 0 || !result[0].document) && phone.length === 10) {
      const legacyPhone = "91" + phone;
      res = await firestoreFetch(url, {
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
        category: doc.fields?.type?.stringValue || doc.fields?.category?.stringValue || "Loan Application",
        language: doc.fields?.language?.stringValue || "English",
        botMuted: doc.fields?.botMuted?.booleanValue === true,
        // Carried so a muted-bot message can be routed to the right staff member
        // without a second read of the same document.
        assignedTo: doc.fields?.assignedTo?.stringValue || "",
        assignedToName: doc.fields?.assignedToName?.stringValue || ""
      };
    }
  } catch (err) {
    console.error("Error finding existing lead in CRM:", err);
  }
  return null;
}

async function createLead(data: Record<string, string>, pendingPromises?: Promise<any>[]): Promise<string> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?key=${FIREBASE_API_KEY}`;
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = { stringValue: String(v) };
  }
  fields.createdAt = { timestampValue: new Date().toISOString() };
  fields.source = { stringValue: data.source || 'WhatsApp Automation' };
  fields.status = { stringValue: 'New Lead' };
  
  const res = await firestoreFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  
  if (!res.ok) {
    console.error("Failed to create lead:", await res.text());
    return "";
  }
  const result = await res.json();
  const leadName = result.name;
  const leadId = leadName.split("/").pop() || "";
  
  // Trigger FCM push notification for the new lead
  try {
    const notifyPromise = sendLeadNotificationToAdmins({
      id: leadId,
      name: data.fullName || data.name || data.panName || 'Customer',
      city: data.city || data.district || data.location || 'N/A',
      ...data,
    });
    if (pendingPromises) {
      pendingPromises.push(notifyPromise);
    } else {
      await notifyPromise;
    }
  } catch (err) {
    console.error("Error triggering push notification:", err);
  }
  
  return leadId;
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
  
  const res = await firestoreFetch(patchUrl, {
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
  filename: string = "",
  /**
   * WhatsApp's own id for the attachment. Stored so the file stays retrievable
   * even when the Storage copy fails — `/api/whatsapp/media/[mediaId]` needs it,
   * and it is the only handle Meta accepts. Messages written before this was
   * added have no id, so their attachments cannot be recovered.
   */
  mediaId: string = ""
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
    filename: { stringValue: filename || "" },
    mediaId: { stringValue: mediaId || "" }
  };
  
  if (leadId) {
    fields.leadId = { stringValue: leadId };
  }

  try {
    const res = await firestoreFetch(url, {
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

interface LeadCrmInfo {
  name: string;
  status: string;
  assignedTo: string;
  assignedToName: string;
  /** `true` = Auto Chatbot is OFF for this lead. */
  botMuted: boolean;
}

/**
 * One read of the lead document covering everything the muted-bot path needs:
 * whether the Auto Chatbot is off, plus the CRM facts the staff notification has
 * to carry (name, status, who the lead belongs to).
 *
 * Replaces the old `isLeadBotMuted`, which read the same document for a single
 * boolean — the mute decision is unchanged, it just returns more of what it
 * already fetched instead of forcing a second round-trip.
 */
async function getLeadCrmInfo(leadId: string): Promise<LeadCrmInfo | null> {
  if (!leadId) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads/${leadId}?key=${FIREBASE_API_KEY}`;
  try {
    const res = await firestoreFetch(url);
    if (!res.ok) return null;
    const doc = await res.json();
    return {
      name: doc.fields?.name?.stringValue || "",
      status: doc.fields?.status?.stringValue || "New Lead",
      assignedTo: doc.fields?.assignedTo?.stringValue || "",
      assignedToName: doc.fields?.assignedToName?.stringValue || "",
      botMuted: doc.fields?.botMuted?.booleanValue === true,
    };
  } catch (err) {
    console.error("Error reading lead CRM info:", err);
    return null;
  }
}

/** WhatsApp sends the delivery time as unix seconds in a string. */
function messageReceivedAt(raw: unknown): Date {
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return new Date();
  return new Date(seconds * 1000);
}

/**
 * Copies an incoming attachment into Firebase Storage and returns a URL the CRM
 * can render.
 *
 * If anything in that copy fails — and on this project it always does, because
 * the Firebase project has no Storage bucket at all — the message is still
 * displayable: the fallback is `/api/whatsapp/media/<id>`, which streams the
 * file from Meta on demand. Previously this returned `""` on failure, which is
 * why every image row in `whatsapp_messages` has an empty `mediaUrl` and the
 * bubble could only show the "📷 Image" caption.
 */
async function handleIncomingMedia(mediaId: string, mimeType: string, filename: string, phone: string): Promise<string> {
  // Always renderable, with or without a bucket.
  const fallbackUrl = mediaProxyPath(mediaId);

  try {
    const mediaUrlRes = await fetch(`${GRAPH_BASE}/${mediaId}`, {
      headers: WHATSAPP_MEDIA_HEADERS
    });
    if (!mediaUrlRes.ok) {
      throw new Error(`Failed to fetch media details: ${await mediaUrlRes.text()}`);
    }
    const mediaDetails = await mediaUrlRes.json();
    const lookasideUrl = mediaDetails.url;
    if (!lookasideUrl) {
      throw new Error("No URL found in media details");
    }

    // The User-Agent is not optional here: Meta's CDN rejects requests without
    // one, and Node's `fetch` does not add a default.
    const fileRes = await fetch(lookasideUrl, {
      headers: WHATSAPP_MEDIA_HEADERS
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
    // Loud, and specific about the usual cause — a silent "" here is what hid
    // this bug for months.
    console.error(
      `[WhatsApp media] Could not archive ${mediaId} to Storage (is a bucket provisioned for this Firebase project?). Falling back to on-demand streaming.`,
      error
    );
    return fallbackUrl;
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

const processedMessageIds = new Set<string>();

function isDuplicateMessage(msgId: string): boolean {
  if (!msgId) return false;
  if (processedMessageIds.has(msgId)) {
    return true;
  }
  processedMessageIds.add(msgId);
  if (processedMessageIds.size > 1000) {
    const firstKey = processedMessageIds.keys().next().value;
    if (firstKey) {
      processedMessageIds.delete(firstKey);
    }
  }
  return false;
}

// ─── POST: Incoming message handler ───────────────────────────────────────────
async function handleWebhookRequest(request: Request, pendingPromises: Promise<any>[]): Promise<Response> {
  try {
    const body = await request.json();

    // Extract message from Facebook webhook payload
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ ok: true }); // not a message event
    }

    const msg = messages[0];
    const msgId = msg.id;
    if (msgId && isDuplicateMessage(msgId)) {
      console.log(`[Webhook] Duplicate WhatsApp message ID detected: ${msgId}. Skipping.`);
      return NextResponse.json({ ok: true });
    }

    /**
     * The script for this conversation, as the CRM currently has it.
     *
     * Read once per message and cached for a minute (see `loadFlowConfig`), so
     * an Admin's edit reaches live conversations without a deploy, and a
     * Firestore failure falls back to the flows that shipped with the build
     * rather than leaving the customer with silence.
     */
    const config = await loadFlowConfig();
    const botMessages = config.messages;

    const rawFrom: string = msg.from; // sender's phone number

    // Sanitize number: strip leading 91 (for 10-digit Indian numbers)
    let cleanPhone = rawFrom.replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.substring(2);
    }
    const from = cleanPhone;

    let text: string = (msg.text?.body || '').trim();

    /**
     * What goes into the chat log, which is not always what drives the flow: a
     * menu answer is a number to the bot and a word to whoever reads the thread
     * later. Defaults to the message itself and is only overridden where the
     * two differ.
     */
    let displayText: string = text;

    // Map WhatsApp Cloud API interactive replies back to plain text keys
    if (msg.type === 'interactive') {
      const interactive = msg.interactive;
      if (interactive.type === 'button_reply') {
        text = interactive.button_reply?.id || '';
        displayText = interactive.button_reply?.title || text;
      } else if (interactive.type === 'list_reply') {
        text = interactive.list_reply?.id || '';
        displayText = interactive.list_reply?.title || text;
      }
    }

    let mediaType = "";
    let mediaUrl = "";
    let filename = "";
    let mediaId = "";

    if (msg.type === 'image') {
      mediaType = 'image';
      const imageInfo = msg.image;
      mediaId = imageInfo.id;
      const mimeType = imageInfo.mime_type || "image/jpeg";
      text = imageInfo.caption || "📷 Image";
      displayText = text;
      mediaUrl = await handleIncomingMedia(mediaId, mimeType, "image", from);
    } else if (msg.type === 'document') {
      mediaType = 'document';
      const docInfo = msg.document;
      mediaId = docInfo.id;
      const mimeType = docInfo.mime_type || "application/pdf";
      filename = docInfo.filename || "Document";
      text = docInfo.caption || `📄 ${filename}`;
      displayText = text;
      mediaUrl = await handleIncomingMedia(mediaId, mimeType, filename, from);
    }

    if (!from || (!text && !mediaUrl)) return NextResponse.json({ ok: true });

    // Load existing session for this user
    let session = await getSession(from);

    // The session says which menu the customer was answering, so a typed "1"
    // can be logged as the option it stands for.
    if (msg.type !== 'interactive') {
      displayText = optionLabelFor(displayText, session, config);
    }

    // Determine if bot is muted (`botMuted` = Auto Chatbot OFF for this lead),
    // and collect the CRM facts a staff notification needs while we are here.
    let isMuted = false;
    let leadId = "";
    let leadName = "Customer";
    let leadStatus = "New Lead";
    let leadAssignedTo = "";
    let leadAssignedToName = "";
    let existingLead = null;

    if (session && session.leadId) {
      leadId = session.leadId;
      leadName = session.name || "Customer";
      const crmInfo = await getLeadCrmInfo(leadId);
      if (crmInfo) {
        isMuted = crmInfo.botMuted;
        leadName = crmInfo.name || leadName;
        leadStatus = crmInfo.status;
        leadAssignedTo = crmInfo.assignedTo;
        leadAssignedToName = crmInfo.assignedToName;
      }
    } else {
      existingLead = await findExistingLead(from);
      if (existingLead) {
        leadId = existingLead.id;
        isMuted = existingLead.botMuted || false;
        leadName = existingLead.name;
        leadStatus = existingLead.status;
        leadAssignedTo = existingLead.assignedTo;
        leadAssignedToName = existingLead.assignedToName;
      }
    }

    // ── Auto Chatbot OFF ──────────────────────────────────────────────────────
    // The early return is the existing rule that keeps the bot silent once a
    // human has taken over (`/api/whatsapp` sets `botMuted` on any staff reply),
    // and it is deliberately untouched: nothing is sent back to the lead here.
    //
    // What is new is that the stored message is now also handed to a human. The
    // notification write is idempotent on the WhatsApp message id, so a webhook
    // retry cannot produce a second one.
    /**
     * ── Master switch ────────────────────────────────────────────────────────
     * "Automation OFF" in the CRM. Treated exactly like a muted lead: the
     * message is stored and raised to a human, and the bot says nothing. It is
     * not an outage — turning it back on resumes the conversation from wherever
     * the customer left it, because the session is untouched here.
     */
    if (!config.automationEnabled) {
      await saveWAMessage(from, displayText, 'customer', leadName, leadId, mediaType, mediaUrl, filename, mediaId);
      pendingPromises.push(
        createWaIncomingNotification({
          messageId: msgId,
          leadId,
          leadName,
          phone: from,
          message: displayText,
          mediaType,
          leadStatus,
          assignedTo: leadAssignedTo,
          assignedToName: leadAssignedToName,
          receivedAt: messageReceivedAt(msg.timestamp),
        })
      );
      return NextResponse.json({ ok: true });
    }

    if (isMuted) {
      await saveWAMessage(from, displayText, 'customer', leadName, leadId, mediaType, mediaUrl, filename, mediaId);
      pendingPromises.push(
        createWaIncomingNotification({
          messageId: msgId,
          leadId,
          leadName,
          phone: from,
          message: displayText,
          mediaType,
          leadStatus,
          assignedTo: leadAssignedTo,
          assignedToName: leadAssignedToName,
          receivedAt: messageReceivedAt(msg.timestamp),
        })
      );
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
        const lang = LANG_NAME_TO_CODE[leadLang] || "mr";
        
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
        await saveWAMessage(from, displayText, 'customer', lead.name, lead.id, mediaType, mediaUrl, filename, mediaId);
        
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
        language: "mr",
        responses: initialResponses
      });

      // Create initial lead record immediately (with phone and referral details)
      const newLeadId = await createLead({
        phone: from,
        source: referral ? `Meta Ads - ${referral.headline}` : 'WhatsApp Automation',
        category: 'Whatsapp ads',
        details: initialDetails,
        language: 'Marathi',
        ...initialResponses
      }, pendingPromises);

      // Log incoming customer message linked to new lead
      await saveWAMessage(from, displayText, 'customer', 'Customer', newLeadId, mediaType, mediaUrl, filename, mediaId);

      const welcomeMsg = say(botMessages, "welcome", "mr");
      await sendWA(from, welcomeMsg, newLeadId);
      await saveSession(from, { step: 2, category: '', name: '', responses: initialResponses, language: 'mr', leadId: newLeadId });
      return NextResponse.json({ ok: true });
    }

    const lang = session.language || 'mr';
    
    // Log incoming message for existing session
    await saveWAMessage(from, displayText, 'customer', session.name || 'Customer', session.leadId, mediaType, mediaUrl, filename, mediaId);

    // ── Step 99: Existing Lead Support Mode ──
    if (session.step === 99) {
      const restartKeywords = ["new loan", "apply", "start again", "restart", "नवीन कर्ज", "नया लोन", "आवेदन", "पुन्हा सुरू करा"];
      if (restartKeywords.some(kw => text.toLowerCase().includes(kw))) {
        await deleteSession(from);
        
        // Start fresh flow
        const leadId = await createLead({
          phone: from,
          source: 'WhatsApp Automation',
          category: 'Whatsapp ads',
          details: generateDetailsText({ name: "", category: "", language: "mr", responses: {} }),
          language: 'Marathi'
        }, pendingPromises);
        
        const welcomeMsg = say(botMessages, "welcome", "mr");
        await sendWA(from, welcomeMsg, leadId);
        await saveSession(from, { step: 2, category: '', name: '', responses: {}, language: 'mr', leadId });
        return NextResponse.json({ ok: true });
      }

      // Parse request using the local AI/loan info responder
      const aiReply = localLoanAIResponder(text, lang);
      
      const followUpText = ( {
        en: `\n\nIs there anything else I can help you with? (Or reply *new loan* to apply again)`,
        hi: `\n\nक्या मैं आपकी किसी और चीज़ में सहायता कर सकता हूँ? (या दोबारा आवेदन करने के लिए *new loan* लिखें)`,
        mr: `\n\nमी तुम्हाला अजून काही मदत करू शकतो का? (किंवा नवीन कर्जासाठी *new loan* लिहा)`
      } as Record<string, string> )[lang] || `\n\nNeed any more help?`;

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
      const askNameText = say(botMessages, "askName", selectedLang);

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
      // Limit to first 4 words to handle potential automated away/auto-responses
      const nameWords = text.trim().split(/\s+/);
      const name = nameWords.slice(0, 4).join(" ");
      
      const detailsText = generateDetailsText({
        name: name,
        category: "",
        language: lang,
        responses: session.responses
      });

      await updateLead(session.leadId, { name, details: detailsText });

      const catPayload = getCategoryListPayload(config, lang, name);
      await sendWA(from, catPayload, session.leadId);
      await saveSession(from, { ...session, step: 3, name });
      return NextResponse.json({ ok: true });
    }

    // ── Step 3: Got category number ──
    if (session.step === 3) {
      // Positions in the menu the customer was actually shown — the enabled
      // flows, in the Admin's order.
      const offered = menuFlows(config);
      const num = parseInt(text) - 1;
      if (isNaN(num) || num < 0 || num >= offered.length) {
        const aiReply = localLoanAIResponder(text, lang);
        await sendWA(from, aiReply, session.leadId);
        await sendWA(from, getCategoryListPayload(config, lang, session.name), session.leadId);
        return NextResponse.json({ ok: true });
      }
      const selectedFlow = offered[num];
      const category = selectedFlow.category;
      const categoryLocalized = pick(selectedFlow.label, lang) || category;
      
      const detailsText = generateDetailsText({
        name: session.name,
        category: category,
        language: lang,
        responses: session.responses
      });

      await updateLead(session.leadId, {
        type: category,
        details: detailsText
      });

      // The flow's own opener where it has one, the shared intro otherwise.
      const introText = (
        pick(selectedFlow.intro, lang) || say(botMessages, "catIntro", lang)
      ).replace(/\{category\}/g, categoryLocalized);

      const steps = selectedFlow.steps;
      // Not `steps[0]`: a question this conversation has already answered is
      // skipped, so the step recorded below is the one actually being asked.
      const firstIndex = nextStepIndex(steps, 0, session.responses);

      if (firstIndex === -1) {
        await sendWA(from, introText, session.leadId);
        await completeQualification(from, config, { ...session, category }, lang);
        return NextResponse.json({ ok: true });
      }

      const questionPayload = getQuestionPayload(botMessages, lang, steps[firstIndex]);
      if (typeof questionPayload === 'string') {
        await sendWA(from, `${introText}\n\nQ${firstIndex + 1}: ${questionPayload}`, session.leadId);
      } else {
        await sendWA(from, introText, session.leadId);
        await sendWA(from, questionPayload, session.leadId);
      }

      await saveSession(from, { ...session, step: 4 + firstIndex, category });
      return NextResponse.json({ ok: true });
    }

    // ── Step 4+: Flow questions ──
    if (session.step >= 4) {
      const activeFlow = flowByCategory(config, session.category);
      // The product was removed from the CRM while this conversation was live.
      if (!activeFlow) {
        await sendWA(from, say(botMessages, "errorWarn", lang), session.leadId);
        await deleteSession(from);
        return NextResponse.json({ ok: true });
      }
      const flow = activeFlow.steps;

      const questionIndex = session.step - 4;
      const currentQ = flow[questionIndex];

      if (!currentQ) {
        await deleteSession(from);
        return NextResponse.json({ ok: true });
      }

      const customerName = session.name || "Sir/Madam";

      // Check option index or use local natural-language classification
      let answer = text;
      let isClassified = false;
      if (currentQ.type === 'dropdown' && currentQ.options && currentQ.options.length > 0) {
        const options = currentQ.options;
        const num = parseInt(text) - 1;
        if (!isNaN(num) && num >= 0 && num < options.length) {
          answer = options[num].value;
          isClassified = true;
        } else {
          const localClassified = localClassifyDropdown(text, currentQ, lang);
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
        await sendWA(from, getQuestionPayload(botMessages, lang, currentQ), session.leadId);
        return NextResponse.json({ ok: true });
      }

      const updatedResponses = { ...session.responses, [currentQ.field]: answer };

      /**
       * Resolved inline rather than in the background, so the location lands in
       * the same single write as the answer — two writes would race, and the
       * summary text below has to already contain the location. `lookupPincode`
       * carries its own timeout for exactly this reason.
       */
      let locationFields: Record<string, string> = {};
      if (currentQ.field === 'pincode') {
        locationFields = await resolvePincodeFields(answer, updatedResponses);

        /**
         * A PIN code that does not resolve gets one more chance, and only one.
         * The customer may well have mistyped it — but India Post going down
         * looks identical from here, and looping on that would trap them in the
         * flow forever. A second failure is accepted as typed and the
         * conversation moves on with the raw value.
         *
         * The rejected value is deliberately kept out of the saved session: if
         * it were stored, the PIN code step's `isEmpty` condition would treat
         * the question as answered and skip the retry it just asked for.
         */
        if (Object.keys(locationFields).length === 0) {
          const tries = Number(session.responses._pincodeTries || "0");
          if (tries < 1) {
            await sendWA(from, say(botMessages, "badPincode", lang), session.leadId);
            await saveSession(from, {
              ...session,
              responses: { ...session.responses, _pincodeTries: String(tries + 1) }
            });
            return NextResponse.json({ ok: true });
          }
        }
      }

      /** Answers that settle a second field as well as their own. */
      const derivedFields: Record<string, string> = {};
      if (currentQ.field === 'cibilScoreAvailable' && answer === 'No') {
        // "I don't know it" is itself the answer. Recording that beats a blank
        // field, which reads as "nobody asked".
        derivedFields.cibilScore = 'Not Available';
        updatedResponses.cibilScore = 'Not Available';
      }

      const detailsText = generateDetailsText({
        name: session.name,
        category: session.category,
        language: lang,
        responses: updatedResponses
      });

      await updateLead(session.leadId, {
        [currentQ.field]: answer,
        // After the raw answer: a resolved code replaces "४३१ ००१" with "431001".
        ...locationFields,
        ...derivedFields,
        details: detailsText
      });

      /**
       * ── Cash income: Loan Against Property, or the end of the road ──
       *
       * Cash income rarely clears a Personal Loan, but the customer is not
       * dismissed over it. Either way the Personal Loan flow stops here.
       */
      if (currentQ.field === 'lapInterest') {
        if (answer === 'Yes') {
          const lapCategory = 'Loan Against Property';
          const lapFlow = flowByCategory(config, lapCategory);
          // An Admin may have removed the product this branch hands over to.
          if (!lapFlow) {
            await completeQualification(
              from,
              config,
              { ...session, responses: updatedResponses },
              lang
            );
            return NextResponse.json({ ok: true });
          }

          await updateLead(session.leadId, { type: lapCategory });
          await sendWA(from, say(botMessages, "switchToLap", lang), session.leadId);

          // The existing LAP flow, entered unchanged — skipping whatever it
          // asks that this conversation has already covered.
          const firstIndex = nextStepIndex(lapFlow.steps, 0, updatedResponses);
          const lapSession = { ...session, category: lapCategory, responses: updatedResponses };

          if (firstIndex === -1) {
            await completeQualification(from, config, lapSession, lang);
          } else {
            await sendQuestion(from, botMessages, lang, lapFlow.steps[firstIndex], firstIndex, session.leadId);
            await saveSession(from, { ...lapSession, step: 4 + firstIndex });
          }
          return NextResponse.json({ ok: true });
        }

        // Declined. The lead is closed explicitly rather than left sitting in
        // "New Lead" for a telecaller to chase pointlessly.
        await updateLead(session.leadId, {
          status: 'Rejected',
          rejectionReason: 'Cash income — declined Loan Against Property',
          qualificationDetails: qualificationSummary(updatedResponses),
          statusUpdatedAt: new Date().toISOString()
        });
        await sendWA(from, say(botMessages, "notEligible", lang, { name: customerName }), session.leadId);
        await deleteSession(from);
        return NextResponse.json({ ok: true });
      }

      const nextIndex = nextStepIndex(flow, questionIndex + 1, updatedResponses);

      if (nextIndex !== -1) {
        await sendQuestion(from, botMessages, lang, flow[nextIndex], nextIndex, session.leadId);
        await saveSession(from, { ...session, step: 4 + nextIndex, responses: updatedResponses });
      } else {
        await completeQualification(from, config, { ...session, responses: updatedResponses }, lang);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Facebook
  }
}

export async function POST(request: Request) {
  const pendingPromises: Promise<any>[] = [];
  try {
    const response = await handleWebhookRequest(request, pendingPromises);
    if (pendingPromises.length > 0) {
      await Promise.all(pendingPromises).catch(err => console.error("Error awaiting background tasks in webhook POST:", err));
    }
    return response;
  } catch (error: any) {
    console.error("Top-level webhook POST handler error:", error);
    if (pendingPromises.length > 0) {
      await Promise.all(pendingPromises).catch(err => console.error("Error awaiting background tasks in webhook POST error fallback:", err));
    }
    return NextResponse.json({ ok: true });
  }
}
