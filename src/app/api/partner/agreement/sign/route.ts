import { NextResponse } from "next/server"
import crypto from "crypto"
import nodemailer from "nodemailer"
import { getAdminDb } from "@/lib/firebase-admin"
import { generatePartnerAgreementPdf } from "@/lib/pdf-generator"
import { generateNextDsaCode } from "@/lib/dsaCodeGenerator"

const OTP_SALT = process.env.OTP_HASH_SALT || "TSM_SECURE_FINTECH_SALT_2026"

function hashOtp(otp: string, phone: string): string {
  return crypto
    .createHmac("sha256", OTP_SALT)
    .update(`${phone}:${otp.trim()}`)
    .digest("hex")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phoneNumber, otp, email } = body
    const cleanPhone = String(phoneNumber || "").replace(/\D/g, "")
    const cleanOtp = String(otp || "").trim()

    if (!cleanPhone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const db = getAdminDb()

    // 1. If OTP is provided, verify OTP against partner_otp_codes
    if (cleanOtp) {
      const otpDocRef = db.collection("partner_otp_codes").doc(cleanPhone)
      const otpDoc = await otpDocRef.get()

      if (!otpDoc.exists) {
        return NextResponse.json({ error: "No active OTP found. Please request a new OTP." }, { status: 404 })
      }

      const otpData = otpDoc.data()

      // Check max attempts
      if ((otpData?.verifyAttempts || 0) >= 5) {
        await otpDocRef.delete()
        return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 429 })
      }

      // Check expiration
      const expiresAt = otpData?.expiresAt?.toDate ? otpData.expiresAt.toDate() : new Date(otpData?.expiresAt || 0)
      if (new Date() > expiresAt) {
        await otpDocRef.delete()
        return NextResponse.json({ error: "OTP has expired. Please request a new OTP." }, { status: 400 })
      }

      // Check OTP match (hashed or fallback plaintext)
      const expectedHashedOtp = otpData?.hashedOtp
      const computedHashedOtp = hashOtp(cleanOtp, cleanPhone)
      const isMatched = expectedHashedOtp ? expectedHashedOtp === computedHashedOtp : otpData?.otp === cleanOtp

      if (!isMatched) {
        await otpDocRef.update({ verifyAttempts: (otpData?.verifyAttempts || 0) + 1 })
        return NextResponse.json({ error: "Invalid verification OTP code. Please try again." }, { status: 400 })
      }

      // Clear used OTP
      await otpDocRef.delete()
    }

    // 2. Fetch Partner Profile & Application Data
    const appDocRef = db.collection("partner_applications").doc(cleanPhone)
    const appSnap = await appDocRef.get()
    const appData = appSnap.exists ? appSnap.data() : {}

    const userDocRef = db.collection("users").doc(cleanPhone)
    const userSnap = await userDocRef.get()
    const userData = userSnap.exists ? userSnap.data() : {}

    const now = new Date()
    const signedAtIso = now.toISOString()
    const dsaCode = userData?.dsaCode || appData?.dsaCode || (await generateNextDsaCode(db))
    const partnerEmail = email || userData?.email || appData?.email || ""
    const partnerName = userData?.fullName || appData?.fullName || appData?.contactPersonName || "Partner"

    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1"

    // 3. Mark Agreement as Signed in Firestore
    const agreementMeta = {
      agreementSigned: true,
      agreementSignedAt: signedAtIso,
      agreementIp: clientIp,
      agreementSignatureType: "OTP_VERIFIED",
      updatedAt: now,
    }

    await appDocRef.set(agreementMeta, { merge: true })
    await userDocRef.set(agreementMeta, { merge: true })

    // Also update by UID if user record is keyed by UID
    const userQuery = await db.collection("users").where("mobileNumber", "==", cleanPhone).get()
    userQuery.forEach((docSnap) => {
      docSnap.ref.set(agreementMeta, { merge: true })
    })

    // 4. Prepare Data & Generate Signed Agreement PDF
    const partnerPdfData = {
      fullName: partnerName,
      firmName: appData?.firmName || userData?.firmName || "",
      partnerType: appData?.partnerType || userData?.partnerType || "Individual",
      firmType: appData?.firmType || userData?.firmType || "",
      designation: appData?.designation || userData?.designation || "Partner",
      dsaCode: dsaCode,
      mobileNumber: cleanPhone,
      email: partnerEmail,
      addressLine1: appData?.addressLine1 || userData?.address?.line1 || "",
      addressLine2: appData?.addressLine2 || userData?.address?.line2 || "",
      city: appData?.city || userData?.address?.city || "",
      stateName: appData?.stateName || userData?.address?.state || "",
      pinCode: appData?.pinCode || userData?.address?.pincode || "",
      signedAt: signedAtIso,
      ipAddress: clientIp,
    }

    const pdfBuffer = generatePartnerAgreementPdf(partnerPdfData)

    // Upload generated MOU PDF to Cloudinary and store URL in database
    let agreementPdfUrl: string = `/api/partner/agreement/pdf?mobile=${cleanPhone}`
    try {
      const cloudinary = (await import("@/lib/cloudinary")).default
      const base64Pdf = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`
      const uploadRes = await cloudinary.uploader.upload(base64Pdf, {
        public_id: `MOU_Agreement_${cleanPhone}_${dsaCode}`,
        folder: "partner-agreements",
        resource_type: "auto",
        overwrite: true,
        tags: ["partner-mou", cleanPhone, dsaCode],
      })
      if (uploadRes?.secure_url) {
        agreementPdfUrl = uploadRes.secure_url
      }
    } catch (cErr) {
      console.warn("Cloudinary MOU PDF upload warning:", cErr)
    }

    // Save final PDF URL to Firestore
    const pdfMeta = {
      agreementSigned: true,
      agreementSignedAt: signedAtIso,
      agreementIp: clientIp,
      agreementPdfUrl: agreementPdfUrl,
      updatedAt: now,
    }

    await appDocRef.set(pdfMeta, { merge: true })
    await userDocRef.set(pdfMeta, { merge: true })

    const userPdfQuery = await db.collection("users").where("mobileNumber", "==", cleanPhone).get()
    userPdfQuery.forEach((docSnap) => {
      docSnap.ref.set(pdfMeta, { merge: true })
    })

    // 5. Send Email with PDF Attachment via Nodemailer
    let emailSent = false
    if (partnerEmail) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        const mailOptions = {
          from: `"Techstar Money DSA Desk" <${process.env.SMTP_USER || "official@techstarsolution.in"}>`,
          to: partnerEmail,
          cc: "official@techstarsolution.in",
          subject: `🎉 Executed Partner MOU Agreement - Techstar Money Solution Pvt. Ltd. (DSA Code: ${dsaCode})`,
          text: `Dear ${partnerName},\n\nCongratulations! Your DSA Partner Agreement with Techstar Money Solution Pvt. Ltd. has been successfully executed and signed via OTP Verification.\n\nPartner Details:\n- Name: ${partnerName}\n- Partner Code: ${dsaCode}\n- Registered Mobile: +91 ${phoneNumber}\n- Date of Execution: ${new Date().toLocaleDateString('en-IN')}\n\nPlease find your official executed MOU Agreement PDF attached to this email.\n\nWelcome to Techstar Money Partner Network!\n\nBest regards,\nTechstar Money Solutions Pvt. Ltd.\nhttps://partner.techstarsolution.in`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 12px; padding: 24px;">
              <div style="text-align: center; border-bottom: 2px solid #1769AA; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="color: #1769AA; margin: 0;">Techstar Money Solution Pvt. Ltd.</h2>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Authorized Partner Network • MOU Agreement</p>
              </div>

              <h3 style="color: #0f172a; margin-top: 0;">Dear ${partnerName},</h3>
              <p style="line-height: 1.6; color: #334155;">
                Congratulations! Your <strong>DSA Partner Agreement (MOU)</strong> with <strong>Techstar Money Solution Pvt. Ltd.</strong> has been successfully executed and verified via Mobile OTP.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px; color: #1769AA;">📌 Partner Credentials & Agreement Summary</h4>
                <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; font-weight: bold;">DSA Partner Code:</td><td>${dsaCode}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Partner Name:</td><td>${partnerName}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Registered Mobile:</td><td>+91 ${phoneNumber}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Registered Email:</td><td>${partnerEmail}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Signature Method:</td><td><span style="color: #16a34a; font-weight: bold;">✅ OTP Verified Electronic Signature</span></td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Execution Date:</td><td>${new Date().toLocaleDateString('en-IN')}</td></tr>
                </table>
              </div>

              <p style="line-height: 1.6; color: #334155;">
                📎 <strong>Your official signed MOU PDF is attached to this email.</strong> Please retain a copy for your official records.
              </p>

              <div style="margin-top: 24px; text-align: center;">
                <a href="https://partner.techstarsolution.in/partner" style="background-color: #1769AA; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Access Partner Portal Dashboard &rarr;
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                © 2026 Techstar Money Solutions Pvt. Ltd. | Support: 9579005645
              </p>
            </div>
          `,
          attachments: [
            {
              filename: `Techstar_Money_Partner_Agreement_${dsaCode}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        }

        await transporter.sendMail(mailOptions)
        emailSent = true
      } catch (mailErr) {
        console.error("Failed to dispatch agreement email:", mailErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Agreement executed successfully",
      dsaCode,
      signedAt: signedAtIso,
      emailSent,
    })
  } catch (error: any) {
    console.error("Agreement Signing API Error:", error)
    return NextResponse.json({ error: messageFor(error, "Failed to process agreement signature.") }, { status: 500 })
  }
}

function messageFor(err: unknown, fallback: string): string {
  return (err as { message?: string })?.message || fallback
}
