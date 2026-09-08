"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { authedFetch } from "@/lib/authedFetch"

/**
 * The replacement for `onSnapshot` now that the data lives in MongoDB.
 *
 * MongoDB has no client-side push, and the obvious alternative — Server-Sent Events
 * over Atlas change streams — is a poor fit for this deployment: every open stream pins
 * a serverless invocation for its whole lifetime, billed by wall-clock and capped by
 * the function's maxDuration, while holding one connection from a small shared pool.
 * With a handful of concurrent staff, an interval poll returning a near-empty payload
 * is cheaper and far more predictable.
 *
 * Three tiers, by how much staleness the surface can tolerate:
 *   FAST (4s)      chat threads and the notification bell
 *   NORMAL (60s)   dashboards and list screens
 *   MANUAL (0)     reference data — fetch on mount, refresh on demand
 *
 * Polling pauses while the tab is hidden and refetches immediately on return, so a
 * backgrounded dashboard costs nothing.
 */

export const POLL_FAST = 4000
export const POLL_NORMAL = 60000
export const POLL_MANUAL = 0

export interface PolledResource<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Refetch now. Call after any mutation instead of waiting for the next tick. */
  refresh: () => Promise<void>
}

export function usePolledResource<T>(
  url: string | null,
  intervalMs: number = POLL_NORMAL,
  options?: { enabled?: boolean }
): PolledResource<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const enabled = options?.enabled !== false && !!url
  // Held in a ref so the polling effect does not re-subscribe when the caller passes
  // a freshly-built url string on every render.
  const urlRef = useRef(url)
  urlRef.current = url

  const inFlight = useRef(false)

  const load = useCallback(async () => {
    const target = urlRef.current
    if (!target || inFlight.current) return
    inFlight.current = true
    try {
      const response = await authedFetch(target)
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Could not load this data.")
      }
      setData(payload as T)
      setError(null)
    } catch (err) {
      // A failed poll keeps the last good data on screen rather than blanking it —
      // a dropped request mid-session should not empty a list the user is reading.
      setError(err instanceof Error ? err.message : "Could not load this data.")
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let timer: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (timer || intervalMs <= 0) return
      timer = setInterval(load, intervalMs)
    }
    const stop = () => {
      if (!timer) return
      clearInterval(timer)
      timer = null
    }

    load()
    start()

    const onVisibility = () => {
      if (document.hidden) {
        stop()
      } else {
        load()
        start()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", load)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", load)
    }
  }, [enabled, intervalMs, load, url])

  return { data, loading, error, refresh: load }
}
