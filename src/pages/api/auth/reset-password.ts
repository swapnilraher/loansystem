import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { email, token, newPassword } = req.body as { email: string; token: string; newPassword: string };
  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'Missing parameters' });
  }
  // Find admin_user document
  const adminQuery = query(collection(db, 'admin_users'), where('email', '==', email));
  const snapshot = await getDocs(adminQuery);
  if (snapshot.empty) {
    return res.status(404).json({ message: 'User not found' });
  }
  const docRef = snapshot.docs[0].ref;
  const data = snapshot.docs[0].data() as any;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  if (data.otpHash !== tokenHash) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  if (Date.now() > data.otpExpiresAt) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  // Update password and clear OTP fields
  await setDoc(docRef, { password: newPassword, otpHash: null, otpExpiresAt: null }, { merge: true });
  return res.status(200).json({ message: 'Password reset successful' });
}
