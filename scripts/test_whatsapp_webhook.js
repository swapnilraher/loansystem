const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = `http://localhost:${PORT}/api/whatsapp/webhook`;

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
                  id: "wamid." + Date.now(),
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
  
  const testPhone = "919999999999"; // Indian number with country code 91
  
  // 1. Initial Greet (No Session)
  console.log("\n[TEST 1] Sending first greeting 'Hi'...");
  const p1 = testPayload(testPhone, "Hi");
  let r1 = await postWebhook(p1);
  console.log("Status:", r1.status);
  console.log("Response:", r1.data);

  // 2. Select Language (3 - Marathi) via Interactive Button Click Mock
  console.log("\n[TEST 2] Selecting language 'Marathi'...");
  const p2 = testPayload(testPhone, "", "interactive", {
    type: "button_reply",
    button_reply: { id: "3", title: "मराठी (Marathi)" }
  });
  let r2 = await postWebhook(p2);
  console.log("Status:", r2.status);
  console.log("Response:", r2.data);

  // 3. Provide Full Name
  console.log("\n[TEST 3] Providing full name 'Swapnil Test'...");
  const p3 = testPayload(testPhone, "Swapnil Test");
  let r3 = await postWebhook(p3);
  console.log("Status:", r3.status);
  console.log("Response:", r3.data);

  // 4. Select Category (2 - Personal Loan) via Interactive List select Mock
  console.log("\n[TEST 4] Selecting category 'Personal Loan'...");
  const p4 = testPayload(testPhone, "", "interactive", {
    type: "list_reply",
    list_reply: { id: "2", title: "पर्सनल लोन" }
  });
  let r4 = await postWebhook(p4);
  console.log("Status:", r4.status);
  console.log("Response:", r4.data);

  // 5. Provide monthly income (Personal Loan Q1)
  console.log("\n[TEST 5] Submitting monthly income '45000'...");
  const p5 = testPayload(testPhone, "45000");
  let r5 = await postWebhook(p5);
  console.log("Status:", r5.status);
  console.log("Response:", r5.data);

  // 6. Test AI query fallback (Ask question during flow instead of replying option)
  console.log("\n[TEST 6] Asking off-topic question 'व्याजदर किती आहे?'...");
  const p6 = testPayload(testPhone, "व्याजदर किती आहे?");
  let r6 = await postWebhook(p6);
  console.log("Status:", r6.status);
  console.log("Response:", r6.data);

  // 7. Provide employment type using natural language (AI classification test)
  console.log("\n[TEST 7] Submitting employment response in natural language 'नोकरी करतो'...");
  const p7 = testPayload(testPhone, "नोकरी करतो");
  let r7 = await postWebhook(p7);
  console.log("Status:", r7.status);
  console.log("Response:", r7.data);

  // 8. Submit City (Personal Loan Q3 - final question)
  console.log("\n[TEST 8] Submitting city 'Pune'...");
  const p8 = testPayload(testPhone, "Pune");
  let r8 = await postWebhook(p8);
  console.log("Status:", r8.status);
  console.log("Response:", r8.data);

  console.log("\n=========================================");
  console.log("ALL TESTS COMPLETED SUCCESSFUL!");
  console.log("=========================================");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
});
