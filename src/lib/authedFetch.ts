"use client"

import { auth } from "@/lib/firebase"

/**
 * `fetch` for CRM API routes, carrying the signed-in staff member's ID token.
 *
 * The Admin-only routes verify that token server-side (`@/lib/apiAuth`), so a
 * call made without it is rejected — which is the point: hiding a button is a
 * courtesy, and the header is what actually proves who is asking.
 *
 * A signed-out caller still gets a request, just an unauthenticated one. Letting
 * it 401 keeps one error path instead of two.
 */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser
  const token = user ? await user.getIdToken() : ""

  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

/** `authedFetch` + JSON body, for the POST/PATCH routes. */
export async function authedJson(
  input: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Promise<Response> {
  return authedFetch(input, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}
