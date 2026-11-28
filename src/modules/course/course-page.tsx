import { ArrowRight, ListChecks } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import Eyebrow from "@/components/eyebrow"
import Mascot from "@/components/mascot"
import Paper from "@/components/paper"
import Pill from "@/components/pill"
import ProgressBar from "@/components/progress-bar"
import Thumbnail from "@/components/thumbnail"
import { buttonVariants } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { paceLabel } from "@/lib/pace"
import { cn } from "@/lib/utils"

import CourseMenu from "./components/course-menu"
import DayTabs from "./components/day-tabs"
import { getCoursePage } from "./queries"

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const data = await getCoursePage(slug, session.user.id)
  if (!data) notFound()
  // Still building (or failed): the build screen shows where it is.
  if (data.status !== "ready") redirect(`/build/${slug}`)

  const finished = data.planCount > 0 && data.doneCount === data.planCount
  const percent = data.planCount ? (100 * data.doneCount) / data.planCount : 0

  return (
    <div className="page-container flex flex-col gap-8 py-8 lg:py-12">
      <Paper className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:items-center">
        <div className="absolute top-3 right-3 z-10 rounded-full bg-paper/90 backdrop-blur-sm sm:top-6 sm:right-6">
          <CourseMenu
            slug={data.slug}
            title={data.title}
            minutesPerDay={data.minutesPerDay}
          />
        </div>
        <Thumbnail
          src={data.thumbnailUrl}
          sizes="(min-width: 768px) 40vw, 100vw"
          preload
          className="rounded-card"
        />
        <div className="flex min-w-0 flex-col gap-4">
          <Eyebrow>
            {data.channel ? `Course · ${data.channel}` : "Course"}
          </Eyebrow>
          <h1 className="pr-10 type-h1 text-ink">{data.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Pill>
              {data.lessons.length} lesson{data.lessons.length === 1 ? "" : "s"}
            </Pill>
            <Pill>{paceLabel(data.minutesPerDay)}</Pill>
            <Pill>
              {data.days.length} day{data.days.length === 1 ? "" : "s"}
            </Pill>
          </div>
          <div className="flex flex-col gap-2">
            <ProgressBar value={percent} label="Course progress" />
            <p className="text-sm text-slate-muted">
              {data.doneCount} of {data.planCount} lessons done
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.next && (
              <Link
                href={`/courses/${data.slug}/${data.next.position}`}
                className={buttonVariants({ variant: "accent", size: "lg" })}
              >
                {data.doneCount ? "Continue" : "Start"}: lesson{" "}
                {data.next.position}
                <ArrowRight aria-hidden />
              </Link>
            )}
            {data.placement.available &&
              !data.placement.taken &&
              !data.doneCount && (
                <Link
                  href={`/build/${data.slug}/test`}
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  <ListChecks aria-hidden />
                  Skip what you know
                </Link>
              )}
          </div>
        </div>
      </Paper>

      {finished && (
        <div className="flex flex-col items-center gap-3 rounded-card bg-mint p-8 text-center">
          <Mascot pose="celebrate" size={160} className="w-36" />
          <p className="type-h3 text-ink">You finished this course!</p>
          <Link href="/new" className={cn(buttonVariants(), "mt-2")}>
            Start another course
          </Link>
        </div>
      )}

      <DayTabs data={data} />
    </div>
  )
}
