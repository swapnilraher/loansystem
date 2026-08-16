"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface CardCarouselProps {
  /** Grid columns applied from `md` up, e.g. "md:grid-cols-3 xl:grid-cols-6". */
  gridClassName?: string
  /** Announced to screen readers as the group label. */
  label?: string
  /**
   * Short header tiles rather than full cards: more of them peek on a phone,
   * and the 44px dot row is dropped. Pair with `StatCard`'s own `dense`.
   */
  dense?: boolean
  children: React.ReactNode
  className?: string
}

/**
 * A row of cards that swipes on a phone and is an ordinary grid from `md` up.
 *
 * One DOM tree, not two: the same children are a snapping flex track below `md`
 * and a CSS grid above it. Rendering two trees would double the markup for
 * every card and, worse, remount them on resize — throwing away any state the
 * cards hold.
 *
 * The browser does all the scrolling. JS is here only to light the right dot,
 * and it reads its numbers out of the DOM rather than recomputing Tailwind's
 * gap in JS, which would silently drift the moment the gap class changed.
 */
export function CardCarousel({
  gridClassName,
  label = "Summary cards",
  dense = false,
  children,
  className,
}: CardCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const count = React.Children.count(children)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let frame = 0
    const onScroll = () => {
      // Coalesce to one measurement per frame: a touch flick fires scroll
      // events far faster than React can usefully re-render.
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const items = track.children
        if (items.length < 2) return
        // Distance between two card origins — card width plus whatever the gap
        // currently resolves to, measured rather than assumed.
        const step =
          (items[1] as HTMLElement).offsetLeft - (items[0] as HTMLElement).offsetLeft
        if (step <= 0) return
        setIndex(Math.min(items.length - 1, Math.round(track.scrollLeft / step)))
      })
    }

    track.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      track.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const goTo = (target: number) => {
    const track = trackRef.current
    if (!track || track.children.length < 2) return
    const items = track.children
    const step = (items[1] as HTMLElement).offsetLeft - (items[0] as HTMLElement).offsetLeft
    track.scrollTo({
      left: step * target,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        className={cn(
          "flex overflow-x-auto snap-x snap-mandatory admin-scroll-hidden",
          dense ? "gap-2" : "gap-2.5",
          // Bleed to the screen edges on a phone so the track reads as
          // scrollable content rather than a clipped box, then restore the
          // page gutter as scroll padding so the first card still lines up
          // with everything above it.
          "-mx-3 px-3 scroll-px-3",
          // From `md` every one of those becomes inert and it is a plain grid.
          "md:mx-0 md:px-0 md:overflow-visible md:snap-none md:grid",
          gridClassName
        )}
      >
        {React.Children.map(children, child => (
          <div
            className={cn(
              // ~62% of the viewport leaves the next card visibly peeking, which
              // is the only honest signal that the row scrolls. Dense tiles are
              // short enough to show three at a time, which is a louder signal
              // still — that is what pays for dropping the dots.
              "snap-start shrink-0",
              dense
                ? "basis-[43%] min-[420px]:basis-[33%] min-[640px]:basis-[25%]"
                : "basis-[62%] min-[420px]:basis-[46%] min-[640px]:basis-[31%]",
              // Grid takes over sizing at `md`; the flex basis must stop applying
              // or the columns inherit a 62% width.
              "md:basis-auto md:shrink"
            )}
          >
            {child}
          </div>
        ))}
      </div>

      {count > 1 && !dense && (
        <div className="flex md:hidden items-center justify-center gap-1 mt-2">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to card ${i + 1} of ${count}`}
              aria-current={i === index ? "true" : undefined}
              // The dot is 6px; the button around it is a 44px target, because
              // a 6px tap target on a phone is not a control.
              className="admin-focus h-11 w-6 inline-flex items-center justify-center rounded-admin-sm"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all motion-reduce:transition-none",
                  i === index ? "w-4 bg-admin-accent" : "w-1.5 bg-admin-border-strong"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
