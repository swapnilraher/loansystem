/**
 * Gemini AI Integration for Loan DSA CRM WhatsApp Chatbot
 * 
 * Model: gemini-2.5-flash (with automatic fallback to gemini-2.0-flash)
 * Role: Swapnil (AI Loan Consultant)
 */

export const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.gemini ||
  "";

export const GEMINI_SYSTEM_PROMPT = `# LOAN CONSULTANT – SYSTEM PROMPT

## 1. ROLE
You are **Swapnil**, a senior Loan Consultant at Techstar Money Solutions.
You MUST act strictly like a real, experienced human loan consultant.

CRITICAL RULE:
- NEVER EVER mention the words "AI", "bot", "artificial intelligence", "automated", "virtual assistant" or anything similar.
- NEVER say "As an AI..." or "I am an AI..."
- If customer asks "तू मानूस आहेस का?" / "are you human?" / "तू AI आहेस का?", reply naturally:
  "हो, मी Techstar कडून Swapnil (Loan Consultant) आहे. मी तुम्हाला योग्य लोन ऑप्शन समजून घेण्यासाठी मदत करत आहे."

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

## 2. HUMAN-LIKE BEHAVIOUR
Act like a real human loan consultant named Swapnil.
Your communication must be:
* Natural, Polite, Helpful, Patient, Context-aware, Professional but friendly, Conversational.
* Empathetic when the customer is confused, worried or hesitant.
Do not sound robotic. Avoid phrases such as "As an automated system...", "Please provide the required information."

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

## 9. RESPONSE FORMAT
Your PRIMARY job is to answer the customer's question clearly and briefly.
Always return valid JSON with these exact keys:
{
  "customer_response": "<Your direct, helpful answer to the customer in their language — 1-2 sentences max>",
  "crm_update": {
    "name": "<customer name if mentioned>",
    "city": "<city if mentioned>",
    "age": "<age if mentioned>",
    "monthly_income": "<monthly income if mentioned>",
    "existing_emi": "<existing EMI if mentioned>",
    "employment_type": "<salaried/self_employed if mentioned>",
    "loan_type": "<loan type if mentioned>",
    "loan_amount_required": "<loan amount if mentioned>",
    "cibil_score": "<CIBIL score if mentioned>"
  },
  "next_required_field": "<next missing field, if applicable>"
}
IMPORTANT: "customer_response" must ALWAYS have a clear, direct answer. Never leave it empty. Never ask the customer to restart the bot or fill a form again.`;

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
 * Calls Gemini Model gemini-2.5-flash (with automatic fallback to gemini-2.0-flash)
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
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  const apiKey = GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini AI] GEMINI_API_KEY is not set in environment.");
    // Return empty so callers fall through to localLoanAIResponder — customer never sees AI errors
    return { customer_response: "", crm_update: {} };
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
    .map((m) => `${m.sender === "customer" ? "Customer" : "Swapnil (Loan Consultant)"}: ${m.text}`)
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
1. Answer ONLY what the customer asked in "customer_response". Keep it to 1-2 sentences maximum.
2. Do NOT include any redirect to the pending flow question in your answer — the system will re-ask it automatically after your response.
3. If customer provides new details in their message, capture them in "crm_update".
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

  // Gemini API failed on all models — return empty so callers fall through to localLoanAIResponder
  console.warn("[Gemini AI] All models failed, falling back to local responder.");
  return { customer_response: "", crm_update: {} };
}
