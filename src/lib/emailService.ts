import nodemailer from "nodemailer"

export interface SendSignedAgreementEmailParams {
  to: string
  partnerName: string
  dsaCode: string
  mobileNumber: string
  firmName?: string
  signedAt?: string | Date
  pdfBuffer: Buffer
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  alreadySent?: boolean
}

/**
 * Sanitizes partner name for use in attachment filenames.
 * E.g. "Swapnil Aher" -> "Swapnil_Aher"
 */
export function sanitizeFileName(name: string): string {
  return (name || "Partner")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
}

/**
 * Creates a configured Nodemailer Transporter using environment variables.
 * Handles port 465 (SSL secure: true) and port 587 (STARTTLS secure: false).
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT ?? 465)
  const secure = port === 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    console.warn("[EmailService] Warning: SMTP_USER or SMTP_PASS is missing in environment configuration.")
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

/**
 * Sends a confirmation email to the partner with their signed DSA Partnership Agreement PDF attached.
 */
export async function sendSignedAgreementEmail({
  to,
  partnerName,
  dsaCode,
  mobileNumber,
  firmName,
  signedAt,
  pdfBuffer,
}: SendSignedAgreementEmailParams): Promise<EmailResult> {
  const cleanEmail = String(to || "").trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Invalid recipient email address" }
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "official@swapnilaher.in"
  const fromHeader = `"Techstar Money Solution" <${fromEmail}>`
  const sanitizedName = sanitizeFileName(partnerName)
  const attachmentFilename = `Techstar_DSA_Agreement_${sanitizedName}_Signed.pdf`

  const executionDateStr = signedAt
    ? new Date(signedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })

  const subject = "DSA Partnership Agreement Successfully eSigned – Techstar Money Solution"

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9; padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background-color:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding:32px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:800; letter-spacing:-0.5px;">TECHSTAR MONEY SOLUTION</h1>
              <p style="margin:6px 0 0 0; color:#e0f2fe; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Direct Selling Agent (DSA) Partner Network</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 28px;">
              <h2 style="margin:0 0 16px 0; color:#0f172a; font-size:18px; font-weight:700;">Dear ${partnerName},</h2>
              <p style="margin:0 0 20px 0; color:#334155; font-size:14px; line-height:1.6;">
                Congratulations and welcome aboard! Your official <strong>DSA Partnership Agreement (MOU)</strong> with <strong>Techstar Money Solution Pvt. Ltd.</strong> has been successfully executed via Electronic OTP verification (eSign).
              </p>
              
              <!-- Success Alert Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0; color:#065f46; font-size:13px; font-weight:600; line-height:1.5;">
                      ✅ <strong>Agreement Status:</strong> Legally Executed & eSigned via Mobile OTP Verification.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Summary Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <h3 style="margin:0 0 14px 0; color:#0369a1; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Partner & Agreement Details</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size:13px; color:#334155;">
                      <tr>
                        <td width="42%" style="font-weight:600; color:#64748b; border-bottom:1px solid #e2e8f0;">DSA Partner Code:</td>
                        <td style="font-weight:700; color:#0284c7; border-bottom:1px solid #e2e8f0;">${dsaCode}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600; color:#64748b; border-bottom:1px solid #e2e8f0;">Partner Name:</td>
                        <td style="font-weight:600; color:#0f172a; border-bottom:1px solid #e2e8f0;">${partnerName}</td>
                      </tr>
                      ${firmName ? `
                      <tr>
                        <td style="font-weight:600; color:#64748b; border-bottom:1px solid #e2e8f0;">Firm / Business Name:</td>
                        <td style="font-weight:600; color:#0f172a; border-bottom:1px solid #e2e8f0;">${firmName}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="font-weight:600; color:#64748b; border-bottom:1px solid #e2e8f0;">Registered Mobile:</td>
                        <td style="font-weight:600; color:#0f172a; border-bottom:1px solid #e2e8f0;">+91 ${mobileNumber}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600; color:#64748b; border-bottom:1px solid #e2e8f0;">Registered Email:</td>
                        <td style="font-weight:600; color:#0f172a; border-bottom:1px solid #e2e8f0;">${cleanEmail}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600; color:#64748b; border-bottom:1px solid #e2e8f0;">Verification Method:</td>
                        <td style="font-weight:600; color:#059669; border-bottom:1px solid #e2e8f0;">OTP Electronic Signature (eSign)</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600; color:#64748b;">Date of Execution:</td>
                        <td style="font-weight:600; color:#0f172a;">${executionDateStr}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachment Notification -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0f9ff; border:1px dashed #38bdf8; border-radius:10px; margin-bottom:28px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 6px 0; color:#0369a1; font-size:13px; font-weight:700;">
                      📎 Attached Document:
                    </p>
                    <p style="margin:0; color:#0c4a6e; font-size:12px; line-height:1.5;">
                      <strong>${attachmentFilename}</strong><br />
                      A digitally stamped and signed copy of your DSA Partnership Agreement is attached to this email for your official records.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="https://partner.techstarsolution.in" target="_blank" style="background-color:#0284c7; color:#ffffff; padding:14px 32px; font-size:14px; font-weight:700; text-decoration:none; border-radius:10px; display:inline-block; box-shadow:0 4px 6px -1px rgba(2,132,199,0.3);">
                      Access Partner Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0; color:#334155; font-size:13px; line-height:1.6;">
                If you have any questions or require assistance with client loan applications, feel free to contact our partner support team.
              </p>
              <p style="margin:0; color:#64748b; font-size:13px;">
                Warm Regards,<br />
                <strong>Techstar Money Solution Team</strong><br />
                <a href="https://partner.techstarsolution.in" style="color:#0284c7; text-decoration:none;">partner.techstarsolution.in</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 24px; text-align:center;">
              <p style="margin:0 0 6px 0; color:#94a3b8; font-size:11px;">
                Techstar Money Solution Pvt. Ltd. • Authorized Loan Distribution Network
              </p>
              <p style="margin:0; color:#94a3b8; font-size:11px;">
                Support Helpline: +91 9579005645 | Email: official@techstarsolution.in
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const plainText = `
Dear ${partnerName},

Congratulations! Your DSA Partnership Agreement with Techstar Money Solution Pvt. Ltd. has been successfully executed and eSigned via Mobile OTP Verification.

Partner & Agreement Details:
- DSA Partner Code: ${dsaCode}
- Partner Name: ${partnerName}
${firmName ? `- Firm Name: ${firmName}\n` : ""}- Registered Mobile: +91 ${mobileNumber}
- Registered Email: ${cleanEmail}
- Signature Method: OTP Electronic Signature (eSign)
- Date of Execution: ${executionDateStr}

Attached Document:
${attachmentFilename} (Official eSigned DSA Agreement PDF)

Access your Partner Portal at:
https://partner.techstarsolution.in

Best regards,
Techstar Money Solution Pvt. Ltd.
Support: +91 9579005645 | official@techstarsolution.in
  `.trim()

  try {
    const transporter = getMailTransporter()
    const mailOptions = {
      from: fromHeader,
      to: cleanEmail,
      subject,
      text: plainText,
      html: htmlContent,
      attachments: [
        {
          filename: attachmentFilename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`[EmailService] Agreement confirmation email sent successfully to ${cleanEmail} (MessageId: ${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (err: any) {
    const safeError = err?.message || String(err)
    console.error(`[EmailService] Failed to send agreement email to ${cleanEmail}:`, safeError)
    return { success: false, error: safeError }
  }
}
