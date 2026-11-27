"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

/**
 * Fades its children in (and up a little) the first time they scroll into view.
 *
 * The server-rendered page shows everything: an element is only hidden after JavaScript
 * confirms it starts below the screen, where nobody can see it disappear. So the page is
 * complete without JavaScript, and nothing already on screen ever blinks.
 * `delay` (ms) staggers siblings, like a row of cards arriving one after another.
 */
export default function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<"static" | "waiting" | "shown">("static")

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (el.getBoundingClientRect().top < window.innerHeight) return // already visible

    // Hiding happens in an effect, after the browser has painted the server HTML. The
    // element is below the screen at this moment, so the change is invisible.
    setState("waiting")
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown")
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        state !== "static" &&
          "transition-[opacity,translate] duration-700 ease-out",
        state === "waiting" && "translate-y-6 opacity-0",
        className
      )}
      style={state === "shown" ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
