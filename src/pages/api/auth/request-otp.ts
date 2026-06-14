import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { email } = req.body as { email: string };
  if (!email) {
    return res.status(400).json({ message: 'Email required' });
  }
  
  // Find admin_user document
  const adminQuery = query(collection(db, 'admin_users'), where('email', '==', email));
  const snapshot = await getDocs(adminQuery);
  if (snapshot.empty) {
    return res.status(404).json({ message: 'User not found' });
  }
  const docRef = snapshot.docs[0].ref;
  const adminData = snapshot.docs[0].data();
  
  // Get phone number from admin data
  const phoneNumber = adminData.phone || adminData.phoneNumber || adminData.mobile;
  if (!phoneNumber) {
    return res.status(400).json({ message: 'No phone number linked to this account for WhatsApp OTP.' });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = Date.now() + (process.env.OTP_EXPIRY_MINUTES ? parseInt(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000 : 5 * 60 * 1000);
  
  // Store OTP hash and expiry
  await setDoc(docRef, { otpHash, otpExpiresAt: expiresAt }, { merge: true });
  
  // Send via WhatsApp Business API
  const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1112131761984283";
  const TOKEN = process.env.WHATSAPP_TOKEN || "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";

  try {
    const templatePayload = {
      messaging_product: "whatsapp",
      to: `${process.env.COUNTRY_CODE || "91"}${phoneNumber}`,
      type: "template",
      template: {
        name: "otp",
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: otp }]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: otp }]
          }
        ]
      }
    };

    let response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templatePayload),
    });

    if (!response.ok) {
      // Fallback: Try without the button component
      const fallbackPayload = {
        messaging_product: "whatsapp",
        to: `${process.env.COUNTRY_CODE || "91"}${phoneNumber}`,
        type: "template",
        template: {
          name: "otp",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: otp }]
            }
          ]
        }
      };
      
      response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fallbackPayload),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error("WhatsApp Error:", errorData);
      return res.status(500).json({ message: 'Failed to send WhatsApp message' });
    }
  } catch (e) {
    console.error('Failed to send WhatsApp OTP', e);
    return res.status(500).json({ message: 'WhatsApp service unavailable' });
  }

  return res.status(200).json({ message: 'OTP sent via WhatsApp' });
}
