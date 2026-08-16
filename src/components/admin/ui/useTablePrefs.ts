"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * A table's remembered column choices and page size.
 *
 * Staff re-hid the same four columns at the start of every shift because the
 * picker reset on every mount. This survives reloads without a round-trip to
 * Firestore — the preference is per-device by nature (a 13" laptop and a phone
 * want different columns), so a user document would be the wrong home for it.
 */
export interface TablePrefs {
  hidden: string[]
  pageSize: number
  /** Column id → pixel width, for columns the user has dragged. */
  widths: Record<string, number>
}

const PREFIX = "admin.table."

/**
 * `storage` only fires in *other* tabs, so same-tab writes are broadcast
 * manually. Without it the picker's own checkbox would not re-render.
 */
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(fn => fn())
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

/**
 * `useSyncExternalStore` compares snapshots by identity, so a fresh object per
 * read would loop forever. Raw strings are cached and only re-parsed when the
 * underlying value actually changes.
 */
const cache = new Map<string, { raw: string | null; value: TablePrefs | null }>()

function read(key: string): TablePrefs | null {
  const raw = window.localStorage.getItem(PREFIX + key)
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value

  let value: TablePrefs | null = null
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<TablePrefs>
      const widths: Record<string, number> = {}
      if (parsed.widths && typeof parsed.widths === "object") {
        for (const [id, width] of Object.entries(parsed.widths)) {
          if (typeof width === "number" && Number.isFinite(width)) widths[id] = width
        }
      }
      value = {
        hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter(id => typeof id === "string") : [],
        pageSize: typeof parsed.pageSize === "number" ? parsed.pageSize : 0,
        widths,
      }
    } catch {
      // A corrupt entry should cost the user their column layout, nothing more.
      value = null
    }
  }
  cache.set(key, { raw, value })
  return value
}

/**
 * Returns `null` on the server and on the first client render, so SSR markup
 * and hydration agree; the real value arrives on the re-render immediately
 * after mount. Callers fall back to their defaults while it is null.
 */
export function useTablePrefs(key: string | undefined) {
  const getSnapshot = useCallback(() => (key ? read(key) : null), [key])

  const prefs = useSyncExternalStore(
    key ? subscribe : () => () => {},
    getSnapshot,
    () => null
  )

  const save = useCallback(
    (patch: Partial<TablePrefs>) => {
      if (!key) return
      const next = { hidden: [], pageSize: 0, widths: {}, ...(read(key) ?? {}), ...patch }
      window.localStorage.setItem(PREFIX + key, JSON.stringify(next))
      emit()
    },
    [key]
  )

  return { prefs, save }
}
