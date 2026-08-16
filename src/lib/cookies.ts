"use client"

/**
 * Small document.cookie wrapper for preferences that must survive a refresh.
 *
 * Cookies rather than localStorage because staff share machines and reach the
 * CRM from several tabs at once: a cookie is per-browser-profile, expires on its
 * own, and is what the rest of the product already uses for session state.
 */

const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const prefix = `${encodeURIComponent(name)}=`
  const hit = document.cookie
    .split("; ")
    .find(entry => entry.startsWith(prefix))
  if (!hit) return null
  try {
    return decodeURIComponent(hit.slice(prefix.length))
  } catch {
    // A cookie written by something else, or truncated — treat as absent.
    return null
  }
}

function writeCookie(name: string, value: string, maxAgeSeconds = ONE_MONTH_SECONDS) {
  if (typeof document === "undefined") return
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${maxAgeSeconds}`,
    "SameSite=Lax",
  ].join("; ")
}

/** JSON round-trip on top of the two above; returns null on anything unusable. */
export function readJsonCookie<T = unknown>(name: string): T | null {
  const raw = readCookie(name)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJsonCookie(name: string, value: unknown, maxAgeSeconds?: number) {
  try {
    writeCookie(name, JSON.stringify(value), maxAgeSeconds)
  } catch (error) {
    console.error("Could not persist cookie:", name, error)
  }
}
