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
  /**
   * The chosen template's placeholder names, in the same order as
   * `bodyParams` — `["customer_name"]` for a named template, `["1", "2"]` for a
   * positional one.
   *
   * The sender needs this because the Cloud API treats the two kinds
   * differently: a named template's body parameters must each carry
   * `parameter_name`, and a positional one's must not. Carrying the names on
   * the message means the send path never has to guess from the template's
   * name, and never has to re-fetch the template to find out.
   */
  bodyParamNames: string[]
  /**
   * `true` when the chosen template's header is an IMAGE.
   *
   * Sending an image header to a template that has no header is rejected by
   * Meta (132000, "number of parameters does not match"), so this is what
   * decides whether the header component is attached at all.
   */
  hasImageHeader: boolean
  /**
   * `true` when the chosen template carries a COPY_CODE or OTP button, as
   * authentication templates do.
   *
   * Meta rejects such a send unless the code is repeated as a button
   * parameter alongside the body one, so this is what decides whether that
   * extra component is attached. It is read from the template's own buttons
   * rather than from its name, so a newly approved auth template works
   * without a code change.
   */
  hasCopyCodeButton: boolean
}

export function emptyMessage(enabled: boolean): CampaignMessage {
  return {
    enabled,
    mode: "template",
    templateName: "",
    templateLanguage: "en",
    bodyParams: [],
    imageUrl: "",
    imageSource: "none",
    text: "",
    bodyParamNames: [],
    hasImageHeader: false,
    hasCopyCodeButton: false,
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

export interface WaTemplateButton {
  type: string
  text: string
  url?: string
  phone_number?: string
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
  footerText?: string
  buttons?: WaTemplateButton[]
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

/**
 * A template placeholder: `{{1}}` or `{{customer_name}}`, with or without
 * padding inside the braces. One definition, so the extractor and the preview
 * renderer can never disagree about what counts as a variable.
 */
const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

/** Extracts all variable placeholders (numbered or named, like {{1}} or {{customer_name}}) in order. */
export function extractTemplateVariables(bodyText: string): string[] {
  const found: string[] = []
  for (const match of (bodyText || "").matchAll(PLACEHOLDER)) {
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
 * Whether Meta will expect the code echoed back as a button parameter: the
 * COPY_CODE button on an authentication template, or the OTP button on its
 * one-tap variant. Button types come through from the Graph response
 * untouched, so this needs no list of template names to stay correct.
 */
export function templateWantsCodeButton(template: WaTemplate): boolean {
  const kinds = (template.buttons || []).map(b => String(b.type || "").toUpperCase())
  return kinds.includes("COPY_CODE") || kinds.includes("OTP")
}

/**
 * The message that results from choosing `template` in the composer.
 *
 * One function so the picker, the "pick a sensible default" path and anything
 * else that selects a template all produce the same message — the previous
 * version special-cased one template by name in three separate places, which is
 * how `connector_without_image` ended up being rewritten to `connector` between
 * the click and the send.
 *
 * Everything comes from the template's own metadata: its language, its
 * placeholder names, and whether its header is an image. Nothing is hard-coded
 * per template.
 */
export function applyTemplate(
  message: CampaignMessage,
  template: WaTemplate | null | undefined
): CampaignMessage {
  if (!template) {
    return {
      ...message,
      templateName: "",
      templateLanguage: "",
      bodyParams: [],
      bodyParamNames: [],
      hasImageHeader: false,
      hasCopyCodeButton: false,
      imageUrl: "",
      imageSource: "none",
    }
  }

  const names = template.variableNames?.length
    ? template.variableNames
    : extractTemplateVariables(template.bodyText)

  // The first variable is nearly always the recipient's name, so it starts
  // filled in. Anything else starts blank and has to be typed. Values already
  // typed for the previous template are kept, position by position.
  const bodyParams = names.map(
    (_, index) => message.bodyParams[index] ?? (index === 0 ? "{{Name}}" : "")
  )

  // A template without an image header cannot carry one, so switching to one
  // drops whatever image was attached rather than sending a payload Meta will
  // reject.
  const keepsImage = template.hasImageHeader
  const imageUrl = keepsImage ? message.imageUrl : ""

  return {
    ...message,
    templateName: template.name,
    templateLanguage: template.language,
    bodyParams,
    bodyParamNames: names,
    hasImageHeader: template.hasImageHeader,
    hasCopyCodeButton: templateWantsCodeButton(template),
    imageUrl,
    imageSource: keepsImage ? (imageUrl ? message.imageSource : "none") : "none",
  }
}

/**
 * What one recipient will actually receive, as text.
 *
 * Used by the Preview panel and by nothing else — the send path builds the
 * Graph payload from the same `CampaignMessage`, so this stays a rendering of
 * the same inputs rather than a parallel description of them.
 */
export interface PreviewResult {
  image: string
  text: string
  footerText?: string
  buttons?: WaTemplateButton[]
}

export function previewMessage(
  message: CampaignMessage,
  recipient: { name: string },
  template?: WaTemplate | null
): PreviewResult {
  if (!message.enabled) return { image: "", text: "", footerText: "", buttons: [] }

  if (message.mode === "custom") {
    return {
      image: message.imageUrl,
      text: fillName(message.text, recipient.name),
      buttons: [],
    }
  }

  const body = template?.bodyText || ""
  const names = template
    ? extractTemplateVariables(body)
    : message.bodyParamNames || []

  // One pass over the body, so a placeholder that is not one of the
  // template's variables is left visible rather than silently dropped.
  const text = body.replace(PLACEHOLDER, (whole, token: string) => {
    const index = names.indexOf(token)
    if (index === -1) return whole
    return (
      fillName(message.bodyParams[index] || "", recipient.name) ||
      recipient.name ||
      "Customer"
    )
  })

  // The same fallback validateMessage uses below: the template is the
  // authority when it is to hand, the message's own flag while the list is
  // still loading. An image the builder already ruled out stays ruled out.
  const wantsImage = template ? template.hasImageHeader : message.hasImageHeader
  const image = wantsImage && message.imageSource !== "none" ? message.imageUrl : ""

  return {
    image,
    text: text || `(template: ${message.templateName || "none selected"})`,
    footerText: template?.footerText || "",
    buttons: template?.buttons || [],
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

    // The template list can still be loading, or the chosen template can have
    // been paused at Meta's end since it was picked. The names carried on the
    // message are what the send path will actually use, so they are what gets
    // checked when the template itself is not to hand.
    const names = template
      ? template.variableNames?.length
        ? template.variableNames
        : extractTemplateVariables(template.bodyText)
      : message.bodyParamNames || []

    for (let index = 0; index < names.length; index++) {
      if (!String(message.bodyParams[index] || "").trim()) {
        return `${label}: variable {{${names[index]}}} is empty.`
      }
    }

    const wantsImage = template ? template.hasImageHeader : message.hasImageHeader
    if (wantsImage && !message.imageUrl) {
      return `${label}: this template has an image header, so an image is required.`
    }
    return null
  }

  if (!message.text.trim() && !message.imageUrl) {
    return `${label}: add some text or an image.`
  }
  return null
}
