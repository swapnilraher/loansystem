import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"
import { generatePartnerAgreementPdf } from "@/lib/pdf-generator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mobile = searchParams.get("mobile") || searchParams.get("phoneNumber") || ""
    const id = searchParams.get("id") || ""

    if (!mobile && !id) {
      return NextResponse.json({ error: "Mobile number or Application ID is required" }, { status: 400 })
    }

    const db = getAdminDb()
    const docId = mobile || id
    const appDoc = await db.collection("partner_applications").doc(docId).get()
    const appData = appDoc.exists ? appDoc.data() : {}

    const userDoc = await db.collection("users").doc(docId).get()
    const userData = userDoc.exists ? userDoc.data() : {}

    const partnerName = userData?.fullName || appData?.fullName || appData?.contactPersonName || "Partner"
    const dsaCode = userData?.dsaCode || appData?.dsaCode || "TSM-PARTNER"
    const partnerEmail = userData?.email || appData?.email || ""

    const isPreview = searchParams.get("preview") === "true" || (!appData?.agreementSigned && !userData?.agreementSigned)
    const panNumber = appData?.panNumber || userData?.pan || ""
    const bankAccountNumber = appData?.bankDetails?.accountNumber || userData?.bankAccountNumber || ""
    const bankName = appData?.bankDetails?.bankName || userData?.bankName || ""
    const ifscCode = appData?.bankDetails?.ifsc || userData?.ifscCode || ""
    const gstin = appData?.gstin || userData?.gstin || ""

    const pdfBuffer = generatePartnerAgreementPdf({
      fullName: partnerName,
      firmName: appData?.firmName || userData?.firmName || "",
      partnerType: appData?.partnerType || userData?.partnerType || "Individual",
      firmType: appData?.firmType || userData?.firmType || "",
      designation: appData?.designation || userData?.designation || "Partner",
      dsaCode: dsaCode,
      mobileNumber: mobile || appData?.mobileNumber || "",
      email: partnerEmail,
      panNumber: panNumber,
      bankAccountNumber: bankAccountNumber,
      bankName: bankName,
      ifscCode: ifscCode,
      gstin: gstin,
      addressLine1: appData?.addressLine1 || userData?.address?.line1 || "",
      addressLine2: appData?.addressLine2 || userData?.address?.line2 || "",
      city: appData?.city || userData?.address?.city || "",
      stateName: appData?.stateName || userData?.address?.state || "",
      pinCode: appData?.pinCode || userData?.address?.pincode || "",
      signedAt: appData?.agreementSignedAt || userData?.agreementSignedAt || new Date().toISOString(),
      ipAddress: appData?.agreementIp || userData?.agreementIp || "127.0.0.1",
      isPreview: isPreview,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Techstar_Money_Agreement_${dsaCode}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Download Agreement PDF Error:", error)
    return NextResponse.json({ error: "Failed to generate agreement PDF" }, { status: 500 })
  }
}
