"use client"

import { useSyncExternalStore } from "react"

/**
 * Current wall-clock time, refreshed every minute, shared by every subscriber.
 *
 * Reading `Date.now()` inside a component or `useMemo` is impure — the React
 * compiler lint rule `react-hooks/purity` rejects it, and it silently goes stale
 * because nothing re-renders when the clock moves. This is one interval for the
 * whole app, so "overdue follow-ups" actually ticks over.
 */

const TICK_MS = 60_000

let now = 0
let timer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<() => void>()

/** Cached so repeated calls inside one render return an identical value. */
function getSnapshot() {
  if (now === 0) now = Date.now()
  return now
}

function subscribe(onStoreChange: () => void) {
  if (listeners.size === 0) {
    timer = setInterval(() => {
      now = Date.now()
      listeners.forEach(l => l())
    }, TICK_MS)
  }
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

/** Milliseconds since epoch, or 0 during SSR. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0)
}
