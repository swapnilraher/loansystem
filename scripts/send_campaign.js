const fs = require('fs');
const path = require('path');

// 1. Credentials from whatsappConfig or env
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";
const DEFAULT_IMAGE = "https://res.cloudinary.com/ugpy6fko/image/upload/v1788543861/wa-campaigns/u3xz2l1lpx7wylsxitog.png";

/**
 * Sends the approved 'connector' template message to a recipient.
 */
async function sendConnectorTemplate(recipientPhone, customerName, imageUrl = DEFAULT_IMAGE) {
  const cleanPhone = recipientPhone.toString().replace(/\D/g, '');
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: finalPhone,
    type: "template",
    template: {
      name: "connector",
      language: {
        code: "en"
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: imageUrl
              }
            }
          ]
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "customer_name",
              text: customerName || "Partner"
            }
          ]
        }
      ]
    }
  };

  const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.error_data?.details || data.error?.message || "Failed to send");
  }

  return data;
}

// If run directly via node scripts/send_campaign.js
async function main() {
  console.log("=== Techstar WhatsApp Campaign Runner ===");

  // Data from 'Connector test Campain.xlsx'
  const recipients = [
    { name: "Krushna Tupe", phone: "9421306564" },
    { name: "Swapnil Aher", phone: "9420400202" },
    { name: "Sharayu Aher", phone: "8767270071" },
    { name: "Avishkar kakde", phone: "9322810348" }
  ];

  console.log(`Starting campaign for ${recipients.length} recipients...\n`);

  for (const r of recipients) {
    process.stdout.write(`Sending to ${r.name} (${r.phone})... `);
    try {
      const res = await sendConnectorTemplate(r.phone, r.name);
      console.log(`[SUCCESS] Message ID: ${res.messages?.[0]?.id}`);
    } catch (err) {
      console.log(`[FAILED] Error: ${err.message}`);
    }
    // Small delay between sends to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\nCampaign completed!");
}

if (require.main === module) {
  main();
}

module.exports = { sendConnectorTemplate };
