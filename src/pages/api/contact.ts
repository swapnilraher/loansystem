import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

/**
 * Handles contact form submissions.
 * Expects JSON body: { name, email, phone, amount, message }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, phone, amount, message } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    amount?: string;
    message?: string;
  };

  // Basic validation
  if (!name || !email || !phone || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Configure transporter (same as email.ts)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Techstar Loans Contact" <${process.env.SMTP_USER}>`,
    to: 'official@swapnilaher.in', // recipient email address
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nDesired Loan Amount: ${amount}\nMessage: ${message || 'N/A'}`,
    html: `<p><strong>Name:</strong> ${name}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Phone:</strong> ${phone}</p>
           <p><strong>Desired Loan Amount:</strong> ${amount}</p>
           <p><strong>Message:</strong> ${message || 'N/A'}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending contact email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
