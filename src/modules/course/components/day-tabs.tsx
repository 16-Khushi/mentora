"use client"

import { Check, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { useRef, useState, useTransition } from "react"

import { paceLabel } from "@/lib/pace"
import { cn } from "@/lib/utils"
import { addLessonBack } from "@/modules/placement/actions"
import type { CourseDay, CoursePageData } from "@/types/course"

type View = "plan" | "full"

/** The first day that still has a lesson to study (not done, not skipped). */
const todayOf = (days: CourseDay[]) =>
  days.find((d) => d.lessons.some((l) => !l.done && !l.skipped))?.day ?? null

/**
 * The learner's plan as Day tabs: today's day opens first, the chosen day's lessons below.
 * After a placement test, "My plan / Full course" switches between the plan without the skipped
 * lessons and the whole course, where any skipped lesson can be added back.
 * Arrow keys move between days, as screen-reader users expect from tabs.
 */
export default function DayTabs({ data }: { data: CoursePageData }) {
  const [view, setView] = useState<View>("plan")
  const days = view === "full" ? data.fullDays : data.days
  const today = todayOf(days)
  const [picked, setPicked] = useState<number | null>(null)
  const selected = picked ?? today ?? days[0]?.day ?? 1
  const day = days.find((d) => d.day === selected) ?? days[0]
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const [, startAdding] = useTransition()

  const switchView = (next: View) => {
    setView(next)
    setPicked(null) // day numbers differ between views: open that view's "today"
  }

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const last = days.length - 1
    const to =
      e.key === "ArrowRight"
        ? Math.min(i + 1, last)
        : e.key === "ArrowLeft"
          ? Math.max(i - 1, 0)
          : -1
    if (to < 0) return
    e.preventDefault()
    setPicked(days[to].day)
    tabs.current[to]?.focus()
  }

  if (!day) return null

  return (
    <section className="flex flex-col gap-5" aria-labelledby="plan-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="plan-title" className="type-h2 text-ink">
            Your plan
          </h2>
          {data.skippedCount > 0 && (
            <p className="text-sm text-slate-muted">
              Your placement test skipped {data.skippedCount} lesson
              {data.skippedCount === 1 ? "" : "s"} · saves{" "}
              {paceLabel(data.minutesSaved)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {data.skippedCount > 0 && (
            <div
              role="group"
              aria-label="Show"
              className="flex rounded-full bg-lavender p-1"
            >
              {(["plan", "full"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => switchView(v)}
                  className={cn(
                    "h-8 cursor-pointer rounded-full px-3.5 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
                    view === v
                      ? "bg-ink text-white"
                      : "text-ink hover:bg-paper/60"
                  )}
                >
                  {v === "plan" ? "My plan" : "Full course"}
                </button>
              ))}
            </div>
          )}
          <p className="text-sm text-slate-muted tabular-nums">
            {data.doneCount} / {data.planCount} lessons done
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Days"
        className="-mx-1 flex [scrollbar-width:none] gap-2 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden"
      >
        {days.map((d, i) => {
          const active = d.day === day.day
          const isToday = d.day === today
          const done = d.lessons.every((l) => l.done || l.skipped)
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
              onClick={() => setPicked(d.day)}
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
            {paceLabel(day.minutes)}
          </span>
          {day.day === today && (
            <span className="rounded-full bg-butter px-3 py-0.5 text-sm font-semibold text-ink">
              Today
            </span>
          )}
        </h3>
        <ul className="flex flex-col gap-2">
          {day.lessons.map((l) => {
            const isNext = data.next?.position === l.position
            return (
              <li
                key={l.position}
                className={cn(
                  "flex items-center gap-2 rounded-tile bg-paper pr-3 transition-colors",
                  isNext && "ring-2 ring-violet",
                  l.skipped && "bg-paper/60"
                )}
              >
                <Link
                  href={`/courses/${data.slug}/${l.position}`}
                  className="flex min-w-0 flex-1 items-center gap-4 rounded-tile px-4 py-3.5 hover:bg-lavender/50 focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      l.done
                        ? "bg-teal text-white"
                        : l.skipped
                          ? "bg-sand text-slate-muted"
                          : "bg-lavender text-ink"
                    )}
                    aria-hidden
                  >
                    {l.done ? <Check className="size-4" /> : l.position}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        "font-semibold text-ink",
                        (l.done || l.skipped) && "text-slate-muted"
                      )}
                    >
                      {l.title}
                    </span>
                    <span className="line-clamp-1 text-sm text-slate-muted">
                      {l.summary}
                    </span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-sm text-slate-muted sm:flex">
                    <Clock className="size-3.5" aria-hidden />
                    {paceLabel(l.minutes)}
                  </span>
                  <span className="sr-only">
                    {l.done
                      ? "(done)"
                      : l.skipped
                        ? "(skipped)"
                        : isNext
                          ? "(up next)"
                          : ""}
                  </span>
                </Link>
                {l.skipped && (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-ink sm:inline">
                      Skipped
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        startAdding(() => addLessonBack(data.slug, l.position))
                      }
                      className="flex h-8 cursor-pointer items-center gap-1 rounded-full border border-violet px-3 text-sm font-semibold text-ink hover:bg-lavender focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Add back
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
