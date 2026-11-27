"use client"

import { useEffect, useRef } from "react"

/**
 * Moves its children at a different speed from the page as you scroll, for depth.
 *
 * `speed` is how far the layer moves per pixel, on top of the page's own movement:
 *   negative = faster than the page (foreground rising past you), e.g. -0.35 for leaves
 *   positive = slower than the page (background hanging back),    e.g.  0.15
 *
 * `from` decides where the layer is at rest (no offset):
 *   "top"    : when the page is scrolled to the top. For layers in the opening hero, so the
 *              first frame (and the server-rendered HTML) is exactly the resting layout.
 *   "centre" : when the layer's middle is at the middle of the screen. For decorations
 *              further down that drift a little as they pass by.
 *
 * Does nothing for people who ask their system for reduced motion.
 */
export default function Parallax({
  speed,
  from = "centre",
  className,
  children,
}: {
  speed: number
  from?: "top" | "centre"
  className?: string
  children: React.ReactNode
}) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = outer.current
    const layer = inner.current
    if (!el || !layer) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const update = () => {
      frame = 0
      let travelled: number
      if (from === "top") {
        travelled = window.scrollY
      } else {
        // The wrapper never moves (only the inner layer does), so this measure stays stable.
        const rect = el.getBoundingClientRect()
        travelled = window.innerHeight / 2 - (rect.top + rect.height / 2)
      }
      layer.style.transform = `translate3d(0, ${(travelled * speed).toFixed(1)}px, 0)`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [speed, from])

  return (
    <div ref={outer} className={className}>
      <div ref={inner} className="h-full w-full will-change-transform">
        {children}
      </div>
    </div>
  )
}
