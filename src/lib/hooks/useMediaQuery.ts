"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Live media-query match.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: the effect form
 * trips the React Compiler's `set-state-in-effect` rule and renders one frame
 * with the wrong answer. The server snapshot is always `false`, so SSR and the
 * first client render agree and React re-renders once with the real value.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onStoreChange)
      return () => list.removeEventListener("change", onStoreChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Matches Tailwind's `lg` breakpoint — the point the sidebar stops being a drawer. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)")
}
