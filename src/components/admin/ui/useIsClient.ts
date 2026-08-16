"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * True only after hydration. Portals (Sheet, Toast) need this because
 * `createPortal` has no server rendering — rendering it during SSR would
 * mismatch. `useSyncExternalStore` rather than the usual
 * `useState(false) + useEffect(setTrue)`, which the React compiler lint rule
 * `react-hooks/set-state-in-effect` rejects.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
