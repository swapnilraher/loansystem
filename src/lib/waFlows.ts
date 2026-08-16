/**
 * The WhatsApp bot's questions and messages, as data.
 *
 * Until now the bot's flows lived as `const LOAN_FLOWS` inside the webhook, with
 * conditions written as JavaScript arrow functions. That made them unreachable
 * from the CRM: changing a single question meant a code deploy. Everything here
 * is JSON-serialisable so an Admin can edit it from `/admin/integrations/all-auto-chatting`
 * and the webhook can read it straight out of Firestore.
 *
 * The values below are the *defaults*. They are what the bot runs when nothing
 * has been saved in Firestore — byte-for-byte the flows that were hardcoded — so
 * an empty `waFlows` collection behaves exactly like the old build, and a
 * Firestore outage degrades to the old build rather than to silence.
 *
 * Imported by both the webhook (server) and the flow editor (browser), so it
 * must stay free of Node and Firebase imports.
 */

export type Lang = "en" | "hi" | "mr"

export const LANGS: Lang[] = ["en", "hi", "mr"]

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  hi: "हिंदी (Hindi)",
  mr: "मराठी (Marathi)",
}

/** A message in each language. Missing languages fall back to `en`, then `mr`. */
export type Localized = Partial<Record<Lang, string>>

/**
 * Whether a step is asked at all.
 *
 * The predicate replaced the old `askWhen` arrow functions, which could not be
 * stored or edited. Four conditions cover every branch the flows use today; the
 * evaluator below treats an unknown operator as "ask it", because skipping a
 * question the Admin did not mean to skip is the worse failure.
 */
export interface FlowCondition {
  /** Another step's `field`, or any answer already collected. */
  field: string
  op: "equals" | "notEquals" | "isEmpty" | "isNotEmpty"
  /** Compared against for `equals` / `notEquals`. */
  value?: string
}

export interface FlowOption {
  /** What gets written to the lead. Kept in English — the CRM reads these. */
  value: string
  /** What the customer sees, per language. */
  label: Localized
  /** Second line on a list row, for labels too long to fit the title. */
  description?: Localized
}

export type StepType = "text" | "number" | "dropdown"

export interface FlowStep {
  id: string
  /** Lead document field this answer is saved to. */
  field: string
  type: StepType
  question: Localized
  options?: FlowOption[]
  condition?: FlowCondition | null
}

export interface WaFlow {
  /** Firestore document id. Defaults use a stable slug. */
  id: string
  /** Canonical product name — written to `lead.type`, matched by the CRM. */
  category: string
  /** Menu label per language. */
  label: Localized
  /** Position in the product menu. */
  order: number
  enabled: boolean
  /** Opening line, sent before the first question. Falls back to `catIntro`. */
  intro?: Localized
  steps: FlowStep[]
}

/**
 * Bot messages that are not part of any one flow.
 *
 * Every key is editable from the CRM. `{name}` and `{category}` are substituted
 * by the webhook, which is why the editor shows them as available tokens.
 */
export interface WaMessages {
  welcome: Localized
  askName: Localized
  catIntro: Localized
  chooseProduct: Localized
  thankYouSoon: Localized
  thankYouTomorrow: Localized
  thankYouThisMorning: Localized
  notEligible: Localized
  switchToLap: Localized
  badPincode: Localized
  errorWarn: Localized
  pickOption: Localized
}

export type MessageKey = keyof WaMessages

export interface WaFlowConfig {
  flows: WaFlow[]
  messages: WaMessages
  /** Master switch. Off = the bot stops answering and staff handle the inbox. */
  automationEnabled: boolean
}

// ─── Defaults ────────────────────────────────────────────────────────────────

/**
 * Asked first in every flow, because the answer is what resolves the lead's
 * State and District (see `lookupPincode`) — and those are what the CRM's banker
 * assignment auto-selects from. A lead with no PIN code gets no bankers.
 *
 * Never asked twice: a customer moved from Personal Loan to Loan Against
 * Property mid-conversation has already given it.
 */
const pincodeStep = (question: Localized): FlowStep => ({
  id: "pincode",
  field: "pincode",
  type: "number",
  condition: { field: "pincode", op: "isEmpty" },
  question,
})

const YES_NO: FlowOption[] = [
  { value: "Yes", label: { en: "Yes", hi: "हाँ (Yes)", mr: "होय (Yes)" } },
  { value: "No", label: { en: "No", hi: "नहीं (No)", mr: "नाही (No)" } },
]

const EMPLOYMENT_OPTIONS: FlowOption[] = [
  { value: "Salaried", label: { en: "Salaried", hi: "वेतनभोगी (Salaried)", mr: "पगारदार (Salaried)" } },
  { value: "Self Employed", label: { en: "Self Employed", hi: "स्व-व्यवसायी", mr: "स्वयंरोजगार" } },
]

const OCCUPATION_OPTIONS: FlowOption[] = [
  { value: "Job", label: { en: "Job", hi: "नौकरी (Job)", mr: "नोकरी (Job)" } },
  { value: "Business", label: { en: "Business", hi: "व्यवसाय (Business)", mr: "व्यवसाय (Business)" } },
]

const OCCUPATION_QUESTION: Localized = {
  en: "Are you employed (Job) or self-employed / running a business?",
  hi: "क्या आप नौकरी (Job) करते हैं या व्यवसाय (Business) करते हैं?",
  mr: "आपण नोकरी करता की व्यवसाय?",
}

const EMPLOYMENT_QUESTION: Localized = {
  en: "Are you Salaried or Self Employed?",
  hi: "क्या आप वेतनभोगी (Salaried) हैं या स्व-व्यवसायी (Self Employed)?",
  mr: "तुम्ही पगारदार (Salaried) आहात की स्वयंरोजगार (Self Employed)?",
}

const MONTHLY_INCOME_QUESTION: Localized = {
  en: "What is your monthly income? (in ₹)",
  hi: "आपकी मासिक आय (Monthly Income) कितनी है? (₹ में)",
  mr: "तुमचे मासिक उत्पन्न किती आहे? (₹ मध्ये)",
}

const PROPERTY_CITY_QUESTION: Localized = {
  en: "Which city is the property located in?",
  hi: "संपत्ति (Property) किस शहर में स्थित है?",
  mr: "मालमत्ता (Property) कोणत्या शहरात आहे?",
}

const LOAN_AMOUNT_QUESTION: Localized = {
  en: "How much loan amount do you require? (in ₹)",
  hi: "आपको कितने लोन की आवश्यकता है? (₹ में)",
  mr: "तुम्हाला किती लोन हवे आहे? (₹ मध्ये)",
}

const EXISTING_EMI_QUESTION: Localized = {
  en: "Do you currently have any active Loan or EMI?",
  hi: "क्या इस समय आपका कोई लोन या EMI चालू है?",
  mr: "सध्या आपले कोणते Loan किंवा EMI सुरू आहेत का?",
}

const GENERIC_PINCODE_QUESTION: Localized = {
  en: "Please enter your 6-digit Pincode (e.g. 411001):",
  hi: "कृपया अपना 6-अंकों का पिनकोड दर्ज करें (उदा. 411001):",
  mr: "कृपया तुमचा ६ अंकी पिनकोड (Pincode) टाका (उदा. ४११००१):",
}

export const DEFAULT_FLOWS: WaFlow[] = [
  {
    id: "home-loan",
    category: "Home Loan",
    label: { en: "Home Loan", hi: "होम लोन", mr: "होम लोन" },
    order: 1,
    enabled: true,
    intro: {
      en: "Hello Sir/Madam 🙏\n\nWe need a little information to process your *Home Loan* request. It is only a few quick questions.",
      hi: "नमस्कार सर/मैडम 🙏\n\nआपके *होम लोन* अनुरोध को आगे बढ़ाने के लिए हमें थोड़ी जानकारी चाहिए। बस कुछ छोटे सवाल हैं।",
      mr: "नमस्कार सर/मॅडम 🙏\n\nतुमच्या *होम लोन* अर्जासाठी आम्हाला थोडी माहिती हवी आहे. फक्त काही छोटे प्रश्न आहेत.",
    },
    /**
     * The customer's name is not a step — the bot collects it before the product
     * menu, and asking twice reads as a broken bot. `city`, `state` and district
     * are not asked either: the PIN code resolves all three.
     */
    steps: [
      pincodeStep({
        en: "What is the PIN Code of the place where you are buying or constructing the house / flat / property? (e.g. 411001)",
        hi: "आप जहाँ घर/फ्लैट/प्रॉपर्टी खरीद रहे हैं या बनाने वाले हैं, उस जगह का PIN Code क्या है? (उदा. 411001)",
        mr: "आपण जिथे घर/फ्लॅट/Property घेत आहात किंवा बांधणार आहात, त्या ठिकाणचा PIN Code काय आहे? (उदा. ४११००१)",
      }),
      {
        id: "occupation",
        field: "occupation",
        type: "dropdown",
        options: OCCUPATION_OPTIONS,
        question: OCCUPATION_QUESTION,
      },
      {
        id: "homeLoanPurpose",
        field: "homeLoanPurpose",
        type: "dropdown",
        question: {
          en: "What do you need the Home Loan for?",
          hi: "आपको होम लोन किस लिए चाहिए?",
          mr: "आपल्याला Home Loan कशासाठी पाहिजे?",
        },
        options: [
          { value: "New Home Purchase", label: { en: "🏠 New Home Purchase", hi: "🏠 नया घर खरीदना", mr: "🏠 नवीन घर खरेदी" } },
          { value: "House Construction", label: { en: "🧱 House Construction", hi: "🧱 घर बनवाना", mr: "🧱 घर बांधकाम" } },
          { value: "Flat Purchase", label: { en: "🏢 Flat Purchase", hi: "🏢 घर/फ्लैट खरीदना", mr: "🏢 घर/फ्लॅट खरेदी" } },
          {
            value: "Balance Transfer",
            label: { en: "🔄 Balance Transfer", hi: "🔄 बैलेंस ट्रांसफर", mr: "🔄 बॅलन्स ट्रान्सफर" },
            description: {
              en: "Home Loan Balance Transfer",
              hi: "होम लोन बैलेंस ट्रांसफर",
              mr: "Home Loan Balance Transfer",
            },
          },
          { value: "Top-Up Loan", label: { en: "➕ Top-Up Loan", hi: "➕ टॉप-अप लोन", mr: "➕ टॉप-अप लोन" } },
        ],
      },
      {
        id: "propertyValue",
        field: "propertyValue",
        type: "number",
        question: {
          en: "What is the approximate value of the property you are buying or constructing? (in ₹)",
          hi: "आप जो प्रॉपर्टी खरीद रहे हैं या बना रहे हैं, उसकी अनुमानित कीमत कितनी है? (₹ में)",
          mr: "आपण घेत असलेल्या/बांधत असलेल्या Property ची अंदाजे किंमत किती आहे? (₹ मध्ये)",
        },
      },
      {
        id: "existingLoanEmi",
        field: "existingLoanEmi",
        type: "dropdown",
        options: YES_NO,
        question: EXISTING_EMI_QUESTION,
      },
      {
        id: "existingLoanDetails",
        field: "existingLoanDetails",
        type: "text",
        condition: { field: "existingLoanEmi", op: "equals", value: "Yes" },
        question: {
          en: "Please share the basic details of your existing Loan / EMI (bank name, loan type, monthly EMI):",
          hi: "कृपया अपने चालू लोन / EMI की बुनियादी जानकारी दें (बैंक का नाम, लोन का प्रकार, मासिक EMI):",
          mr: "कृपया आपल्या सुरू असलेल्या Loan / EMI ची थोडक्यात माहिती द्या (बँकेचे नाव, कर्जाचा प्रकार, मासिक EMI):",
        },
      },
    ],
  },
  {
    id: "personal-loan",
    category: "Personal Loan",
    label: { en: "Personal Loan", hi: "पर्सनल लोन", mr: "पर्सनल लोन" },
    order: 2,
    enabled: true,
    intro: {
      en: "Hello Sir/Madam 🙏\n\nWe need a little information to process your *Personal Loan* request. It is only a few quick questions.",
      hi: "नमस्कार सर/मैडम 🙏\n\nआपके *पर्सनल लोन* अनुरोध को आगे बढ़ाने के लिए हमें थोड़ी जानकारी चाहिए। बस कुछ छोटे सवाल हैं।",
      mr: "नमस्कार सर/मॅडम 🙏\n\nतुमच्या *पर्सनल लोन* अर्जासाठी आम्हाला थोडी माहिती हवी आहे. फक्त काही छोटे प्रश्न आहेत.",
    },
    /**
     * Branches: cash income diverts to Loan Against Property or ends the
     * conversation, and the CIBIL number is only asked of customers who say they
     * know it. Both branches are `condition`s now rather than code.
     */
    steps: [
      pincodeStep(GENERIC_PINCODE_QUESTION),
      {
        id: "occupation",
        field: "occupation",
        type: "dropdown",
        options: OCCUPATION_OPTIONS,
        question: {
          en: "Are you employed (Job) or self-employed / running a business?",
          hi: "क्या आप नौकरी (Job) करते हैं या स्व-व्यवसाय (Business) करते हैं?",
          mr: "तुम्ही नोकरी (Job) करता की स्वतःचा व्यवसाय (Business) करता?",
        },
      },
      {
        id: "incomePaymentMode",
        field: "incomePaymentMode",
        type: "dropdown",
        options: [
          { value: "Bank Account", label: { en: "Bank Account", hi: "बैंक खाते में", mr: "बँक खात्यात" } },
          { value: "Cash Payment", label: { en: "Cash Payment", hi: "नकद (Cash)", mr: "रोख (Cash)" } },
        ],
        question: {
          en: "Is your monthly income credited to your Bank Account, or received as Cash Payment?",
          hi: "आपकी मासिक आय बैंक खाते (Bank Account) में आती है या नकद (Cash Payment) मिलती है?",
          mr: "तुमचे मासिक उत्पन्न बँक खात्यात (Bank Account) जमा होते की रोख (Cash Payment) मिळते?",
        },
      },
      {
        // Cash income rarely clears a Personal Loan, but it does not end the
        // conversation: a customer with property is a Loan Against Property lead.
        id: "lapInterest",
        field: "lapInterest",
        type: "dropdown",
        options: YES_NO,
        condition: { field: "incomePaymentMode", op: "equals", value: "Cash Payment" },
        question: {
          en: "Sir, a Personal Loan may not be possible when income is received in cash. If you own a Property, you may be eligible for a Loan Against Property. Would you like information about it?",
          hi: "सर, नकद आय होने पर पर्सनल लोन संभव नहीं हो सकता। लेकिन यदि आपके पास संपत्ति (Property) है, तो आप प्रॉपर्टी पर लोन के लिए पात्र हो सकते हैं। क्या आप इसकी जानकारी चाहेंगे?",
          mr: "सर, उत्पन्न रोख स्वरूपात मिळत असेल तर पर्सनल लोन शक्य होणार नाही. परंतु तुमच्याकडे मालमत्ता (Property) असेल, तर तुम्ही प्रॉपर्टीवर लोनसाठी पात्र ठरू शकता. तुम्हाला याबद्दल माहिती हवी आहे का?",
        },
      },
      {
        id: "existingLoanEmi",
        field: "existingLoanEmi",
        type: "dropdown",
        options: YES_NO,
        question: {
          en: "Do you currently have any active Loan or EMI?",
          hi: "क्या आपका कोई लोन या EMI अभी चालू है?",
          mr: "तुमचे सध्या कोणतेही लोन किंवा EMI चालू आहे का?",
        },
      },
      {
        id: "cibilScoreAvailable",
        field: "cibilScoreAvailable",
        type: "dropdown",
        options: YES_NO,
        question: {
          en: "Do you know your CIBIL Score?",
          hi: "क्या आपको अपना सिबिल स्कोर (CIBIL Score) पता है?",
          mr: "तुम्हाला तुमचा सिबिल स्कोर (CIBIL Score) माहीत आहे का?",
        },
      },
      {
        id: "cibilScore",
        field: "cibilScore",
        type: "number",
        condition: { field: "cibilScoreAvailable", op: "equals", value: "Yes" },
        question: {
          en: "Please provide your CIBIL Score.",
          hi: "कृपया अपना सिबिल स्कोर बताएं।",
          mr: "कृपया तुमचा सिबिल स्कोर सांगा.",
        },
      },
    ],
  },
  {
    id: "business-loan",
    category: "Business Loan",
    label: { en: "Business Loan", hi: "बिजनेस लोन", mr: "बिझनेस लोन" },
    order: 3,
    enabled: true,
    steps: [
      pincodeStep(GENERIC_PINCODE_QUESTION),
      {
        id: "businessName",
        field: "businessName",
        type: "text",
        question: {
          en: "What is your business name?",
          hi: "आपके व्यवसाय/कंपनी का नाम क्या है?",
          mr: "तुमच्या व्यवसायाचे/कंपनीचे नाव काय आहे?",
        },
      },
      {
        id: "businessVintage",
        field: "businessVintage",
        type: "text",
        question: {
          en: "How long has your business been running? (e.g. 3 years)",
          hi: "आपका व्यवसाय कितने समय से चल रहा है? (जैसे: 3 वर्ष)",
          mr: "तुमचा व्यवसाय किती वर्षांपासून चालू आहे? (उदा. ३ वर्षे)",
        },
      },
      {
        id: "annualTurnover",
        field: "annualTurnover",
        type: "number",
        question: {
          en: "What is your annual turnover? (in ₹)",
          hi: "आपका वार्षिक टर्नओवर (Annual Turnover) कितना है? (₹ में)",
          mr: "तुमचा वार्षिक टर्नओवर (Annual Turnover) किती आहे? (₹ मध्ये)",
        },
      },
      {
        id: "loanAmount",
        field: "loanAmount",
        type: "number",
        question: LOAN_AMOUNT_QUESTION,
      },
    ],
  },
  {
    id: "loan-against-property",
    category: "Loan Against Property",
    label: { en: "Loan Against Property", hi: "प्रॉपर्टी पर लोन", mr: "प्रॉपर्टीवर लोन" },
    order: 4,
    enabled: true,
    steps: [
      pincodeStep(GENERIC_PINCODE_QUESTION),
      {
        id: "propertyValue",
        field: "propertyValue",
        type: "number",
        question: {
          en: "What is the approximate value of your property? (in ₹)",
          hi: "आपकी संपत्ति का अनुमानित मूल्य क्या है? (₹ में)",
          mr: "तुमच्या मालमत्तेचे अंदाजे मूल्य किती आहे? (₹ मध्ये)",
        },
      },
      { id: "city", field: "city", type: "text", question: PROPERTY_CITY_QUESTION },
      { id: "loanAmount", field: "loanAmount", type: "number", question: LOAN_AMOUNT_QUESTION },
      {
        id: "employmentType",
        field: "employmentType",
        type: "dropdown",
        options: EMPLOYMENT_OPTIONS,
        question: EMPLOYMENT_QUESTION,
      },
    ],
  },
  {
    id: "credit-card",
    category: "Credit Card",
    label: { en: "Credit Card", hi: "क्रेडिट कार्ड", mr: "क्रेडिट कार्ड" },
    order: 5,
    enabled: true,
    steps: [
      pincodeStep(GENERIC_PINCODE_QUESTION),
      { id: "monthlyIncome", field: "monthlyIncome", type: "number", question: MONTHLY_INCOME_QUESTION },
      {
        id: "employmentType",
        field: "employmentType",
        type: "dropdown",
        options: EMPLOYMENT_OPTIONS,
        question: EMPLOYMENT_QUESTION,
      },
    ],
  },
  {
    id: "insurance",
    category: "Insurance",
    label: { en: "Insurance", hi: "बीमा", mr: "विमा" },
    order: 6,
    enabled: true,
    steps: [
      pincodeStep(GENERIC_PINCODE_QUESTION),
      {
        id: "insuranceType",
        field: "insuranceType",
        type: "dropdown",
        options: [
          { value: "Life Insurance", label: { en: "Life Insurance", hi: "जीवन बीमा", mr: "जीवन विमा" } },
          { value: "Health Insurance", label: { en: "Health Insurance", hi: "स्वास्थ्य बीमा", mr: "आरोग्य विमा" } },
          { value: "Vehicle Insurance", label: { en: "Vehicle Insurance", hi: "वाहन बीमा", mr: "वाहन विमा" } },
        ],
        question: {
          en: "What type of insurance are you looking for?",
          hi: "आप किस प्रकार का बीमा (Insurance) चाहते हैं?",
          mr: "तुम्हाला कोणत्या प्रकारचा विमा (Insurance) हवा आहे?",
        },
      },
      {
        id: "age",
        field: "age",
        type: "number",
        question: {
          en: "What is your age?",
          hi: "आपकी उम्र (Age) क्या है?",
          mr: "तुमचे वय (Age) किती आहे?",
        },
      },
    ],
  },
]

const WELCOME_MR =
  "👋 *TechStar Money Solutions मध्ये आपले स्वागत आहे!* \n\nआम्ही market मधील top banks आणि NBFCs सोबत official partner आहोत. आम्ही तुमची profile बघून कोणती बँक किंवा NBFC तुम्हाला जास्तीत जास्त (maximum) loan, कमीत कमी (minimum) interest rate मध्ये देऊ शकते, हे शोधून देतो.\n\nतुमच्यासाठी सर्वोत्तम लोन ऑफर्स शोधण्यासाठी, कृपया तुमचे *पूर्ण नाव (Full Name)* टाईप करा:"

export const DEFAULT_MESSAGES: WaMessages = {
  welcome: {
    en: "👋 *Welcome to TechStar Money Solutions!*\n\nWe are official partners of the top banks and NBFCs in the market. We look at your profile and find which bank or NBFC can give you the maximum loan at the minimum interest rate.\n\nTo find the best offers for you, please type your *Full Name*:",
    hi: "👋 *TechStar Money Solutions में आपका स्वागत है!*\n\nहम मार्केट के टॉप बैंकों और NBFC के आधिकारिक पार्टनर हैं। हम आपकी प्रोफाइल देखकर बताते हैं कि कौन सा बैंक या NBFC आपको सबसे ज़्यादा लोन, सबसे कम ब्याज दर पर दे सकता है।\n\nआपके लिए सबसे अच्छे ऑफर ढूंढने के लिए, कृपया अपना *पूरा नाम (Full Name)* टाइप करें:",
    mr: WELCOME_MR,
  },
  askName: {
    en: "Thank you! First, may I know your *full name*? 😊",
    hi: "धन्यवाद! सबसे पहले, क्या मैं आपका *पूरा नाम* जान सकता हूँ? 😊",
    mr: "धन्यवाद! सर्वात आधी, मला तुमचे *पूर्ण नाव* समजेल का? 😊",
  },
  catIntro: {
    en: "Great choice! You selected *{category}* 🎯\n\nLet me quickly collect some details to find the best offer for you.",
    hi: "बेहतरीन विकल्प! आपने *{category}* चुना है 🎯\n\nआइए आपके लिए सबसे अच्छा ऑफर ढूंढने के लिए कुछ विवरण एकत्र करें।",
    mr: "उत्तम पर्याय! तुम्ही *{category}* निवडले आहे 🎯\n\nतुमच्यासाठी सर्वोत्तम ऑफर शोधण्यासाठी काही माहिती गोळा करूया.",
  },
  chooseProduct: {
    en: "Nice to meet you, *{name}*! 🎉\n\nPlease select the loan product you are interested in:",
    hi: "आपसे मिलकर अच्छा लगा, *{name}*! 🎉\n\nकृपया उस लोन प्रकार को चुनें जिसमें आपकी रुचि है:",
    mr: "तुम्हाला भेटून आनंद झाला, *{name}*! 🎉\n\nकृपया तुम्हाला हव्या असलेल्या लोन प्रकारची निवड करा:",
  },
  thankYouSoon: {
    en: "✅ *Thank you, {name}!*\n\nWe've received all your details for *{category}*. 📋\n\nOur loan expert will contact you within *15 minutes* with the best options tailored just for you! 🚀\n\n_TechStar Money Solutions_\n📞 *7020646007*",
    hi: "✅ *धन्यवाद, {name}!*\n\nहमें *{category}* के लिए आपके सभी विवरण प्राप्त हो गए हैं। 📋\n\nहमारे लोन एक्सपर्ट अगले *15 मिनट* में आपसे संपर्क करेंगे! 🚀\n\n_TechStar Money Solutions_\n📞 *7020646007*",
    mr: "✅ *धन्यवाद, {name}!*\n\nआम्हाला *{category}* साठी तुमची सर्व माहिती मिळाली आहे. 📋\n\nआमचे लोन एक्सपर्ट पुढील *१५ मिनिटांत* तुमच्याशी संपर्क साधतील! 🚀\n\n_TechStar Money Solutions_\n📞 *७०२०६४६००७*",
  },
  thankYouTomorrow: {
    en: "✅ *Thank you, {name}!*\n\nWe've received all your details for *{category}*. 📋\n\nOur office hours have ended for today. Our staff will call you *tomorrow morning* to explain the next process and your eligibility. Please keep your phone available. 🌙\n\n_TechStar Money Solutions_\n📞 *7020646007*",
    hi: "✅ *धन्यवाद, {name}!*\n\nहमें *{category}* के लिए आपके सभी विवरण प्राप्त हो गए हैं। 📋\n\nआज के लिए हमारा ऑफिस समय समाप्त हो चुका है। हमारे स्टाफ *कल सुबह* आपको कॉल करके आगे की प्रक्रिया और आपकी पात्रता समझाएंगे। कृपया अपना फोन उपलब्ध रखें। 🌙\n\n_TechStar Money Solutions_\n📞 *7020646007*",
    mr: "✅ *धन्यवाद, {name}!*\n\nआम्हाला *{category}* साठी तुमची सर्व माहिती मिळाली आहे. 📋\n\nआजची आमची ऑफिसची वेळ संपली आहे. आमचे स्टाफ *उद्या सकाळी* तुम्हाला कॉल करून पुढील प्रक्रिया आणि तुमची पात्रता समजावून सांगतील. कृपया तुमचा फोन उपलब्ध ठेवा. 🌙\n\n_TechStar Money Solutions_\n📞 *७०२०६४६००७*",
  },
  thankYouThisMorning: {
    en: "✅ *Thank you, {name}!*\n\nWe've received all your details for *{category}*. 📋\n\nOur staff will call you *this morning, once office hours begin*, to explain the next process and your eligibility. Please keep your phone available. ☀️\n\n_TechStar Money Solutions_\n📞 *7020646007*",
    hi: "✅ *धन्यवाद, {name}!*\n\nहमें *{category}* के लिए आपके सभी विवरण प्राप्त हो गए हैं। 📋\n\nहमारे स्टाफ *आज सुबह ऑफिस शुरू होते ही* आपको कॉल करके आगे की प्रक्रिया और आपकी पात्रता समझाएंगे। कृपया अपना फोन उपलब्ध रखें। ☀️\n\n_TechStar Money Solutions_\n📞 *7020646007*",
    mr: "✅ *धन्यवाद, {name}!*\n\nआम्हाला *{category}* साठी तुमची सर्व माहिती मिळाली आहे. 📋\n\nआमचे स्टाफ *आज सकाळी ऑफिस सुरू होताच* तुम्हाला कॉल करून पुढील प्रक्रिया आणि तुमची पात्रता समजावून सांगतील. कृपया तुमचा फोन उपलब्ध ठेवा. ☀️\n\n_TechStar Money Solutions_\n📞 *७०२०६४६००७*",
  },
  notEligible: {
    en: "Thank you for your time, {name}. Based on the details you shared, we are unable to proceed with a Personal Loan at this stage.\n\nIf your situation changes, reply *Hi* any time and we will be glad to help.\n\n_TechStar Money Solutions_\n📞 *7020646007*",
    hi: "आपके समय के लिए धन्यवाद, {name}। आपके द्वारा दी गई जानकारी के आधार पर, हम इस समय पर्सनल लोन के लिए आगे नहीं बढ़ सकते।\n\nयदि आपकी स्थिति बदलती है, तो कभी भी *Hi* भेजें — हमें आपकी मदद करके खुशी होगी।\n\n_TechStar Money Solutions_\n📞 *7020646007*",
    mr: "तुमच्या वेळेबद्दल धन्यवाद, {name}. तुम्ही दिलेल्या माहितीनुसार, सध्या आम्ही पर्सनल लोनसाठी पुढे जाऊ शकत नाही.\n\nतुमची परिस्थिती बदलल्यास कधीही *Hi* पाठवा — आम्हाला मदत करण्यात आनंद होईल.\n\n_TechStar Money Solutions_\n📞 *७०२०६४६००७*",
  },
  switchToLap: {
    en: "Great — let's look at a *Loan Against Property* for you instead. 🏠\n\nJust a couple more questions:",
    hi: "बढ़िया — तो चलिए आपके लिए *प्रॉपर्टी पर लोन* देखते हैं। 🏠\n\nबस कुछ और सवाल:",
    mr: "उत्तम — मग तुमच्यासाठी *प्रॉपर्टीवर लोन* पाहूया. 🏠\n\nफक्त आणखी काही प्रश्न:",
  },
  badPincode: {
    en: "That PIN code does not look right. Please send your correct 6-digit PIN Code (e.g. 411001):",
    hi: "यह पिनकोड सही नहीं लग रहा। कृपया अपना सही 6-अंकों का पिनकोड भेजें (उदा. 411001):",
    mr: "हा पिनकोड बरोबर वाटत नाही. कृपया तुमचा बरोबर ६ अंकी पिनकोड पाठवा (उदा. ४११००१):",
  },
  errorWarn: {
    en: "Something went wrong. Please reply *Hi* to start again.",
    hi: "कुछ गलत हो गया। कृपया फिर से शुरू करने के लिए *Hi* भेजें।",
    mr: "काहीतरी त्रुटी आली. कृपया पुन्हा सुरू करण्यासाठी *Hi* पाठवा.",
  },
  pickOption: {
    en: "Select an option",
    hi: "विकल्प चुनें",
    mr: "पर्याय निवडा",
  },
}

/** Labels and help text for the message editor in the CRM. */
export const MESSAGE_META: { key: MessageKey; title: string; hint: string }[] = [
  { key: "welcome", title: "Welcome (first message)", hint: "Sent the moment a new number messages the bot. Ends by asking for the full name." },
  { key: "askName", title: "Ask for name", hint: "Used when the language menu is shown before the name is known." },
  { key: "chooseProduct", title: "Product menu", hint: "Body of the loan-product list. Tokens: {name}" },
  { key: "catIntro", title: "Default product intro", hint: "Used for any flow with no intro of its own. Tokens: {category}" },
  { key: "thankYouSoon", title: "Closing — office hours", hint: "Sent when the customer finishes between 10 AM and 6 PM IST. Tokens: {name}, {category}" },
  { key: "thankYouTomorrow", title: "Closing — after 6 PM", hint: "Promises a call tomorrow morning. Tokens: {name}, {category}" },
  { key: "thankYouThisMorning", title: "Closing — before 10 AM", hint: "Promises a call once the office opens. Tokens: {name}, {category}" },
  { key: "notEligible", title: "Not eligible", hint: "Cash income and the customer declined Loan Against Property. Tokens: {name}" },
  { key: "switchToLap", title: "Switched to Loan Against Property", hint: "Sent when a cash-income customer accepts the LAP route." },
  { key: "badPincode", title: "PIN code not recognised", hint: "Re-asked once when India Post cannot resolve the PIN code." },
  { key: "errorWarn", title: "Error", hint: "Sent when the session is in a state the bot cannot continue from." },
  { key: "pickOption", title: "List button label", hint: "Button text on question lists with more than 3 options. Keep under 20 characters." },
]

// ─── Reading the config ──────────────────────────────────────────────────────

/** The text for `lang`, falling back to English then Marathi then "". */
export function pick(text: Localized | undefined, lang: string): string {
  if (!text) return ""
  return text[lang as Lang] || text.en || text.mr || text.hi || ""
}

/**
 * Whether this step should be asked, given what the customer has answered.
 *
 * An unrecognised operator asks the question. A condition that silently skipped
 * would lose an answer with no trace; an extra question is merely noise.
 */
export function stepApplies(step: FlowStep, responses: Record<string, string>): boolean {
  const condition = step.condition
  if (!condition || !condition.field) return true
  const actual = (responses[condition.field] ?? "").trim()
  switch (condition.op) {
    case "equals":
      return actual === (condition.value ?? "")
    case "notEquals":
      return actual !== (condition.value ?? "")
    case "isEmpty":
      return actual === ""
    case "isNotEmpty":
      return actual !== ""
    default:
      return true
  }
}

/**
 * The next step worth asking from `from` onwards, or `-1` at the end.
 *
 * Skipped steps keep their slot — `session.step` is a position in the array, so
 * the positions must not shift underneath a live conversation.
 */
export function nextStepIndex(
  steps: FlowStep[],
  from: number,
  responses: Record<string, string>
): number {
  for (let i = from; i < steps.length; i++) {
    if (stepApplies(steps[i], responses)) return i
  }
  return -1
}

export function flowByCategory(config: WaFlowConfig, category: string): WaFlow | undefined {
  return config.flows.find(flow => flow.category === category)
}

/** Products offered in the menu, in the Admin's order. */
export function menuFlows(config: WaFlowConfig): WaFlow[] {
  return config.flows.filter(flow => flow.enabled).sort((a, b) => a.order - b.order)
}

export const DEFAULT_CONFIG: WaFlowConfig = {
  flows: DEFAULT_FLOWS,
  messages: DEFAULT_MESSAGES,
  automationEnabled: true,
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Rebuilds a flow from untrusted JSON — the API body an Admin submitted, or a
 * Firestore document written by an older build.
 *
 * Anything unrecognised is dropped rather than trusted: this value is about to
 * become the script a live WhatsApp bot reads to customers, and a malformed step
 * would strand every conversation that reached it.
 */
export function sanitizeFlow(raw: unknown, fallbackId = ""): WaFlow | null {
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>

  const category = typeof value.category === "string" ? value.category.trim() : ""
  if (!category) return null

  const steps = Array.isArray(value.steps)
    ? value.steps.map((step, i) => sanitizeStep(step, i)).filter((s): s is FlowStep => s !== null)
    : []

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id.trim() : fallbackId || slugify(category),
    category,
    label: sanitizeLocalized(value.label) || { en: category },
    order: Number.isFinite(Number(value.order)) ? Number(value.order) : 99,
    enabled: value.enabled !== false,
    intro: sanitizeLocalized(value.intro) || undefined,
    steps,
  }
}

function sanitizeStep(raw: unknown, index: number): FlowStep | null {
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>

  const field = typeof value.field === "string" ? value.field.trim() : ""
  if (!field) return null

  // `responseType` is the first builder's name for the same field.
  const rawType = value.type ?? value.responseType
  const type: StepType = rawType === "number" || rawType === "dropdown" ? rawType : "text"

  const options =
    type === "dropdown" && Array.isArray(value.options)
      ? value.options.map(sanitizeOption).filter((o): o is FlowOption => o !== null)
      : undefined

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id.trim() : `s${index + 1}`,
    field,
    type,
    question: sanitizeLocalized(value.question) || {},
    // A dropdown with no options would render as a button message with an empty
    // action, which WhatsApp rejects outright — treat it as free text instead.
    ...(options && options.length > 0 ? { options } : {}),
    condition: sanitizeCondition(value.condition),
  }
}

function sanitizeOption(raw: unknown): FlowOption | null {
  // `["Salaried", "Self Employed"]` — the old builder's option shape.
  if (typeof raw === "string") {
    const value = raw.trim()
    return value ? { value, label: { en: value } } : null
  }
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>
  const optionValue = typeof value.value === "string" ? value.value.trim() : ""
  if (!optionValue) return null
  return {
    value: optionValue,
    label: sanitizeLocalized(value.label) || { en: optionValue },
    ...(sanitizeLocalized(value.description) ? { description: sanitizeLocalized(value.description)! } : {}),
  }
}

function sanitizeCondition(raw: unknown): FlowCondition | null {
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>
  const field = typeof value.field === "string" ? value.field.trim() : ""
  if (!field) return null
  const op = value.op
  if (op !== "equals" && op !== "notEquals" && op !== "isEmpty" && op !== "isNotEmpty") return null
  return {
    field,
    op,
    ...(typeof value.value === "string" ? { value: value.value } : {}),
  }
}

function sanitizeLocalized(raw: unknown): Localized | null {
  // A bare string is how the first flow builder stored questions. Kept readable
  // rather than dropped: the bot says it in English instead of saying nothing.
  if (typeof raw === "string") return raw.trim() ? { en: raw } : null
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>
  const out: Localized = {}
  for (const lang of LANGS) {
    if (typeof value[lang] === "string" && (value[lang] as string).length > 0) {
      out[lang] = value[lang] as string
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

export function sanitizeMessages(raw: unknown): Partial<WaMessages> {
  if (!raw || typeof raw !== "object") return {}
  const value = raw as Record<string, unknown>
  const out: Partial<WaMessages> = {}
  for (const { key } of MESSAGE_META) {
    const localized = sanitizeLocalized(value[key])
    if (localized) out[key] = localized
  }
  return out
}

/**
 * Stored messages over the defaults, per key.
 *
 * Merged key by key rather than wholesale so that an Admin who edits one message
 * does not silently blank the eleven they left alone.
 */
export function mergeMessages(stored: Partial<WaMessages> | undefined): WaMessages {
  const merged = { ...DEFAULT_MESSAGES }
  if (!stored) return merged
  for (const { key } of MESSAGE_META) {
    const override = stored[key]
    if (override && Object.keys(override).length > 0) {
      merged[key] = { ...DEFAULT_MESSAGES[key], ...override }
    }
  }
  return merged
}

/**
 * Stored flows over the defaults, matched on `category`.
 *
 * A default flow the Admin has never opened keeps working; one they have edited
 * is replaced whole, because a half-merged question list would be unreadable in
 * the editor that produced it. Flows for new categories are appended.
 */
export function mergeFlows(stored: WaFlow[]): WaFlow[] {
  const byCategory = new Map<string, WaFlow>()
  for (const flow of DEFAULT_FLOWS) byCategory.set(flow.category, flow)
  for (const flow of stored) byCategory.set(flow.category, flow)
  return [...byCategory.values()].sort((a, b) => a.order - b.order)
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}
