/**
 * Single source for the WhatsApp Cloud API credentials.
 *
 * SERVER ONLY. The fallbacks below are string literals, so any client component
 * that imports from this file ships the access token to the browser. Client
 * code wanting attachment rules or the media URL helper must import
 * `@/lib/whatsappMediaShared`, which holds nothing secret.
 *
 * These values were previously copy-pasted as literals into
 * `app/api/whatsapp/route.ts` and `app/api/whatsapp/webhook/route.ts`. They are
 * kept as fallbacks here so nothing regresses if the environment variables are
 * unset in a deployment, but they are live credentials sitting in source
 * control and should be rotated and moved to env-only.
 */

export const WHATSAPP_TOKEN =
  process.env.WHATSAPP_TOKEN ||
  "EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD";

export const WHATSAPP_PHONE_ID =
  process.env.WHATSAPP_PHONE_ID || "1112131761984283";

export const WHATSAPP_VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || "swapnil942040020202";

/** Graph API version used for every call. Verified working against this app. */
export const GRAPH_VERSION = "v18.0";

export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

/**
 * Meta's media CDN (`lookaside.fbsbx.com`) refuses requests that arrive without
 * a User-Agent, which is easy to miss because Node's built-in `fetch` does not
 * set one. Every media call goes out with these headers.
 */
export const WHATSAPP_MEDIA_HEADERS = {
  Authorization: `Bearer ${WHATSAPP_TOKEN}`,
  "User-Agent": "TechStarCRM/1.0 (+https://techstarsolution.in)",
} as const

/** Re-exported for server callers; the definition is client-safe. */
export { mediaProxyPath } from "./whatsappMediaShared"

/**
 * WhatsApp Business Account id — the parent of the phone number, and the only
 * node that can list approved message templates
 * (`GET /{WABA_ID}/message_templates`). The phone id cannot.
 *
 * Same fallback-in-source pattern as the credentials above, and the same
 * caveat: it lives in `whatsapp-API.env`, which Next does not load, so the
 * literal is what actually runs until it is moved into the environment.
 */
export const WHATSAPP_WABA_ID =
  process.env.WHATSAPP_WABA_ID || process.env.WABA_ID || "1493282642455205"
