import nodemailer from 'nodemailer';

/**
 * Sends an OTP email to the given address.
 * Uses SMTP credentials from .env.local.
 */
export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"ERP System" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your Password Reset OTP',
    text: `Your OTP for resetting your password is: ${otp}\nIt will expire in ${process.env.OTP_EXPIRY_MINUTES ?? '5'} minutes.`,
    html: `<p>Your OTP for resetting your password is:</p><h2>${otp}</h2><p>It will expire in <strong>${process.env.OTP_EXPIRY_MINUTES ?? '5'} minutes</strong>.</p>`,
  };

  await transporter.sendMail(mailOptions);
}
