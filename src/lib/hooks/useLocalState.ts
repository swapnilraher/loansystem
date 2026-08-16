"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * localStorage-backed string state.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect(read)`: the effect
 * form trips `react-hooks/set-state-in-effect` and flashes the default value for
 * one frame. The server snapshot is always the fallback, so SSR and the first
 * client render agree and React re-renders once with the stored value.
 */

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(l => l())
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  // Keeps two open CRM tabs in sync.
  window.addEventListener("storage", onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

export function useLocalState<T extends string>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => (window.localStorage.getItem(key) as T | null) ?? fallback,
    () => fallback
  )

  const set = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next)
      } catch {
        // Private mode / quota — keep the UI responsive, just don't persist.
      }
      notify()
    },
    [key]
  )

  return [value, set]
}
