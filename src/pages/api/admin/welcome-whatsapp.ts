import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const { phone, name, email, password, role } = req.body;
  
  if (!phone || !name) {
    return res.status(400).json({ message: 'Phone and name required' });
  }

  // Send via WhatsApp Business API
  const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
  const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";
  const formattedPhone = `${process.env.COUNTRY_CODE || "91"}${phone.replace(/\D/g, '').slice(-10)}`;

  try {
    const messageText = `*Welcome to Techstar Staff Portal, ${name}!* 🌟\n\nYou have been added as a *${role}*.\n\n*Your Login Details:*\nEmail: ${email}\nPassword: ${password}\n\n*Login Link:*\nhttps://techstarsolution.in/admin/login\n\nPlease login and change your password immediately.\n\nRegards,\n*Techstar Team*`;
    
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: messageText
      }
    };

    const response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("WhatsApp Error:", errorData);
      return res.status(500).json({ message: 'Failed to send WhatsApp message' });
    }
  } catch (e) {
    console.error('Failed to send WhatsApp Welcome', e);
    return res.status(500).json({ message: 'WhatsApp service unavailable' });
  }

  return res.status(200).json({ message: 'Welcome message sent via WhatsApp' });
}
