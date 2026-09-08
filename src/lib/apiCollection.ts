/**
 * Shared plumbing for the collection routes the browser calls now that it no longer
 * talks to a database directly.
 *
 * Each of these collections was previously read straight from Firestore by a client
 * component, which meant Firestore's security rules were the only authorization. Going
 * through API routes moves that decision here, where the service account is doing the
 * reading — so every route states the roles it allows rather than inheriting a rule
 * from somewhere else.
 */
import { NextResponse } from "next/server"
import {
  requireRole,
  requireStaffOrPartner,
  type ApiCaller,
  type EitherCaller,
} from "@/lib/apiAuth"
import type { CrmRole } from "@/lib/permissions"
import { getAdminDb } from "@/lib/firebase-admin"
import { serializeDocs, reviveDates } from "@/lib/serialize"

/** Every signed-in staff member. Used for reference data the whole CRM renders. */
export const ANY_STAFF: CrmRole[] = ["Admin", "Manager", "Telecaller"]
export const ADMIN_ONLY: CrmRole[] = ["Admin"]
export const ADMIN_OR_MANAGER: CrmRole[] = ["Admin", "Manager"]

export type Handler<T> = (ctx: {
  caller: ApiCaller
  url: URL
  db: ReturnType<typeof getAdminDb>
  body: T
}) => Promise<unknown>

/**
 * Runs `handler` behind a role check, turning whatever it returns into JSON and any
 * throw into a 500.
 *
 * Every route body ends up shaped the same way, and a route that forgets its try/catch
 * leaks an internal error message to the browser — so the wrapper owns both.
 */
export async function guarded<T = unknown>(
  request: Request,
  allowed: CrmRole[],
  handler: Handler<T>
): Promise<NextResponse> {
  const auth = await requireRole(request, allowed)
  if (!auth.ok) return auth.response

  try {
    let body = {} as T
    if (request.method !== "GET" && request.method !== "DELETE") {
      try {
        // reviveDates keeps ISO strings from becoming string-typed timestamps in
        // Mongo, which would split sort order against the Date-typed ones.
        body = reviveDates(await request.json()) as T
      } catch {
        body = {} as T
      }
    }

    const result = await handler({
      caller: auth.caller,
      url: new URL(request.url),
      db: getAdminDb(),
      body,
    })

    return NextResponse.json({ success: true, ...(result as object) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed."
    console.error(`[${request.method} ${new URL(request.url).pathname}]`, message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * Like `guarded`, but for the collections BOTH the CRM and the partner portal read.
 *
 * The handler receives which kind of caller it got, because that is what decides scope:
 * a Manager sees the whole ledger, a partner only rows carrying their own id. Serving
 * both from one route keeps that decision in one place instead of duplicating the query
 * into a parallel `/api/partner/...` route that could drift out of step.
 */
export async function guardedShared<T = unknown>(
  request: Request,
  handler: (ctx: {
    who: EitherCaller
    url: URL
    db: ReturnType<typeof getAdminDb>
    body: T
  }) => Promise<unknown>
): Promise<NextResponse> {
  const auth = await requireStaffOrPartner(request)
  if (!auth.ok) return auth.response

  try {
    let body = {} as T
    if (request.method !== "GET" && request.method !== "DELETE") {
      try {
        body = reviveDates(await request.json()) as T
      } catch {
        body = {} as T
      }
    }

    const result = await handler({
      who: auth.who,
      url: new URL(request.url),
      db: getAdminDb(),
      body,
    })
    return NextResponse.json({ success: true, ...(result as object) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed."
    console.error(`[${request.method} ${new URL(request.url).pathname}]`, message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/** True when this caller may see every row rather than only their own. */
export function seesEverything(who: EitherCaller): boolean {
  return who.kind === "staff" && (who.caller.role === "Admin" || who.caller.role === "Manager")
}

/** The id a partner's own rows are keyed on, or null for staff. */
export function ownerIdOf(who: EitherCaller): string | null {
  return who.kind === "partner" ? who.partner.partnerId : null
}

/** A query snapshot as plain rows, with ids and ISO timestamps. */
export function rows(snapshot: { docs: { id: string; data: () => unknown }[] }) {
  return serializeDocs(snapshot.docs.map(d => ({ ...(d.data() as object), id: d.id })))
}

/** `?limit=` with a default and a hard ceiling, so one caller cannot pull a whole collection. */
export function limitOf(url: URL, fallback: number, ceiling: number): number {
  const raw = Number(url.searchParams.get("limit"))
  if (!Number.isFinite(raw) || raw <= 0) return fallback
  return Math.min(Math.floor(raw), ceiling)
}

/**
 * Rows newer than `?since=`, for the delta polls that replace onSnapshot.
 *
 * The client sends the newest timestamp it already holds and gets back only what
 * arrived after it, so a 4-second poll on a busy chat stays a near-empty response
 * rather than the whole thread.
 */
export function sinceOf(url: URL): Date | null {
  const raw = url.searchParams.get("since")
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}
