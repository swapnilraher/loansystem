/**
 * Reconciling three vocabularies that name the same place differently.
 *
 *  1. India Post (the PIN code API) still uses pre-rename district names —
 *     `431001` comes back as "Aurangabad", never "Chhatrapati Sambhajinagar".
 *  2. `data/banker_list.json` uses whatever the bank typed, so it holds both
 *     "Nashik" and "nasik", and towns ("Miraj") where a district is meant.
 *  3. Staff read and think in the current official names.
 *
 * Nothing here guesses at a location: it only decides that two spellings refer
 * to the same district. A name it does not recognise is passed through
 * unchanged and simply fails to match, which surfaces as an empty dropdown
 * rather than a wrong banker.
 */

/**
 * Each row is one district, current official name first. Every other entry is a
 * former name, a transliteration variant, or a town that stands in for the
 * district in the banker list.
 */
const DISTRICT_GROUPS: string[][] = [
  // ── Maharashtra ───────────────────────────────────────────────────────────
  ["Chhatrapati Sambhajinagar", "Aurangabad", "Sambhajinagar"],
  ["Dharashiv", "Osmanabad"],
  ["Ahilyanagar", "Ahmednagar", "Ahmadnagar"],
  ["Nashik", "Nasik"],
  ["Mumbai", "Mumbai City", "Mumbai Suburban", "Greater Mumbai", "Bombay"],
  ["Sangli", "Sangli-Miraj", "Miraj"],
  ["Buldhana", "Buldana"],
  ["Gondia", "Gondiya"],
  ["Beed", "Bid"],
  ["Raigad", "Raigarh(MH)", "Alibag"],
  ["Amravati", "Amraoti", "Achalpur"],
  ["Jalgaon", "Bhusawal", "Chopda"],
  ["Dhule", "Dhulia"],
  ["Solapur", "Sholapur", "Pandharpur"],
  ["Thane", "Ulhasnagar", "Kalyan"],
  ["Pune", "Poona", "Lonavla"],

  // ── Elsewhere, for the 30 other states in the banker list ─────────────────
  ["Bengaluru", "Bangalore", "Bengaluru Urban", "Bangalore Urban"],
  ["Mysuru", "Mysore"],
  ["Belagavi", "Belgaum"],
  ["Hubballi", "Hubli", "Dharwad"],
  ["Kalaburagi", "Gulbarga"],
  ["Shivamogga", "Shimoga"],
  ["Gurugram", "Gurgaon"],
  ["Prayagraj", "Allahabad"],
  ["Kanpur", "Kanpur Nagar"],
  ["Vadodara", "Baroda"],
  ["Ahmedabad", "Ahmadabad"],
  ["Kolkata", "Calcutta"],
  ["Chennai", "Madras"],
  ["Puducherry", "Pondicherry"],
  ["Thiruvananthapuram", "Trivandrum"],
  ["Kochi", "Cochin", "Ernakulam"],
  ["Varanasi", "Banaras", "Benares"],
  ["Indore", "Indaur"],
  ["Delhi", "New Delhi", "Central Delhi", "South Delhi", "North Delhi", "West Delhi", "East Delhi"],
]

/** Casing, spacing, punctuation and the "(MH)"-style suffixes all dropped. */
export function normalizeLocation(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim()
}

const GROUP_BY_NORMALIZED = new Map<string, string[]>()
for (const group of DISTRICT_GROUPS) {
  for (const name of group) {
    GROUP_BY_NORMALIZED.set(normalizeLocation(name), group)
  }
}

/** The name this district goes by today — "Aurangabad" → "Chhatrapati Sambhajinagar". */
export function currentDistrictName(value: string): string {
  const group = GROUP_BY_NORMALIZED.get(normalizeLocation(value))
  return group ? group[0] : (value || "").trim()
}

/**
 * Picks the option that names the same place as `target`, or `""` when none
 * does. Tried in order: exact spelling, a known alias, then a containment match
 * for compounds like "Sangli-Miraj" against "Sangli".
 */
export function matchLocationOption(target: string, options: string[]): string {
  const wanted = normalizeLocation(target)
  if (!wanted || options.length === 0) return ""

  const exact = options.find(option => normalizeLocation(option) === wanted)
  if (exact) return exact

  const group = GROUP_BY_NORMALIZED.get(wanted)
  if (group) {
    const aliases = new Set(group.map(normalizeLocation))
    const viaAlias = options.find(option => aliases.has(normalizeLocation(option)))
    if (viaAlias) return viaAlias
  }

  const contained = options.find(option => {
    const candidate = normalizeLocation(option)
    if (candidate.length < 4 || wanted.length < 4) return false
    return candidate.includes(wanted) || wanted.includes(candidate)
  })
  return contained || ""
}

/**
 * The CRM's loan types and the banker list's product column are two separate
 * vocabularies — the CRM says "Loan Against Property" where the banker sheet
 * says "LAP". Products the banker list does not cover (Credit Card, Insurance)
 * map to nothing, which leaves the dropdown on "-- Loan Type निवडा --".
 */
const BANKER_PRODUCT_ALIASES: Record<string, string[]> = {
  "loan against property": ["LAP", "Loan Against Property"],
  lap: ["LAP", "Loan Against Property"],
  "vehicle loan": ["Auto Loan", "Car Loan"],
  "car loan": ["Auto Loan"],
  "two wheeler loan": ["Auto Loan"],
  "working capital": ["WC", "Working Capital"],
  "loan against securities": ["LAS (Loan Against Securities)", "LAS"],
}

/** The banker-list product to search for a lead of this loan type, or `""`. */
export function bankerProductFor(loanType: string, products: string[]): string {
  const wanted = (loanType || "").trim()
  if (!wanted || products.length === 0) return ""

  const exact = products.find(p => p.toLowerCase() === wanted.toLowerCase())
  if (exact) return exact

  for (const candidate of BANKER_PRODUCT_ALIASES[wanted.toLowerCase()] || []) {
    const match = products.find(p => p.toLowerCase() === candidate.toLowerCase())
    if (match) return match
  }
  return ""
}
