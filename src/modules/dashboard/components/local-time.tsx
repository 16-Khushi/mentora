"use client"

import { useSyncExternalStore } from "react"

import { dayKey, streak } from "@/lib/streak"

// Nothing to subscribe to: these values only need reading once the page is in the browser.
const subscribe = () => () => {}

/**
 * "Good morning, Khushi", by the learner's own clock. The server doesn't know their timezone,
 * so it renders "Hello" and the browser swaps in the time of day.
 */
export function Greeting({ name }: { name: string }) {
  const hour = useSyncExternalStore(
    subscribe,
    () => new Date().getHours(),
    () => null
  )
  const part =
    hour === null
      ? "Hello"
      : hour < 5
        ? "Up late"
        : hour < 12
          ? "Good morning"
          : hour < 17
            ? "Good afternoon"
            : "Good evening"
  return (
    <>
      {part}, {name}
    </>
  )
}

/** "Saturday, Nov 28", by the learner's own calendar. */
export function DateLine() {
  const date = useSyncExternalStore(
    subscribe,
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    () => null
  )
  return <>{date ?? "Today"}</>
}

/**
 * The streak tile's number and hint, counted in the learner's timezone:
 * "1 day · Today counts. Come back tomorrow for 2." Shows "–" until the browser takes over.
 */
export function Streak({ completedAt }: { completedAt: string[] }) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const dates = completedAt.map((iso) => new Date(iso))
      const days = streak(dates, new Date())
      const today = dayKey(new Date())
      // Encoded as one string so the snapshot stays the same between renders.
      return `${days}|${dates.some((d) => dayKey(d) === today) ? 1 : 0}`
    },
    () => null
  )
  if (value === null)
    return <span className="font-heading text-5xl leading-none">–</span>
  const [days, doneToday] = value.split("|").map(Number)
  const hint = doneToday
    ? `Today counts. Come back tomorrow for ${days + 1}.`
    : days
      ? "Finish a lesson today to keep it going."
      : "Finish a lesson to start one."
  return (
    <>
      <span className="font-heading text-5xl leading-none tabular-nums">
        {days} {days === 1 ? "day" : "days"}
      </span>
      <span className="text-sm leading-snug text-slate">{hint}</span>
    </>
  )
}
