"use client"

import { Check, Clock } from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { CoursePageData } from "@/types/course"

const time = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`

/**
 * The learner's plan as Day tabs: today's day opens first, the chosen day's lessons below.
 * Arrow keys move between days, as screen-reader users expect from tabs.
 */
export default function DayTabs({ data }: { data: CoursePageData }) {
  const first = data.today ?? data.days[0]?.day ?? 1
  const [selected, setSelected] = useState(first)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const day = data.days.find((d) => d.day === selected) ?? data.days[0]

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const last = data.days.length - 1
    const to =
      e.key === "ArrowRight"
        ? Math.min(i + 1, last)
        : e.key === "ArrowLeft"
          ? Math.max(i - 1, 0)
          : -1
    if (to < 0) return
    e.preventDefault()
    setSelected(data.days[to].day)
    tabs.current[to]?.focus()
  }

  if (!day) return null

  return (
    <section className="flex flex-col gap-5" aria-labelledby="plan-title">
      <div className="flex items-end justify-between gap-4">
        <h2 id="plan-title" className="type-h2 text-ink">
          Your plan
        </h2>
        <p className="pb-1 text-sm text-slate-muted tabular-nums">
          {data.doneCount} / {data.planCount} lessons done
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Days"
        className="-mx-1 flex [scrollbar-width:none] gap-2 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden"
      >
        {data.days.map((d, i) => {
          const active = d.day === day.day
          const isToday = d.day === data.today
          const done = d.lessons.every((l) => l.done)
          return (
            <button
              key={d.day}
              ref={(el) => {
                tabs.current[i] = el
              }}
              role="tab"
              id={`day-tab-${d.day}`}
              aria-selected={active}
              aria-controls="day-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(d.day)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
                active
                  ? "bg-ink text-white"
                  : "border border-violet text-ink hover:bg-lavender"
              )}
            >
              {done && <Check className="size-3.5" aria-hidden />}
              Day {d.day}
              {isToday && (
                <>
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      active ? "bg-butter" : "bg-violet"
                    )}
                    aria-hidden
                  />
                  <span className="sr-only">(today)</span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <div
        id="day-panel"
        role="tabpanel"
        aria-labelledby={`day-tab-${day.day}`}
        className="flex flex-col gap-3"
      >
        <h3 className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="type-h4 text-ink">Day {day.day}</span>
          <span className="text-sm text-slate-muted">
            {day.lessons.length} lesson{day.lessons.length === 1 ? "" : "s"} ·{" "}
            {time(day.minutes)}
          </span>
          {day.day === data.today && (
            <span className="rounded-full bg-butter px-3 py-0.5 text-sm font-semibold text-ink">
              Today
            </span>
          )}
        </h3>
        <ul className="flex flex-col gap-2">
          {day.lessons.map((l) => {
            const isNext = data.next?.position === l.position
            return (
              <li key={l.position}>
                <Link
                  href={`/courses/${data.slug}/${l.position}`}
                  className={cn(
                    "flex items-center gap-4 rounded-tile bg-paper px-4 py-3.5 transition-colors hover:bg-lavender/60 focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
                    isNext && "ring-2 ring-violet"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      l.done ? "bg-teal text-white" : "bg-lavender text-ink"
                    )}
                    aria-hidden
                  >
                    {l.done ? <Check className="size-4" /> : l.position}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        "font-semibold text-ink",
                        l.done && "text-slate-muted"
                      )}
                    >
                      {l.title}
                    </span>
                    <span className="line-clamp-1 text-sm text-slate-muted">
                      {l.summary}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-sm text-slate-muted">
                    <Clock className="size-3.5" aria-hidden />
                    {l.minutes} min
                  </span>
                  <span className="sr-only">
                    {l.done ? "(done)" : isNext ? "(up next)" : ""}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
