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
  addressLine1?: string
  addressLine2?: string
  city?: string
  stateName?: string
  pinCode?: string
  signedAt?: string
  ipAddress?: string
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

  let y = 18
  const leftMargin = 15
  const rightMargin = 195
  const contentWidth = 180
  const pageHeight = 280

  function checkPageBreak(neededSpace: number = 10) {
    if (y + neededSpace > pageHeight) {
      doc.addPage()
      y = 18
    }
  }

  // ── Header ─────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(23, 105, 170) // Techstar Blue #1769AA
  doc.text("TECHSTAR MONEY SOLUTION PVT. LTD.", 105, y, { align: "center" })

  y += 6
  doc.setFontSize(13)
  doc.setTextColor(30, 41, 59)
  doc.text("MEMORANDUM OF UNDERSTANDING (MOU)", 105, y, { align: "center" })

  y += 4
  doc.setLineWidth(0.5)
  doc.setDrawColor(23, 105, 170)
  doc.line(leftMargin, y, rightMargin, y)
  y += 8

  // ── Document Details Box ───────────────────────────────────────────────
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(leftMargin, y, contentWidth, 24, 2, 2, "FD")

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text(`Partner Code (DSA Code): ${data.dsaCode}`, leftMargin + 4, y + 6)
  doc.text(`Date of Execution: ${today}`, leftMargin + 100, y + 6)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105)
  doc.text(`Partner Name: ${data.fullName}`, leftMargin + 4, y + 12)
  doc.text(`Mobile: +91 ${data.mobileNumber}`, leftMargin + 100, y + 12)

  doc.text(`Email: ${data.email || "N/A"}`, leftMargin + 4, y + 18)
  doc.text(`Category: ${data.partnerType || "Individual"} ${data.firmType ? `(${data.firmType})` : ""}`, leftMargin + 100, y + 18)

  y += 30

  // ── Preamble ────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(30, 41, 59)

  const preamble = `THIS MEMORANDUM OF UNDERSTANDING (MOU) is made on this ${today} by and between:

FIRST PART:
TECHSTAR MONEY SOLUTION PVT. LTD., having its registered office at Office No. 1, Ground Floor, Chhatrapati Sambhajinagar, Maharashtra - 431001 (hereinafter referred to as "TECHSTAR MONEY", which expression shall unless repugnant to the context or meaning thereof include its successors and assigns) of the FIRST PART.

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
      content: `a) Referral Partner shall refer clients interested in availing loan facilities (Personal Loan, Business Loan, Home Loan, LAP, MSME Loan, Overdraft, Cash Credit, etc.) to representatives of TECHSTAR MONEY.
b) TECHSTAR MONEY will arrange finance through its empaneled Banks and NBFCs based on client documents and eligibility criteria.
c) Fulfillment, bank processing, and lead updates will be managed by TECHSTAR MONEY while keeping the Referral Partner informed.
d) Referral Partner shall ensure that all client details provided are authentic and obtained with due customer consent.`
    },
    {
      title: "2. COMMERCIAL TERMS & PAYOUTS",
      content: `a) Payouts to Referral Partner shall be calculated on the net payout received by TECHSTAR MONEY post bank loan disbursal, as per the official payout slab shared separately.
b) All payments are subject to applicable Statutory Tax Deductions (TDS) as per Income Tax laws.
c) GST shall be payable extra provided the Referral Partner holds a valid GST Registration and submits GST-compliant invoices.
d) TECHSTAR MONEY shall not reimburse out-of-pocket expenses (such as travel, courier, or local staff costs) incurred by the Referral Partner.`
    },
    {
      title: "3. CODE OF CONDUCT & CUSTOMER PROTECTION",
      content: `a) Referral Partner & their team shall strictly avoid collecting any upfront fees, commission, or cash payments from loan applicants.
b) Strictly avoid multi-funding (applying for duplicate loans for the same customer simultaneously across multiple banks without disclosure).
c) Maintain absolute confidentiality of customer data and loan payout structures. Unauthorized disclosure of rate lists or customer records shall attract a penalty of Rs. 2,000,000 (Rupees Two Lakhs) and immediate termination.
d) Strictly adhere to TRAI guidelines regarding telemarketing and unsolicited commercial communications.`
    },
    {
      title: "4. INDEPENDENT CONTRACTOR STATUS",
      content: `This relationship is strictly on a principal-to-principal basis. The Referral Partner acts as an independent contractor and not as an employee, partner, or joint-venture partner of TECHSTAR MONEY. Neither party has authority to bind the other.`
    },
    {
      title: "5. INDEMNITY & LIABILITY",
      content: `The Referral Partner agrees to indemnify and keep indemnified TECHSTAR MONEY, its directors, and employees against any losses, claims, or liabilities arising due to misrepresentation, fraud, forgery of customer signatures, or breach of company policies by the Referral Partner or its personnel.`
    },
    {
      title: "6. TERM & TERMINATION",
      content: `This MOU is valid for a period of 2 (two) years from the execution date. Either party may terminate this agreement by providing 30 days written notice. Existing active loan files submitted prior to notice shall continue to be processed.`
    },
    {
      title: "7. GOVERNING LAW & JURISDICTION",
      content: `This agreement shall be governed by the laws of India. Any disputes arising out of or in connection with this agreement shall be subject to arbitration in Mumbai / Chhatrapati Sambhajinagar.`
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
  checkPageBreak(50)
  y += 4
  doc.setLineWidth(0.5)
  doc.setDrawColor(226, 232, 240)
  doc.line(leftMargin, y, rightMargin, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text("IN WITNESS WHEREOF, the parties hereto have executed this MOU electronically.", leftMargin, y)
  y += 8

  // Box for Signatures
  doc.setFillColor(240, 253, 244) // Light green #F0FDF4
  doc.setDrawColor(187, 247, 208)
  doc.roundedRect(leftMargin, y, contentWidth, 38, 3, 3, "FD")

  // Left Column - Referral Partner Signature
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(22, 101, 52) // Green
  doc.text("✅ ELECTRONICALLY SIGNED BY REFERRAL PARTNER", leftMargin + 4, y + 6)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(30, 41, 59)
  doc.text(`Name: ${data.fullName}`, leftMargin + 4, y + 12)
  doc.text(`DSA Code: ${data.dsaCode}`, leftMargin + 4, y + 17)
  doc.text(`Auth Method: Mobile OTP (+91 ${data.mobileNumber})`, leftMargin + 4, y + 22)
  doc.text(`Verified Timestamp: ${today}`, leftMargin + 4, y + 27)
  if (data.ipAddress) {
    doc.text(`IP Address: ${data.ipAddress}`, leftMargin + 4, y + 32)
  }

  // Right Column - Company Signature
  doc.setFont("helvetica", "bold")
  doc.setTextColor(23, 105, 170)
  doc.text("ON BEHALF OF TECHSTAR MONEY SOLUTION PVT. LTD.", leftMargin + 95, y + 6)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(30, 41, 59)
  doc.text("Authorized Signatory", leftMargin + 95, y + 12)
  doc.text("Techstar Money Solutions", leftMargin + 95, y + 17)
  doc.text("Chhatrapati Sambhajinagar, MH", leftMargin + 95, y + 22)
  doc.text(`Date: ${today}`, leftMargin + 95, y + 27)

  // Convert PDF to Node Buffer
  const arrayBuffer = doc.output("arraybuffer")
  return Buffer.from(arrayBuffer)
}
