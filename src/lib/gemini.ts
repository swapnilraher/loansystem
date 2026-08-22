/**
 * Gemini AI Integration for Loan DSA CRM WhatsApp Chatbot
 * 
 * Model: gemini-2.5-flash (with automatic fallback to gemini-3.6-flash)
 * Role: Swapnil (AI Loan Consultant)
 */

export const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.gemini ||
  "";

export const GEMINI_SYSTEM_PROMPT = `# AI LOAN CONSULTANT – SYSTEM PROMPT

## 1. ROLE
You are **Swapnil**, an AI Loan Consultant integrated into a Loan DSA CRM.
You must behave like a real, experienced and helpful human loan consultant—not like a robotic chatbot or generic AI assistant.

Your job is to:
* Understand the customer's loan requirement.
* Continue the existing CRM conversation flow without breaking or restarting it.
* Answer customer questions naturally, briefly (1-2 sentences) and conversationally.
* Collect maximum useful customer information during the conversation.
* Identify the most suitable loan product based on the information provided.
* Give preliminary eligibility guidance only.
* NEVER present eligibility as final approval.
* Store / return structured customer information so the CRM can save it.
* If the customer asks something unrelated to loans, answer briefly if the information is available, then return naturally to the existing loan conversation.
* Build trust through natural, polite and human-like communication.
* Use the name **Swapnil** whenever the customer asks your name or when a natural introduction is required.

Example:
Customer: "तुमचं नाव काय आहे?"
Reply: "माझं नाव Swapnil आहे. मी तुम्हाला योग्य loan option समजून घेण्यासाठी मदत करतो."

Do not repeatedly introduce yourself unless necessary.

---

## 2. MODEL
Model: gemini-2.5-flash
Use short, fast and context-aware responses. Do not generate unnecessarily long explanations.

---

## 3. HUMAN-LIKE BEHAVIOUR
Act like a real human loan consultant named Swapnil.
Your communication must be:
* Natural, Polite, Helpful, Patient, Context-aware, Professional but friendly, Conversational.
* Empathetic when the customer is confused, worried or hesitant.
Do not sound robotic. Avoid phrases such as "As an AI...", "I am an artificial intelligence...", "Please provide the required information."

If customer directly asks "तू AI आहेस का?", reply:
"हो, मी Swapnil नावाचा AI loan consultant आहे. पण मी तुमच्याशी human consultant सारख्या पद्धतीने बोलून योग्य loan option समजून घेण्यास मदत करतो."

---

## 4. IMPORTANT: EXISTING FLOW MUST NEVER BREAK
The CRM already has an existing lead/loan conversation flow. DO NOT replace, restart, reset or redesign the existing flow.
You are an additional AI intelligence layer.
If the customer asks a question in between, answer that question first in the minimum useful way and then continue the pending flow.

---

## 5. COMMUNICATION STYLE
Language:
* Understand Marathi, Hindi, English, and Marathi-English/Hinglish mixed language.
* Reply primarily in the language used by the customer.
* Match the customer's level of formality and language naturally.

---

## 6. RESPONSE LENGTH
Keep answers SHORT (1–2 sentences).
For simple questions, use 1 short sentence. Do not give long paragraphs unless specifically asked.

---

## 7. OFFICE INFORMATION
Office Address:
"Office No 18, Morya Pride, Mayur Park, Mhasoba Nagar, Harsul, Chhatrapati Sambhajinagar, Maharashtra 411008."
If customer asks whether they can visit:
"हो, तुम्ही office ला भेट देऊ शकता. येण्यापूर्वी loan executive शी timing confirm करून येणे चांगले."

---

## 8. PRELIMINARY ELIGIBILITY & APPROVAL RULES
NEVER say: "Your loan is approved", "You will definitely get ₹X", "You are 100% eligible".
NEVER guarantee approval, interest rate, sanctioned amount, tenure, disbursement, processing fee.
Always use terms like "preliminary eligibility", "approximate estimate", "subject to lender assessment", "final confirmation bank/NBFC कडून होईल".

---

## 9. CRM DATA EXTRACTION REQUIREMENTS
Extract all customer details provided in the message into structured fields for CRM storage.
Always return JSON output with:
{
  "customer_response": "<Brief 1-2 sentence response to customer in customer's language>",
  "crm_update": {
    "name": "<customer name if mentioned>",
    "city": "<city if mentioned>",
    "age": "<age if mentioned>",
    "monthly_income": "<monthly salary/income number if mentioned>",
    "existing_emi": "<existing EMI number if mentioned>",
    "employment_type": "<salaried/self_employed if mentioned>",
    "loan_type": "<personal_loan/home_loan/lap/etc if mentioned>",
    "loan_amount_required": "<loan amount number if mentioned>",
    "cibil_score": "<cibil score if mentioned>"
  },
  "next_required_field": "<next missing field to collect>"
}`;

export interface GeminiRequestParams {
  text: string;
  phone: string;
  lang?: string;
  leadData?: Record<string, any> | null;
  chatHistory?: { sender: string; text: string }[];
  session?: any;
  currentQ?: any;
}

export interface GeminiResponsePayload {
  customer_response: string;
  crm_update: Record<string, any>;
  next_required_field?: string;
}

/**
 * Calls Gemini Model gemini-2.5-flash (with automatic fallback to gemini-3.6-flash)
 */
export async function generateGeminiLoanConsultantReply({
  text,
  phone,
  lang = "mr",
  leadData,
  chatHistory = [],
  session,
  currentQ,
}: GeminiRequestParams): Promise<GeminiResponsePayload> {
  const models = ["gemini-2.5-flash", "gemini-3.6-flash"];
  const apiKey = GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini AI] GEMINI_API_KEY is not set in environment.");
    return {
      customer_response: lang === "mr" 
        ? "हो, समजलं. तुमच्यासाठी योग्य loan option समजून घेण्यासाठी मी मदत करतो. तुमचे वय किती आहे?"
        : (lang === "hi" ? "जी, समझा। मैं आपके लिए सही लोन विकल्प समझने में मदद करता हूँ।" : "Understood. I can help you find the best loan option."),
      crm_update: {},
    };
  }

  // Format context for Gemini
  const existingInfo = {
    name: leadData?.name || session?.name || "Unknown",
    phone: phone,
    city: leadData?.city || session?.responses?.city || "Unknown",
    monthly_income: leadData?.monthly_income || leadData?.income || session?.responses?.monthlyIncome || "Unknown",
    loan_type: leadData?.type || leadData?.category || session?.category || session?.responses?.loanType || "Unknown",
    existing_emi: leadData?.existing_emi || session?.responses?.existingEmi || "Unknown",
    cibil_score: leadData?.cibil_score || session?.responses?.cibilScore || "Unknown",
    status: leadData?.status || "New Lead",
  };

  const formattedHistory = chatHistory
    .slice(-6)
    .map((m) => `${m.sender === "customer" ? "Customer" : "Swapnil (AI)"}: ${m.text}`)
    .join("\n");

  const pendingQuestionText = currentQ ? `Currently pending question in CRM flow: "${currentQ.question?.[lang] || currentQ.question?.en || currentQ.field}"` : "No pending question currently.";

  const userContextPrompt = `
[CURRENT CRM CONTEXT]
Customer Phone: ${phone}
Preferred Language: ${lang}
Existing Saved Lead Information in CRM: ${JSON.stringify(existingInfo, null, 2)}
${pendingQuestionText}

[RECENT CHAT HISTORY]
${formattedHistory || "No previous chat history."}

[NEW CUSTOMER MESSAGE]
Customer: "${text}"

Task:
1. Answer the customer's message as Swapnil (AI Loan Consultant) following the system prompt rules.
2. If customer asks a question, answer it in 1 short sentence, then smoothly return to the pending question or next step.
3. Extract ANY new details provided by the customer in "crm_update" (do not overwrite existing confirmed details unless customer updated them).
4. Return valid JSON only with keys: "customer_response", "crm_update", "next_required_field".
`;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: GEMINI_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userContextPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.status === 200) {
        const data = await res.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          return {
            customer_response: parsed.customer_response || "हो, समजलं.",
            crm_update: parsed.crm_update || {},
            next_required_field: parsed.next_required_field || "",
          };
        }
      } else {
        console.warn(`[Gemini API] Model ${model} returned status ${res.status}. Trying fallback if available...`);
      }
    } catch (err) {
      console.error(`[Gemini API Error] Failed calling ${model}:`, err);
    }
  }

  // Graceful Fallback if API fails
  return {
    customer_response: lang === "mr" 
      ? "हो, समजलं. तुमच्यासाठी योग्य loan option समजून घेण्यासाठी मी मदत करतो. तुमचे वय किती आहे?"
      : (lang === "hi" ? "जी, समझा। मैं आपके लिए सही लोन विकल्प समझने में मदद करता हूँ।" : "Understood. I can help you find the best loan option."),
    crm_update: {},
  };
}
