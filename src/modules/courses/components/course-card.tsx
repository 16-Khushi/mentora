import { LoaderCircle } from "lucide-react"
import Link from "next/link"

import ProgressBar from "@/components/progress-bar"
import Thumbnail from "@/components/thumbnail"
import { cn } from "@/lib/utils"
import type { CourseCard as Card } from "@/types/course"

const TONE: Record<Card["tone"], string> = {
  butter: "bg-butter",
  sky: "bg-sky",
  lavender: "bg-lavender",
  mint: "bg-mint",
  blush: "bg-blush",
  periwinkle: "bg-periwinkle",
  paper: "bg-paper",
}

const hours = (s: number) => {
  const m = Math.round(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
}

/** One course on My courses: a pastel card with its thumbnail and progress. */
export default function CourseCard({ course }: { course: Card }) {
  const building = course.status !== "ready" && course.status !== "failed"
  const href =
    course.status === "ready"
      ? `/courses/${course.slug}`
      : `/build/${course.slug}`
  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full flex-col gap-4 rounded-card p-4 transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
        TONE[course.tone]
      )}
    >
      <Thumbnail
        src={course.thumbnailUrl}
        sizes="(min-width: 1024px) 340px, (min-width: 640px) 45vw, 100vw"
      />
      <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
        <h2 className="line-clamp-2 type-h4 text-ink">{course.title}</h2>
        {course.channel && (
          <p className="text-sm text-slate">{course.channel}</p>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          {building ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Building…
            </p>
          ) : course.status === "failed" ? (
            <p className="text-sm font-semibold text-coral-deep">
              Build stopped
            </p>
          ) : (
            <>
              <ProgressBar
                value={
                  course.lessons ? (100 * course.done) / course.lessons : 0
                }
                label={`${course.title} progress`}
              />
              <p className="text-sm text-slate">
                {course.done} of {course.lessons} lessons ·{" "}
                {hours(course.totalSeconds)}
              </p>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
