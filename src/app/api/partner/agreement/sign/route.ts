import { NextResponse } from "next/server"
import crypto from "crypto"
import { getAdminDb } from "@/lib/firebase-admin"
import { generatePartnerAgreementPdf } from "@/lib/pdf-generator"
import { generateNextDsaCode } from "@/lib/dsaCodeGenerator"
import { sendSignedAgreementEmail } from "@/lib/emailService"

const OTP_SALT = process.env.OTP_HASH_SALT || "TSM_SECURE_FINTECH_SALT_2026"

/** Agreement identity: one MOU per application, per type, per version. */
const AGREEMENT_TYPE = "MOU"
const AGREEMENT_VERSION = "v1"

/**
 * Stable agreement document id. Keyed on the mobile number rather than the
 * application id because the application id changes from `TSM-DRAFT-…` to
 * `TSM-DSA-…` at submission time, while the agreement identity must not.
 */
function agreementDocId(cleanPhone: string): string {
  return `${cleanPhone}_${AGREEMENT_TYPE}_${AGREEMENT_VERSION}`
}

function hashOtp(otp: string, phone: string): string {
  return crypto
    .createHmac("sha256", OTP_SALT)
    .update(`${phone}:${otp.trim()}`)
    .digest("hex")
}

function messageFor(err: unknown, fallback: string): string {
  return (err as { message?: string })?.message || fallback
}

function serializeAgreement(data: any) {
  if (!data) return null
  const signedAt = data.agreementSignedAt?.toDate
    ? data.agreementSignedAt.toDate().toISOString()
    : data.agreementSignedAt || null
  return {
    agreementId: data.agreementId,
    applicationId: data.applicationId || null,
    userId: data.userId || null,
    agreementType: data.agreementType || AGREEMENT_TYPE,
    agreementVersion: data.agreementVersion || AGREEMENT_VERSION,
    agreementStatus: data.agreementStatus || "pending",
    agreementSigned: data.agreementStatus === "signed",
    agreementSignedAt: signedAt,
    agreementDocumentUrl: data.agreementDocumentUrl || null,
    agreementReferenceId: data.agreementReferenceId || null,
    signingProvider: data.signingProvider || null,
    signingProviderReference: data.signingProviderReference || null,
    dsaCode: data.dsaCode || null,
  }
}

/**
 * GET — read the existing agreement. Never generates or signs anything, so
 * opening the agreement screen repeatedly costs nothing.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cleanPhone = String(searchParams.get("mobile") || searchParams.get("phoneNumber") || "")
      .replace(/\D/g, "")
      .slice(-10)

    if (!cleanPhone) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 })
    }

    const db = getAdminDb()
    const snap = await db.collection("partner_agreements").doc(agreementDocId(cleanPhone)).get()

    if (!snap.exists) {
      // Fall back to the flags stored on the application for agreements signed
      // before the dedicated agreement collection existed.
      const appSnap = await db.collection("partner_applications").doc(cleanPhone).get()
      const appData = appSnap.exists ? appSnap.data() : null
      if (appData?.agreementSigned) {
        return NextResponse.json({
          exists: true,
          agreement: {
            agreementId: agreementDocId(cleanPhone),
            applicationId: appData?.applicationId || null,
            userId: cleanPhone,
            agreementType: AGREEMENT_TYPE,
            agreementVersion: AGREEMENT_VERSION,
            agreementStatus: "signed",
            agreementSigned: true,
            agreementSignedAt: appData?.agreementSignedAt || null,
            agreementDocumentUrl: appData?.agreementPdfUrl || null,
            agreementReferenceId: null,
            dsaCode: appData?.dsaCode || null,
          },
        })
      }
      return NextResponse.json({ exists: false, agreement: null })
    }

    return NextResponse.json({ exists: true, agreement: serializeAgreement(snap.data()) })
  } catch (error: any) {
    console.error("Agreement fetch error:", error)
    return NextResponse.json({ error: "Failed to load agreement." }, { status: 500 })
  }
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
    const agreementRef = db.collection("partner_agreements").doc(agreementDocId(cleanPhone))

    // ─── 0. IDEMPOTENCY: RETURN AN ALREADY-SIGNED AGREEMENT UNTOUCHED ───
    // Checked before OTP so a partner who is already signed is never asked to
    // verify again, and no second PDF / email / DSA code is ever produced.
    const preSnap = await agreementRef.get()
    if (preSnap.exists && preSnap.data()?.agreementStatus === "signed") {
      const existing = serializeAgreement(preSnap.data())
      return NextResponse.json({
        success: true,
        alreadySigned: true,
        message: "Agreement already signed.",
        agreement: existing,
        dsaCode: existing?.dsaCode || "",
        signedAt: existing?.agreementSignedAt,
        agreementPdfUrl: existing?.agreementDocumentUrl,
        emailSent: true,
        emailStatus: "skipped_duplicate",
      })
    }

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
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1"
    const applicationId = appData?.applicationId || `TSM-DSA-${cleanPhone}`

    // ─── 3. ATOMIC CLAIM ───
    // A transaction on the agreement document makes generation single-shot:
    // concurrent sign requests contend on one document, and only the winner
    // proceeds to generate. Any loser sees `signed` and returns the existing one.
    let existingDsaCode: string = userData?.dsaCode || appData?.dsaCode || ""
    let claimed = false

    try {
      const claimResult = await db.runTransaction(async (tx: any) => {
        const snap = await tx.get(agreementRef)
        const data = snap.exists ? snap.data() : null

        if (data?.agreementStatus === "signed") {
          return { alreadySigned: true, data }
        }

        tx.set(
          agreementRef,
          {
            agreementId: agreementDocId(cleanPhone),
            applicationId,
            userId: cleanPhone,
            mobileNumber: cleanPhone,
            agreementType: AGREEMENT_TYPE,
            agreementVersion: AGREEMENT_VERSION,
            agreementStatus: "generating",
            claimedAt: now,
            agreementIp: clientIp,
            createdAt: data?.createdAt || now,
            updatedAt: now,
          },
          { merge: true }
        )
        return { alreadySigned: false, data }
      })

      if (claimResult.alreadySigned) {
        const existing = serializeAgreement(claimResult.data)
        return NextResponse.json({
          success: true,
          alreadySigned: true,
          message: "Agreement already signed.",
          agreement: existing,
          dsaCode: existing?.dsaCode || "",
          signedAt: existing?.agreementSignedAt,
          agreementPdfUrl: existing?.agreementDocumentUrl,
          emailSent: true,
          emailStatus: "skipped_duplicate",
        })
      }
      claimed = true
      existingDsaCode = existingDsaCode || claimResult.data?.dsaCode || ""
    } catch (txErr) {
      console.warn("Agreement claim transaction note:", txErr)
    }

    // A DSA code is minted only once — reused whenever one already exists.
    const dsaCode = existingDsaCode || (await generateNextDsaCode(db))
    const partnerEmail = email || userData?.email || appData?.email || ""
    const partnerName = userData?.fullName || appData?.fullName || appData?.contactPersonName || "Partner"

    // 4. Mark Agreement as Signed in Firestore
    const agreementMeta = {
      agreementSigned: true,
      agreementStatus: "signed",
      agreementSignedAt: signedAtIso,
      agreementIp: clientIp,
      agreementSignatureType: "OTP_VERIFIED",
      agreementVersion: AGREEMENT_VERSION,
      currentStepKey: "COMPLETED",
      updatedAt: now,
    }

    await appDocRef.set(agreementMeta, { merge: true })
    await userDocRef.set(agreementMeta, { merge: true })

    // Also update by UID if user record is keyed by UID
    const userQuery = await db.collection("users").where("mobileNumber", "==", cleanPhone).get()
    userQuery.forEach((docSnap: any) => {
      docSnap.ref.set(agreementMeta, { merge: true })
    })

    // 5. Prepare Data & Generate Signed Agreement PDF
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

    // Upload the executed MOU once and keep the URL — later views reuse it.
    let agreementPdfUrl: string = `/api/partner/agreement/pdf?mobile=${cleanPhone}`
    let cloudinaryPublicId: string | null = null
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
        cloudinaryPublicId = uploadRes.public_id || null
      }
    } catch (cErr) {
      console.warn("Cloudinary MOU PDF upload warning:", cErr)
    }

    // Save final PDF URL to Firestore
    const pdfMeta = {
      agreementSigned: true,
      agreementStatus: "signed",
      agreementSignedAt: signedAtIso,
      agreementIp: clientIp,
      agreementPdfUrl: agreementPdfUrl,
      dsaCode,
      updatedAt: now,
    }

    await appDocRef.set(pdfMeta, { merge: true })
    await userDocRef.set(pdfMeta, { merge: true })

    const userPdfQuery = await db.collection("users").where("mobileNumber", "==", cleanPhone).get()
    userPdfQuery.forEach((docSnap: any) => {
      docSnap.ref.set(pdfMeta, { merge: true })
    })

    // ─── 6. PERSIST THE AGREEMENT RECORD (permanent, re-readable) ───
    const agreementRecord = {
      agreementId: agreementDocId(cleanPhone),
      applicationId,
      userId: cleanPhone,
      mobileNumber: cleanPhone,
      agreementType: AGREEMENT_TYPE,
      agreementVersion: AGREEMENT_VERSION,
      agreementStatus: "signed",
      agreementSignedAt: signedAtIso,
      agreementDocumentUrl: agreementPdfUrl,
      agreementCloudinaryPublicId: cloudinaryPublicId,
      agreementReferenceId: `${applicationId}-${AGREEMENT_TYPE}-${AGREEMENT_VERSION}`,
      signingProvider: "TECHSTAR_OTP",
      signingProviderReference: `OTP_VERIFIED:${cleanPhone}:${now.getTime()}`,
      signatureType: "OTP_VERIFIED",
      agreementIp: clientIp,
      dsaCode,
      partnerName,
      partnerEmail,
      claimed,
      createdAt: preSnap.exists ? preSnap.data()?.createdAt || now : now,
      updatedAt: now,
    }
    await agreementRef.set(agreementRecord, { merge: true })

    // 7. Send Email with PDF Attachment via EmailService (with duplicate protection & error logging)
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
          await agreementRef.set(emailLogMeta, { merge: true })
          userPdfQuery.forEach((docSnap: any) => {
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
      alreadySigned: false,
      message: "Agreement executed successfully",
      agreement: serializeAgreement(agreementRecord),
      dsaCode,
      signedAt: signedAtIso,
      agreementPdfUrl,
      emailSent,
      emailStatus,
    })
  } catch (error: any) {
    console.error("Agreement Signing API Error:", error)
    return NextResponse.json({ error: messageFor(error, "Failed to process agreement signature.") }, { status: 500 })
  }
}
