import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { sendOTPEmail } from '@/lib/email';
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
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = Date.now() + (process.env.OTP_EXPIRY_MINUTES ? parseInt(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000 : 5 * 60 * 1000);
  // Store OTP hash and expiry
  await setDoc(docRef, { otpHash, otpExpiresAt: expiresAt }, { merge: true });
  // Send email
  try {
    await sendOTPEmail(email, otp);
  } catch (e) {
    console.error('Failed to send OTP email', e);
    // Continue – we still store OTP
  }
  return res.status(200).json({ message: 'OTP sent' });
}
