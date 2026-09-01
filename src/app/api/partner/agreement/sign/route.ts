import { NextResponse } from "next/server"
import crypto from "crypto"
import { getAdminDb } from "@/lib/firebase-admin"
import { generatePartnerAgreementPdf } from "@/lib/pdf-generator"
import { generateNextDsaCode } from "@/lib/dsaCodeGenerator"
import { sendSignedAgreementEmail } from "@/lib/emailService"

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

    // 5. Send Email with PDF Attachment via EmailService (with duplicate protection & error logging)
    let emailStatus: "sent" | "failed" | "skipped_duplicate" | "skipped_no_email" = "skipped_no_email"
    let emailSent = false
    let emailErrorMsg: string | null = null

    const isAlreadySent =
      appData?.agreementEmailStatus === "sent" ||
      !!appData?.agreementEmailSentAt ||
      userData?.agreementEmailStatus === "sent" ||
      !!userData?.agreementEmailSentAt

    if (isAlreadySent) {
      emailStatus = "skipped_duplicate"
      emailSent = true
      console.log(`[Agreement Sign] Skipped email dispatch: Confirmation email already sent previously to ${cleanPhone}`)
    } else if (partnerEmail && partnerEmail.includes("@")) {
      try {
        const emailResult = await sendSignedAgreementEmail({
          to: partnerEmail,
          partnerName: partnerName,
          dsaCode: dsaCode,
          mobileNumber: cleanPhone,
          firmName: partnerPdfData.firmName,
          signedAt: signedAtIso,
          pdfBuffer: pdfBuffer,
        })

        if (emailResult.success) {
          emailSent = true
          emailStatus = "sent"

          const emailLogMeta = {
            agreementEmailStatus: "sent",
            agreementEmailSentAt: new Date().toISOString(),
            agreementEmailRecipient: partnerEmail,
            agreementEmailMessageId: emailResult.messageId || null,
            agreementEmailError: null,
            updatedAt: now,
          }

          await appDocRef.set(emailLogMeta, { merge: true })
          await userDocRef.set(emailLogMeta, { merge: true })
          userPdfQuery.forEach((docSnap) => {
            docSnap.ref.set(emailLogMeta, { merge: true })
          })
        } else {
          emailStatus = "failed"
          emailErrorMsg = emailResult.error || "Email dispatch failed"

          const emailFailMeta = {
            agreementEmailStatus: "failed",
            agreementEmailRecipient: partnerEmail,
            agreementEmailError: emailErrorMsg,
            updatedAt: now,
          }

          await appDocRef.set(emailFailMeta, { merge: true })
          await userDocRef.set(emailFailMeta, { merge: true })
        }
      } catch (mailErr: any) {
        emailStatus = "failed"
        emailErrorMsg = mailErr?.message || "Unexpected email error"
        console.error("[Agreement Sign] Error sending agreement email:", emailErrorMsg)

        const emailFailMeta = {
          agreementEmailStatus: "failed",
          agreementEmailRecipient: partnerEmail,
          agreementEmailError: emailErrorMsg,
          updatedAt: now,
        }

        await appDocRef.set(emailFailMeta, { merge: true }).catch(() => {})
        await userDocRef.set(emailFailMeta, { merge: true }).catch(() => {})
      }
    } else {
      console.warn(`[Agreement Sign] No registered email found for partner ${cleanPhone}, skipping email.`)
      const noEmailMeta = {
        agreementEmailStatus: "skipped_no_email",
        updatedAt: now,
      }
      await appDocRef.set(noEmailMeta, { merge: true }).catch(() => {})
      await userDocRef.set(noEmailMeta, { merge: true }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: "Agreement executed successfully",
      dsaCode,
      signedAt: signedAtIso,
      emailSent,
      emailStatus,
    })
  } catch (error: any) {
    console.error("Agreement Signing API Error:", error)
    return NextResponse.json({ error: messageFor(error, "Failed to process agreement signature.") }, { status: 500 })
  }
}

function messageFor(err: unknown, fallback: string): string {
  return (err as { message?: string })?.message || fallback
}
