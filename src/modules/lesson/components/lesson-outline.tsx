"use client"

import { Check, Play } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import Thumbnail from "@/components/thumbnail"
import { cn } from "@/lib/utils"
import type { LessonOutline as Outline } from "@/types/lesson"

/**
 * The course beside the lesson: Day tabs, and that day's lessons with thumbnails and minutes.
 * Opens on the current lesson's day with the current lesson highlighted and scrolled into view.
 */
export default function LessonOutline({
  slug,
  title,
  position,
  outline,
}: {
  slug: string
  title: string
  position: number
  outline: Outline
}) {
  const currentDay =
    outline.days.find((d) => d.lessons.some((l) => l.position === position))
      ?.day ??
    outline.days[0]?.day ??
    1
  const [day, setDay] = useState(currentDay)
  const list = useRef<HTMLUListElement>(null)
  const shown = outline.days.find((d) => d.day === day) ?? outline.days[0]

  // Bring the current lesson into view inside the list (not the whole page).
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>("[aria-current=page]")
    if (el && list.current)
      list.current.scrollTop = el.offsetTop - list.current.offsetTop - 8
  }, [day])

  return (
    <nav
      aria-label="Lessons in this course"
      className="flex max-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-card bg-paper shadow-float"
    >
      <div className="flex flex-col gap-3 border-b border-line p-5 pb-4">
        <div>
          <p className="line-clamp-2 font-heading text-lg leading-tight text-ink">
            {title}
          </p>
          <p className="text-sm text-slate-muted">
            Lesson {position} of {outline.total} · {outline.doneCount} done
          </p>
        </div>
        {outline.days.length > 1 && (
          <div
            role="tablist"
            aria-label="Days"
            className="-mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-0.5"
          >
            {outline.days.map((d) => (
              <button
                key={d.day}
                type="button"
                role="tab"
                aria-selected={d.day === day}
                onClick={() => setDay(d.day)}
                className={cn(
                  "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
                  d.day === day
                    ? "bg-ink text-white"
                    : "border border-violet text-ink hover:bg-lavender"
                )}
              >
                Day {d.day}
                {d.day === currentDay && (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      d.day === day ? "bg-butter" : "bg-violet"
                    )}
                    aria-label="(this lesson)"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <ul ref={list} className="flex flex-col gap-1 overflow-y-auto p-2">
        {shown?.lessons.map((l) => {
          const current = l.position === position
          return (
            <li key={l.position}>
              <Link
                href={`/courses/${slug}/${l.position}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-tile p-2 transition-colors focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
                  current ? "bg-lavender" : "hover:bg-cream"
                )}
              >
                <span
                  className="flex w-5 shrink-0 justify-center text-sm font-bold text-slate-muted tabular-nums"
                  aria-hidden
                >
                  {current ? (
                    <Play className="size-3.5 fill-ink text-ink" />
                  ) : l.done ? (
                    <Check className="size-4 text-teal-deep" strokeWidth={3} />
                  ) : (
                    l.position
                  )}
                </span>
                <div className="relative w-24 shrink-0">
                  <Thumbnail
                    src={l.thumbnailUrl}
                    sizes="96px"
                    className={cn(
                      "rounded-[10px]",
                      (l.done || l.skipped) && !current && "opacity-70"
                    )}
                  />
                  <span className="absolute right-1 bottom-1 rounded bg-night/80 px-1 text-[0.65rem] font-bold text-white tabular-nums">
                    {l.minutes}m
                  </span>
                </div>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "line-clamp-2 text-sm leading-snug font-semibold",
                      current ? "text-ink" : "text-slate"
                    )}
                  >
                    {l.title}
                  </span>
                  {(l.skipped || l.done) && (
                    <span className="text-xs text-slate-muted">
                      {l.skipped ? "Skipped" : "Done"}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
