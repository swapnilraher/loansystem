import { getAdminApp } from '@/lib/firebase-admin';

/**
 * Authenticated access to the Firestore REST API from server routes.
 *
 * Several routes talk to Firestore over REST rather than through the Admin SDK
 * — deliberately, because gRPC is blocked on some of the hosts this runs on.
 * They were doing it with nothing but the public web API key, which is not a
 * credential: the same call could be made by anyone who opened the site and read
 * the bundle. It only ever worked because the database had no security rules.
 *
 * Routing those calls through here signs them with the service account instead,
 * so they carry real authority and keep working once the rules in
 * `firestore.rules` deny everything by default.
 *
 * NEVER import this from client code — it mints service-account credentials.
 */

/** Tokens last an hour; renew a minute early so one never expires in flight. */
const RENEW_MARGIN_MS = 60_000;

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - RENEW_MARGIN_MS) {
    return cached.token;
  }

  const credential = getAdminApp()?.options.credential;
  if (!credential) {
    throw new Error('Firebase Admin is not initialised — cannot sign Firestore REST calls.');
  }

  const { access_token: token, expires_in: expiresIn } = await credential.getAccessToken();
  cached = { token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

/**
 * `fetch` for the Firestore REST API, with the service-account bearer token
 * attached. Same signature as `fetch` — the response is returned untouched so
 * callers keep their existing error handling.
 */
export async function firestoreFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
    },
  });
}
