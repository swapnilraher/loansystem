import { jsPDF } from "jspdf"

export interface PartnerAgreementData {
  fullName: string
  firmName?: string
  partnerType?: string
  firmType?: string
  designation?: string
  dsaCode: string
  mobileNumber: string
  email: string
  panNumber?: string
  bankAccountNumber?: string
  bankName?: string
  ifscCode?: string
  gstin?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  stateName?: string
  pinCode?: string
  signedAt?: string
  ipAddress?: string
  isPreview?: boolean
}

export function generatePartnerAgreementPdf(data: PartnerAgreementData): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const today = data.signedAt
    ? new Date(data.signedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })

  const partnerAddress = [
    data.addressLine1,
    data.addressLine2,
    data.city,
    data.stateName,
    data.pinCode,
  ]
    .filter(Boolean)
    .join(", ") || "Address provided at onboarding"

  const partnerNameFormatted = data.firmName
    ? `${data.firmName} (Represented by ${data.fullName})`
    : data.fullName

  const leftMargin = 15
  const rightMargin = 195
  const contentWidth = 180
  const pageHeight = 280

  // ── FIRST PAGE LETTERHEAD HEADER (NO WATERMARK, NO FOOTER) ─────────────
  // Top green accent bar
  doc.setFillColor(16, 185, 129) // #10B981 Emerald Green
  doc.rect(0, 0, 210, 3.5, "F")

  // Left Logo & Branding Section
  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(15, 41, 66) // Dark Navy #0F2942
  doc.text("TECHSTAR", leftMargin, 12)

  doc.setFontSize(14)
  doc.setTextColor(16, 185, 129) // Emerald Green
  doc.text("MONEY SOLUTION", leftMargin + 35, 12)

  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(21, 128, 61) // Dark Green
  doc.text("SMART FINANCE, FAST SOLUTIONS", leftMargin, 16)

  // Subtitle Dark Pill Box
  doc.setFillColor(15, 41, 66)
  doc.roundedRect(leftMargin, 18, 76, 5, 1, 1, "F")
  doc.setFontSize(6.2)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("TECHSTAR MONEY SOLUTION PRIVATE LIMITED", leftMargin + 38, 21.5, { align: "center" })

  doc.setFontSize(6.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 116, 139)
  doc.text("CIN: U66190MR2026PTC478675", leftMargin, 26.5)

  // Vertical Separator Line in Header
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(98, 6, 98, 29)

  // Right Side Registered Office & Contact Info
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 118, 110)
  doc.text("REGISTERED OFFICE :", 102, 10)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.3)
  doc.setTextColor(51, 65, 85)
  doc.text("Office No. 18, Gut No 173/3, Morya Pride, Mayur Park,", 102, 13.5)
  doc.text("Chhatrapati Sambhajinagar, MH - 431008", 102, 16.8)

  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 41, 66)
  doc.text("Phone:", 102, 21.5)
  doc.setFont("helvetica", "normal")
  doc.text("+91 9579005645", 115, 21.5)

  doc.setFont("helvetica", "bold")
  doc.text("Email:", 102, 25)
  doc.setFont("helvetica", "normal")
  doc.text("info@techstarsolution.in", 115, 25)

  doc.setFont("helvetica", "bold")
  doc.text("Web:", 152, 25)
  doc.setFont("helvetica", "normal")
  doc.text("www.techstarsolution.in", 162, 25)

  // Bottom Header Green Divider Line
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(0.6)
  doc.line(leftMargin, 30.5, rightMargin, 30.5)

  let y = 36 // Content starts below the header on page 1

  function checkPageBreak(neededSpace: number = 10) {
    if (y + neededSpace > pageHeight) {
      doc.addPage()
      y = 18
    }
  }

  // ── Document Title ──────────────────────────────────────────────────────
  // Mask PAN: e.g. ABCDE••••F
  const maskedPan = data.panNumber && data.panNumber.length === 10
    ? `${data.panNumber.slice(0, 5)}••••${data.panNumber.slice(9)}`
    : (data.panNumber || "—")

  // Mask Bank Account: e.g. ••••••••1234
  const cleanBankAcct = data.bankAccountNumber ? data.bankAccountNumber.replace(/\s+/g, "") : ""
  const maskedBank = cleanBankAcct.length >= 4
    ? `••••••••${cleanBankAcct.slice(-4)}`
    : (cleanBankAcct || "—")

  // ── Document Title ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(15, 41, 66)
  const docTitle = data.isPreview
    ? "MEMORANDUM OF UNDERSTANDING (MOU) — PREVIEW COPY"
    : "MEMORANDUM OF UNDERSTANDING (MOU)"
  doc.text(docTitle, 105, y, { align: "center" })

  y += 4
  doc.setLineWidth(0.4)
  doc.setDrawColor(23, 105, 170)
  doc.line(leftMargin, y, rightMargin, y)
  y += 6

  // ── Document Details Box ───────────────────────────────────────────────
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(leftMargin, y, contentWidth, 34, 2, 2, "FD")

  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text(`Partner Code: ${data.dsaCode}`, leftMargin + 4, y + 5.5)
  doc.text(`Date of Execution: ${today}`, leftMargin + 95, y + 5.5)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105)
  doc.text(`Partner Name: ${data.fullName}`, leftMargin + 4, y + 11.5)
  doc.text(`Mobile: +91 ${data.mobileNumber}`, leftMargin + 95, y + 11.5)

  doc.text(`PAN (Masked): ${maskedPan}`, leftMargin + 4, y + 17.5)
  doc.text(`Email: ${data.email || "N/A"}`, leftMargin + 95, y + 17.5)

  doc.text(`Bank A/C: ${maskedBank} ${data.bankName ? `(${data.bankName})` : ""}`, leftMargin + 4, y + 23.5)
  doc.text(`IFSC Code: ${data.ifscCode || "—"}`, leftMargin + 95, y + 23.5)

  doc.text(`Category: ${data.partnerType || "Individual"} ${data.firmType ? `(${data.firmType})` : ""}`, leftMargin + 4, y + 29.5)
  doc.text(`GSTIN: ${data.gstin || "Not Applicable"}`, leftMargin + 95, y + 29.5)

  y += 40

  // ── Preamble ────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(30, 41, 59)

  const preamble = `THIS MEMORANDUM OF UNDERSTANDING (MOU) is made on this ${today} by and between:

FIRST PART:
TECHSTAR MONEY SOLUTION PVT. LTD., having its registered office at Office No. 18, Gut No 173/3, Morya Pride, Mayur Park, Chhatrapati Sambhajinagar, Maharashtra - 431008 (hereinafter referred to as "TECHSTAR MONEY", which expression shall unless repugnant to the context or meaning thereof include its successors and assigns) of the FIRST PART.

AND

SECOND PART:
${partnerNameFormatted}, having address at: ${partnerAddress} (hereinafter referred to as "Referral Partner / DSA Partner", which expression shall include their nominees, legal heirs, and permitted assigns) of the SECOND PART.`

  const preambleLines = doc.splitTextToSize(preamble, contentWidth)
  doc.text(preambleLines, leftMargin, y)
  y += preambleLines.length * 4.5 + 4

  // ── Recitals ───────────────────────────────────────────────────────────
  checkPageBreak(30)
  doc.setFont("helvetica", "bold")
  doc.text("WHEREAS:", leftMargin, y)
  y += 5

  doc.setFont("helvetica", "normal")
  const recitalsText = `1. TECHSTAR MONEY is an established Direct Sales Associate (DSA) and financial services distributor in India, supporting clients in meeting their financial requirements with partner Banks and NBFCs.
2. The Referral Partner is engaged in referring clients seeking financial products including Personal Loans, Business Loans, Home Loans, Loans Against Property (LAP), Commercial Purchase, Working Capital, and Overdraft facilities.
3. Both parties desire to record the terms and conditions of their business relationship in writing.`

  const recitalsLines = doc.splitTextToSize(recitalsText, contentWidth)
  doc.text(recitalsLines, leftMargin, y)
  y += recitalsLines.length * 4.5 + 6

  // ── Terms & Conditions Section ─────────────────────────────────────────
  const sections = [
    {
      title: "1. SERVICES & SCOPE OF WORK",
      content: `a) Referral Partner shall refer clients seeking financial products including Personal Loans, Business Loans, Home Loans, Loans Against Property (LAP), MSME / Commercial Purchase, Working Capital, Overdraft, and Cash Credit facilities to TECHSTAR MONEY.
b) TECHSTAR MONEY will arrange finance through its empaneled Banks and NBFCs based on client documents and eligibility criteria.
c) Lead Connectivity & Updates: TECHSTAR MONEY may share location-relevant customer leads with the Referral Partner. The Referral Partner shall share client connectivity with representatives of TECHSTAR MONEY, and lead fulfillment will be managed by TECHSTAR MONEY while keeping the Referral Partner informed.
d) Referral Partner shall ensure that all client details provided are authentic, verified, and obtained with explicit customer consent.`
    },
    {
      title: "2. COMMERCIAL TERMS, PAYOUTS & RECOVERIES",
      content: `a) Payouts to Referral Partner shall be calculated on the net payout received by TECHSTAR MONEY post bank loan disbursal, based on the official payout slab shared separately.
b) All payouts are subject to applicable Statutory Tax Deductions (TDS) as per Income Tax laws.
c) GST shall be paid extra provided the Referral Partner holds a valid GST Registration and submits GST-compliant invoices.
d) Bank Deductions & Clawbacks: Any deduction, chargeback, or clawback made by partner Banks/NBFCs related to loans sourced by the Referral Partner (including future clawbacks due to early cancellation or default) shall be deducted from future payouts or recovered from the Referral Partner.
e) Out-of-pocket expenses (such as travel, courier, or local staff costs) incurred by the Referral Partner shall not be reimbursed by TECHSTAR MONEY.`
    },
    {
      title: "3. CODE OF CONDUCT & ANTI-FRAUD COMPLIANCE",
      content: `a) Zero Cash Collection: Referral Partner & their team shall strictly avoid collecting any upfront fees, commission, remuneration, or cash payments from loan applicants. If found guilty, payouts will be held until the issue is resolved.
b) Anti-Multi-Funding: Strictly avoid multi-funding (applying for duplicate loans for the same customer simultaneously across multiple banks without disclosure), as this is illegal and leads to customer default.
c) Document Authenticity & OSV: Referral Partner shall ensure original KYC documents are sighted (OSV) and documents are self-attested. No forgery of customer or co-applicant signatures is permitted.
d) Non-Poaching & Non-Interference: Referral Partner & personnel shall not induce or influence customers or associates to join competition or divert leads to third parties.
e) Strictly adhere to TRAI / NCPR / NDNC guidelines regarding telemarketing and unsolicited commercial communications.`
    },
    {
      title: "4. DATA CONFIDENTIALITY & INTEGRITY",
      content: `a) Referral Partner shall maintain absolute confidentiality of customer data, commercial rate structures, and company processes. Unauthorized disclosure of rate lists or customer records shall lead to immediate termination of this agreement.
b) Customer database shall be maintained safely and shared with TECHSTAR MONEY at regular intervals as requested.`
    },
    {
      title: "5. INDEPENDENT CONTRACTOR STATUS",
      content: `This relationship is strictly on a principal-to-principal basis. The Referral Partner acts as an independent contractor and not as an employee, partner, or joint-venture partner of TECHSTAR MONEY. Neither party has authority to bind the other, and TECHSTAR MONEY shall not be liable for the employment or wages of the Referral Partner's personnel.`
    },
    {
      title: "6. INDEMNITY & LIABILITY",
      content: `The Referral Partner agrees to indemnify, defend, and hold harmless TECHSTAR MONEY, its directors, and employees against any losses, claims, damages, or liabilities arising due to misrepresentation, fraud, signature forgery, data theft, or breach of company/bank policies by the Referral Partner or its personnel.`
    },
    {
      title: "7. TERM, TERMINATION & JURISDICTION",
      content: `a) Validity: This MOU is valid for a period of 2 (two) years from the execution date. Either party may terminate this agreement by providing 30 days written notice. Active loan files in process prior to notice shall continue to be completed.
b) Governing Law: This agreement shall be governed by the laws of India. Any disputes arising out of or in connection with this agreement shall be subject to arbitration in Chhatrapati Sambhajinagar / Mumbai.`
    }
  ]

  sections.forEach((sec) => {
    checkPageBreak(25)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(23, 105, 170)
    doc.text(sec.title, leftMargin, y)
    y += 5

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    const lines = doc.splitTextToSize(sec.content, contentWidth)
    doc.text(lines, leftMargin, y)
    y += lines.length * 4.2 + 5
  })

  // ── Digital Signature & OTP Verification Block ─────────────────────────
  checkPageBreak(52)
  y += 4
  doc.setLineWidth(0.5)
  doc.setDrawColor(226, 232, 240)
  doc.line(leftMargin, y, rightMargin, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text("IN WITNESS WHEREOF, the parties hereto have executed this MOU electronically.", leftMargin, y)
  y += 8

  // Clean Non-Overlapping Dual Signature Box
  doc.setFillColor(240, 253, 244) // Light green #F0FDF4
  doc.setDrawColor(187, 247, 208)
  doc.roundedRect(leftMargin, y, contentWidth, 40, 3, 3, "FD")

  // Vertical Separator line between Left Partner & Right Company columns
  doc.setDrawColor(187, 247, 208)
  doc.setLineWidth(0.5)
  doc.line(104, y + 4, 104, y + 36)

  // Calculate Tamper-Evident SHA-256 Verification Hash
  const verificationPayload = `${data.dsaCode}|${data.mobileNumber}|${data.fullName}|${data.signedAt || today}|${data.ipAddress || "127.0.0.1"}`
  let cryptoHash = "TSM-SECURE-STAMP"
  try {
    const crypto = require("crypto")
    cryptoHash = crypto.createHash("sha256").update(verificationPayload).digest("hex").slice(0, 32).toUpperCase()
  } catch (e) {
    cryptoHash = `TSM-${Buffer.from(verificationPayload).toString("base64").slice(0, 24)}`
  }

  // Left Column - Referral Partner Signature
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(22, 101, 52) // Dark Green
  doc.text("ELECTRONICALLY SIGNED BY REFERRAL PARTNER", leftMargin + 3, y + 6)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(30, 41, 59)
  doc.text(`Name: ${data.fullName}`, leftMargin + 3, y + 11)
  doc.text(`DSA Code: ${data.dsaCode}`, leftMargin + 3, y + 16)
  doc.text(`Auth Method: Mobile OTP (+91 ${data.mobileNumber})`, leftMargin + 3, y + 21)
  doc.text(`Verified Timestamp: ${today}`, leftMargin + 3, y + 26)
  if (data.ipAddress) {
    doc.text(`IP Address: ${data.ipAddress}`, leftMargin + 3, y + 31)
  }
  doc.setFontSize(6)
  doc.setTextColor(100, 116, 139)
  doc.text(`Digital Seal: SHA256/${cryptoHash}`, leftMargin + 3, y + 36)

  // Right Column - Company Signature
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(23, 105, 170) // Blue
  doc.text("ON BEHALF OF TECHSTAR MONEY SOLUTION PVT. LTD.", 107, y + 6)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(30, 41, 59)
  doc.text("Authorized Signatory", 107, y + 11)
  doc.text("Techstar Money Solutions", 107, y + 16)
  doc.text("Chhatrapati Sambhajinagar, MH", 107, y + 21)
  doc.text(`Execution Date: ${today}`, 107, y + 26)
  doc.setFontSize(6)
  doc.setTextColor(22, 101, 52)
  doc.text(`Status: Verified Electronic Execution (IT Act 2000)`, 107, y + 36)

  // Convert PDF to Node Buffer
  const arrayBuffer = doc.output("arraybuffer")
  return Buffer.from(arrayBuffer)
}
