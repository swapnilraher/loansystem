/**
 * The contract the bulk WhatsApp campaign builder (browser) and the sending
 * worker (server) both speak.
 *
 * Deliberately free of any `firebase-admin` or credential import, exactly like
 * `whatsappMediaShared`: the campaign builder is a client component, so
 * anything it needs has to be safe to ship to the browser. Phone normalisation
 * and variable substitution live here so the preview the Admin approves is
 * produced by the same code that later sends the message — a preview built by a
 * second implementation is a preview that can lie.
 */

/** How one of the two messages in a campaign is composed. */
export type CampaignMessageMode = "template" | "custom"

/** Where the image attached to Message 1 comes from. */
export type CampaignImageSource = "none" | "url" | "upload"

export interface CampaignMessage {
  /** Message 1 and Message 2 are each opt-in; at least one must be on. */
  enabled: boolean
  mode: CampaignMessageMode
  /** `mode: "template"` — the approved template's name and language code. */
  templateName: string
  templateLanguage: string
  /**
   * Values for the template body's `{{1}}…{{n}}`, in order. The literal
   * `{{Name}}` in any of them is replaced with the recipient's name.
   */
  bodyParams: string[]
  /**
   * Public image URL. For a template it fills an IMAGE header; for a custom
   * message it is sent as an image with the text as its caption.
   */
  imageUrl: string
  imageSource: CampaignImageSource
  /** `mode: "custom"` — free text, `{{Name}}` supported. */
  text: string
}

export function emptyMessage(enabled: boolean): CampaignMessage {
  return {
    enabled,
    mode: "template",
    templateName: "",
    templateLanguage: "en_US",
    bodyParams: [],
    imageUrl: "",
    imageSource: "none",
    text: "",
  }
}

/** One row of the uploaded sheet, after mapping and validation. */
export interface CampaignRecipient {
  /** Always `91` + 10 digits. */
  phone: string
  name: string
  /** 1-based row number in the uploaded file, for the "invalid rows" list. */
  row: number
}

export interface InvalidRecipient {
  row: number
  raw: string
  name: string
  reason: string
}

/** Per-message delivery state stored against each recipient. */
export type MessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped"

export interface CampaignCounts {
  sent: number
  delivered: number
  read: number
  failed: number
  pending: number
}

export type CampaignStatus = "queued" | "running" | "completed" | "cancelled" | "failed"

export interface CampaignSummary {
  id: string
  name: string
  createdAt: string
  createdByName: string
  status: CampaignStatus
  totalRecipients: number
  totalMessages: number
  processed: number
  counts: CampaignCounts
}

/** A template as the builder needs it, trimmed down from the Graph response. */
export interface WaTemplate {
  name: string
  language: string
  status: string
  category: string
  /** Number of `{{n}}` or named placeholders in the body. */
  variableCount: number
  /** Names of variables in order of appearance (e.g. ["1", "2"] or ["customer_name"]) */
  variableNames: string[]
  bodyText: string
  /** `true` when the template's header expects an image. */
  hasImageHeader: boolean
  hasHeaderText: boolean
}

/**
 * Every phone number ends up as `91` + 10 digits, or is rejected.
 *
 * The rules below are what real uploaded sheets actually contain: `+91 98765
 * 43210`, `919876543210`, `09876543210`, `9876543210`, and Excel's habit of
 * turning a long number into `9.19877E+11`. A number that already carries `91`
 * must not have a second `91` bolted on — that is the single most common way a
 * bulk send silently reaches nobody.
 */
export function normalizePhone(raw: unknown): { phone: string | null; reason: string } {
  let text = String(raw ?? "").trim()
  if (!text) return { phone: null, reason: "Empty" }

  // Excel scientific notation (9.19876E+11) survives as a number, so expand it
  // before stripping punctuation or the exponent is lost.
  if (/e\+?\d+$/i.test(text)) {
    const asNumber = Number(text)
    if (Number.isFinite(asNumber)) text = asNumber.toFixed(0)
  }

  // Excel frequently exports numbers as floats with trailing '.0'
  if (text.includes(".")) {
    text = text.split(".")[0].trim()
  }

  const digits = text.replace(/\D/g, "")
  if (!digits) return { phone: null, reason: "No digits or blank" }

  let ten = ""

  if (digits.length === 10) {
    ten = digits
  } else if (digits.length === 11 && digits.startsWith("0")) {
    ten = digits.slice(1)
  } else if (digits.length === 12 && digits.startsWith("91")) {
    // Already carries the country code — take the last 10, never prepend again.
    ten = digits.slice(2)
  } else if (digits.length === 13 && digits.startsWith("091")) {
    ten = digits.slice(3)
  } else if (digits.length === 14 && digits.startsWith("0091")) {
    ten = digits.slice(4)
  } else {
    return { phone: null, reason: `Unexpected length (${digits.length} digits)` }
  }

  // Indian mobile numbers start 6-9. Landlines and truncated cells fail here
  // rather than at Meta's end, where the error is a generic 131026.
  if (!/^[6-9]\d{9}$/.test(ten)) {
    return { phone: null, reason: "Not a valid 10-digit Indian mobile number" }
  }

  return { phone: `91${ten}`, reason: "" }
}

/** `91XXXXXXXXXX` → `+91 XXXXX XXXXX`, for display only. */
export function displayPhone(phone: string): string {
  if (/^91\d{10}$/.test(phone)) {
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`
  }
  return phone
}

const NAME_TOKEN = /\{\{\s*name\s*\}\}/gi

/** Replaces `{{Name}}` (any casing/spacing) with the recipient's name. */
export function fillName(text: string, name: string): string {
  return (text || "").replace(NAME_TOKEN, name || "there")
}

/** Extracts all variable placeholders (numbered or named, like {{1}} or {{customer_name}}) in order. */
export function extractTemplateVariables(bodyText: string): string[] {
  const found: string[] = []
  for (const match of (bodyText || "").matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)) {
    const token = match[1].trim()
    if (!found.includes(token)) {
      found.push(token)
    }
  }
  return found
}

/** Counts the distinct placeholders in a template body. */
export function countTemplateVariables(bodyText: string): number {
  return extractTemplateVariables(bodyText).length
}

/**
 * What one recipient will actually receive, as text.
 *
 * Used by the Preview panel and by nothing else — the send path builds the
 * Graph payload from the same `CampaignMessage`, so this stays a rendering of
 * the same inputs rather than a parallel description of them.
 */
export function previewMessage(
  message: CampaignMessage,
  recipient: { name: string },
  template?: WaTemplate | null
): { image: string; text: string } {
  if (!message.enabled) return { image: "", text: "" }

  if (message.mode === "custom") {
    return {
      image: message.imageUrl,
      text: fillName(message.text, recipient.name),
    }
  }

  const tName = String(message.templateName || "").trim().toLowerCase()
  const isConnector = tName === "connector" || tName.includes("connector")
  const defaultBody = isConnector
    ? "Hello {{customer_name}}\n\n💰 Loan Business करता? अधिक कमवायचंय?\nआता Join करा Techstar Money Solution सोबत आणि मिळवा:\n\n🔹 50+ Loan Partners\n🔹 Highest Payout Opportunities\n🔹 Flexible Payout\n🔹 Fast Digital Onboarding\n🔹 Banks + NBFCs + Fintechs\n\n🚀 More Leads | More Loans | More Earnings\n\nआजच Techstar चे Loan Connector / DSA Partner बना!"
    : ""

  const body = template?.bodyText || defaultBody || ""
  let text = body
  const vars = extractTemplateVariables(body)

  if (vars.length > 0) {
    vars.forEach((v, index) => {
      const param = message.bodyParams[index] || "{{Name}}"
      const value = fillName(param, recipient.name)
      text = text
        .replace(new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, "g"), value)
        .replace(new RegExp(`\\{\\{\\s*${index + 1}\\s*\\}\\}`, "g"), value)
    })
  }

  if (text.includes("{{customer_name}}")) {
    text = text.replace(/\{\{\s*customer_name\s*\}\}/g, recipient.name || "Partner")
  }

  const defaultImg = isConnector
    ? "https://res.cloudinary.com/ugpy6fko/image/upload/v1788543861/wa-campaigns/u3xz2l1lpx7wylsxitog.png"
    : ""

  return {
    image: message.imageUrl || defaultImg || (template?.hasImageHeader ? message.imageUrl : ""),
    text: text || `(template: ${message.templateName})`,
  }
}

/** Guardrails the builder enforces before the Send button does anything. */
export function validateMessage(
  message: CampaignMessage,
  label: string,
  template?: WaTemplate | null
): string | null {
  if (!message.enabled) return null

  if (message.mode === "template") {
    if (!message.templateName) return `${label}: choose a template.`
    const vars = template ? extractTemplateVariables(template.bodyText) : []
    const needed = template ? template.variableCount : message.bodyParams.length
    for (let i = 0; i < needed; i++) {
      if (!String(message.bodyParams[i] || "").trim()) {
        const vName = vars[i] || `${i + 1}`
        return `${label}: variable {{${vName}}} is empty.`
      }
    }
    if (template?.hasImageHeader && !message.imageUrl) {
      return `${label}: this template has an image header, so an image is required.`
    }
    return null
  }

  if (!message.text.trim() && !message.imageUrl) {
    return `${label}: add some text or an image.`
  }
  return null
}
