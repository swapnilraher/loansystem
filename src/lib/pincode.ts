export interface PincodeDetails {
  pincode: string
  city: string
  district: string
  state: string
  postOffice: string
  address: string
  /**
   * Sub-district. India Post publishes this as `Block`, which is the taluka for
   * effectively every Indian record — the same value the official data.gov.in
   * directory exposes under `taluk`. Empty when the API omits it.
   */
  taluka: string
  /**
   * Urban / Rural.
   *
   * India Post does not publish this, so it is `""` on every response today. The
   * field exists so that a source which does carry it can be dropped in without
   * a schema change. It is deliberately NOT inferred from `branchType` — a
   * Branch Office is usually but not always rural, and a guess stored as fact is
   * worse than a blank.
   */
  urbanRural: string
  /** "Head Post Office" / "Sub Post Office" / "Branch Post Office". */
  branchType: string
  division: string
  region: string
  circle: string
}

/**
 * The one post office that best represents a PIN code.
 *
 * A PIN code routinely covers several, and occasionally one of them sits in a
 * different district: `400001` lists Elephanta Caves — which is in Raigad, and
 * is also the only delivery office in the list — alongside six Mumbai ones.
 * Taking either the first entry or the first delivery entry would label that
 * lead with the wrong district, so the district the offices mostly agree on
 * wins, and one of *those* offices is then used for the finer detail.
 */
function pickPostOffice(offices: Record<string, string>[]): Record<string, string> {
  const perDistrict = new Map<string, Record<string, string>[]>()
  for (const office of offices) {
    const district = office.District || ""
    const group = perDistrict.get(district)
    if (group) group.push(office)
    else perDistrict.set(district, [office])
  }

  // Ties go to whichever district India Post listed first, so the choice is
  // stable across calls.
  let majority: Record<string, string>[] = []
  for (const group of perDistrict.values()) {
    if (group.length > majority.length) majority = group
  }

  // Within the majority district, an office that delivers describes the
  // catchment better than a counter that only sells stamps.
  return majority.find(po => po.DeliveryStatus === "Delivery") || majority[0] || offices[0]
}

/**
 * The bot prompts in Marathi and Hindi with a Devanagari example ("उदा. ४११००१"),
 * so customers reply in kind. Those digits are not `[0-9]`, and stripping them
 * as punctuation would leave an empty string and a silently unresolved lead.
 */
function toAsciiDigits(value: string): string {
  return value.replace(/[०-९٠-٩۰-۹]/g, char => {
    const code = char.charCodeAt(0)
    // Descending, because the Devanagari block sits above both Arabic ones.
    const base = code >= 0x0966 ? 0x0966 : code >= 0x06f0 ? 0x06f0 : 0x0660
    return String(code - base)
  })
}

/**
 * Fetches location details for an Indian PIN code from the India Post directory.
 *
 * Returns `null` for anything that is not a resolvable 6-digit code, including
 * network failures — callers treat that as "no location known" and keep the raw
 * PIN code, never a partial or guessed address.
 *
 * @param timeoutMs Abort ceiling. The WhatsApp bot awaits this call inline
 *   before asking its next question, so a hung upstream must not stall a reply.
 */
export async function lookupPincode(
  pincode: string,
  timeoutMs = 5000
): Promise<PincodeDetails | null> {
  const clean = toAsciiDigits(pincode || "").replace(/\D/g, "")
  if (clean.length !== 6) return null

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    const data = await res.json()

    if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const po = pickPostOffice(data[0].PostOffice)
      const district = po.District || po.Division || po.Block || ""
      const state = po.State || ""
      const postOffice = po.Name || ""
      const city = po.Block && po.Block !== "NA" ? po.Block : (district || po.Name || "")

      const addressParts = [postOffice, district, state].filter(Boolean)
      const address = `${addressParts.join(", ")} - ${clean}`

      return {
        pincode: clean,
        city,
        district,
        state,
        postOffice,
        address,
        taluka: po.Block && po.Block !== "NA" ? po.Block : "",
        // India Post carries no urban/rural marker — see the field's note above.
        urbanRural: "",
        branchType: po.BranchType || "",
        division: po.Division || "",
        region: po.Region || "",
        circle: po.Circle || "",
      }
    }
  } catch (err) {
    console.error("Error looking up pincode:", err)
  }
  return null
}

/**
 * The lead document's copy of a PIN code lookup.
 *
 * Everything is prefixed `pin` and written exactly once, when the customer
 * supplies the code. This is the *source* location: staff may re-point a lead's
 * banker search at a different district (`bankerState` / `bankerDistrict`) and
 * the free-text `city` may later be overwritten by a different flow answer, but
 * these fields keep saying where the PIN code actually is.
 *
 * Values are strings because the WhatsApp webhook writes leads through the
 * Firestore REST API, which types every field it sends as `stringValue`.
 */
export function pincodeLeadFields(details: PincodeDetails): Record<string, string> {
  return {
    pincode: details.pincode,
    pinState: details.state,
    pinDistrict: details.district,
    pinCity: details.city,
    pinTaluka: details.taluka,
    pinUrbanRural: details.urbanRural,
    pinPostOffice: details.postOffice,
    pinAddress: details.address,
    pinBranchType: details.branchType,
    pinLookupAt: new Date().toISOString(),
  }
}
