"use client"

import { useEffect, useState } from "react"

/**
 * Counts from one number to another (90 → 58), easing out, like Magic UI's Number Ticker.
 * People who turned on "reduce motion" see the final number straight away.
 */
export default function NumberTicker({
  from,
  to,
  duration = 1400,
  delay = 300,
}: {
  from: number
  to: number
  duration?: number
  delay?: number
}) {
  const [value, setValue] = useState(from)

  useEffect(() => {
    let frame = 0
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const timer = setTimeout(
      () => {
        const start = performance.now()
        const tick = (now: number) => {
          const p = reduce ? 1 : Math.min(1, (now - start) / duration)
          setValue(Math.round(from + (to - from) * (1 - (1 - p) ** 3)))
          if (p < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      reduce ? 0 : delay
    )
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [from, to, duration, delay])

  return <span className="tabular-nums">{value}</span>
}
