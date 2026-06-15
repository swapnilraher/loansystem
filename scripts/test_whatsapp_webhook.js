const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = `http://localhost:${PORT}/api/whatsapp/webhook`;
const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo";
const PROJECT_ID = "dsa-loan";

const testPayload = (from, text, type = 'text', interactive = null) => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "1493282642455205",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "1112131761984283",
                phone_number_id: "1112131761984283"
              },
              contacts: [
                {
                  profile: { name: "Test User" },
                  wa_id: from
                }
              ],
              messages: [
                {
                  from: from,
                  id: "wamid." + Date.now() + "." + Math.floor(Math.random() * 1000),
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: type
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };

  if (type === 'text') {
    payload.entry[0].changes[0].value.messages[0].text = { body: text };
  } else if (type === 'interactive' && interactive) {
    payload.entry[0].changes[0].value.messages[0].interactive = interactive;
  }

  return payload;
};

async function deleteSession(phone) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/waSession/${phone}?key=${FIREBASE_API_KEY}`;
  try {
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) {
      console.log(`Deleted session for ${phone}`);
    }
  } catch (err) {
    console.error(`Failed to delete session for ${phone}:`, err.message);
  }
}

async function postWebhook(payload) {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return { status: res.status, data: await res.json() };
}

async function runTests() {
  console.log("=========================================");
  console.log("STARTING WHATSAPP AUTOMATION WEBHOOK TESTS");
  console.log("=========================================");
  
  const intakePhone = "919420400202"; // normal intake test
  const existingPhone = "9999999999"; // existing lead test
  
  // Clean up sessions before tests
  console.log("\n[SETUP] Cleaning up active sessions...");
  await deleteSession("9420400202");
  await deleteSession(existingPhone);

  // --- PART 1: Lead Intake Flow with Local AI Fallback ---
  console.log("\n--- PART 1: Normal Intake Flow & Local AI Fallback ---");

  // 1. Initial Greet
  console.log("\n[TEST 1] Sending first greeting 'Hi'...");
  const p1 = testPayload(intakePhone, "Hi");
  let r1 = await postWebhook(p1);
  console.log("Status:", r1.status, "Response:", r1.data);

  // 2. Select Language (3 - Marathi)
  console.log("\n[TEST 2] Selecting language 'Marathi'...");
  const p2 = testPayload(intakePhone, "", "interactive", {
    type: "button_reply",
    button_reply: { id: "3", title: "मराठी (Marathi)" }
  });
  let r2 = await postWebhook(p2);
  console.log("Status:", r2.status, "Response:", r2.data);

  // 3. Provide Name
  console.log("\n[TEST 3] Providing full name 'Swapnil New'...");
  const p3 = testPayload(intakePhone, "Swapnil New");
  let r3 = await postWebhook(p3);
  console.log("Status:", r3.status, "Response:", r3.data);

  // 4. Select Category (2 - Personal Loan)
  console.log("\n[TEST 4] Selecting category 'Personal Loan'...");
  const p4 = testPayload(intakePhone, "", "interactive", {
    type: "list_reply",
    list_reply: { id: "2", title: "पर्सनल लोन" }
  });
  let r4 = await postWebhook(p4);
  console.log("Status:", r4.status, "Response:", r4.data);

  // 5. Ask off-topic loan question during flow
  console.log("\n[TEST 5] Asking off-topic question 'व्याजदर किती आहे?'...");
  const p5 = testPayload(intakePhone, "व्याजदर किती आहे?");
  let r5 = await postWebhook(p5);
  console.log("Status:", r5.status, "Response:", r5.data);

  // 6. Submit Monthly Income
  console.log("\n[TEST 6] Submitting monthly income '40000'...");
  const p6 = testPayload(intakePhone, "40000");
  let r6 = await postWebhook(p6);
  console.log("Status:", r6.status, "Response:", r6.data);

  // 7. Submit Employment with natural language keyword
  console.log("\n[TEST 7] Submitting employment 'नोकरी करतो' (Classified to Salaried)...");
  const p7 = testPayload(intakePhone, "नोकरी करतो");
  let r7 = await postWebhook(p7);
  console.log("Status:", r7.status, "Response:", r7.data);

  // 8. Submit City
  console.log("\n[TEST 8] Submitting city 'Aurangabad'...");
  const p8 = testPayload(intakePhone, "Aurangabad");
  let r8 = await postWebhook(p8);
  console.log("Status:", r8.status, "Response:", r8.data);


  // --- PART 2: Existing Lead CRM Lookup & conversational Support Mode ---
  console.log("\n--- PART 2: Existing Lead Status Lookup & Support Mode ---");

  // 9. Initial message from existing lead
  console.log("\n[TEST 9] First message from existing lead (Phone: 9999999999)...");
  const p9 = testPayload(existingPhone, "Hello there");
  let r9 = await postWebhook(p9);
  console.log("Status:", r9.status, "Response:", r9.data);

  // 10. Query local AI in support mode (Marathi lead, asks about documents)
  console.log("\n[TEST 10] Asking loan question in Support Mode: 'कागदपत्रे काय लागतील?'...");
  const p10 = testPayload(existingPhone, "कागदपत्रे काय लागतील?");
  let r10 = await postWebhook(p10);
  console.log("Status:", r10.status, "Response:", r10.data);

  // 11. Query local AI in support mode (English query: contact info)
  console.log("\n[TEST 11] Asking loan question in Support Mode: 'need contact number'...");
  const p11 = testPayload(existingPhone, "need contact number");
  let r11 = await postWebhook(p11);
  console.log("Status:", r11.status, "Response:", r11.data);

  // 12. Ask about loan limits
  console.log("\n[TEST 12] Asking about limits: 'limit kiti ahe?'...");
  const p12 = testPayload(existingPhone, "limit kiti ahe?");
  let r12 = await postWebhook(p12);
  console.log("Status:", r12.status, "Response:", r12.data);

  // 13. Ask about cibil score
  console.log("\n[TEST 13] Asking about cibil score: 'cibil score kiti pahije'...");
  const p13 = testPayload(existingPhone, "cibil score kiti pahije");
  let r13 = await postWebhook(p13);
  console.log("Status:", r13.status, "Response:", r13.data);

  // 14. Reply "new loan" to start again
  console.log("\n[TEST 14] Sending restart keyword 'new loan'...");
  const p14 = testPayload(existingPhone, "new loan");
  let r14 = await postWebhook(p14);
  console.log("Status:", r14.status, "Response:", r14.data);

  console.log("\n=========================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("=========================================");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
});
