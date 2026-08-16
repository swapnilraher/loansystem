"use client"

/**
 * Ref-counted scroll lock shared by every overlay in the CRM.
 *
 * Two problems this solves:
 *  1. The sidebar drawer and Sheet both used to write `document.body.style
 *     .overflow` directly. Opening a sheet from inside the drawer and closing
 *     it restored the body's scroll while the drawer was still open.
 *  2. The admin content column is its own scroll container (`overflow-y-auto`
 *     on the div inside the layout), so locking `body` alone did nothing —
 *     the page behind the overlay still scrolled. Any element tagged
 *     `data-scroll-lock` is locked too.
 */

let depth = 0
let restore: (() => void) | null = null

function targets(): HTMLElement[] {
  if (typeof document === "undefined") return []
  return [
    document.body,
    ...Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-lock]")),
  ]
}

/** Locks scrolling and returns the matching release function. */
export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {}

  depth += 1
  if (depth === 1) {
    const saved = targets().map(el => ({ el, overflow: el.style.overflow }))
    saved.forEach(({ el }) => {
      el.style.overflow = "hidden"
    })
    restore = () => saved.forEach(({ el, overflow }) => {
      el.style.overflow = overflow
    })
  }

  let released = false
  return () => {
    if (released) return
    released = true
    depth = Math.max(0, depth - 1)
    if (depth === 0 && restore) {
      restore()
      restore = null
    }
  }
}
