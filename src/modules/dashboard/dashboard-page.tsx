import { ArrowRight, Flame, Play } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

import ProgressBar from "@/components/progress-bar"
import Thumbnail from "@/components/thumbnail"
import { buttonVariants } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { paceLabel } from "@/lib/pace"
import { cn } from "@/lib/utils"
import NewCourseForm from "@/modules/new-course/components/new-course-form"
import type { RecentCourse, TodayData } from "@/types/dashboard"

import hero from "../../../public/landing/night-hero.jpg"
import { DateLine, Greeting, Streak } from "./components/local-time"
import { getToday } from "./queries"

const TONE: Record<RecentCourse["tone"], string> = {
  butter: "bg-butter",
  mint: "bg-mint",
  sky: "bg-sky",
  blush: "bg-blush",
  lavender: "bg-lavender",
  periwinkle: "bg-periwinkle",
}

/**
 * /dashboard, "Today": where you land after signing in. A banner with your next lesson, four
 * stat tickets, a box to start a new course, and your latest courses.
 */
export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const data = await getToday(session.user.id)

  return (
    <div className="page-container flex flex-col gap-6 py-6 lg:gap-8 lg:py-10">
      <Banner data={data} />
      <Stats stats={data.stats} />

      <section
        aria-labelledby="learn-next"
        className="flex flex-col gap-4 rounded-card bg-paper p-5 shadow-float sm:p-7"
      >
        <h2 id="learn-next" className="type-h3 text-ink">
          What do you want to learn next?
        </h2>
        <NewCourseForm initialUrl="" />
        <p className="text-center text-sm text-slate-muted">
          A YouTube video or playlist, up to 3 hours. Mentora turns it into
          lessons, notes and quizzes.
        </p>
      </section>

      {data.recent.length > 0 && (
        <section aria-labelledby="my-courses" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="my-courses" className="type-h2 text-ink">
              My <em className="text-violet">courses.</em>
            </h2>
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm font-bold text-violet hover:text-ink"
            >
              View all
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((c) => (
              <li key={c.slug} className="flex min-w-0">
                <CourseTile course={c} minutesPerDay={data.minutesPerDay} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** The night-sky banner with a frosted card: the date, a greeting and your next lesson. */
function Banner({ data }: { data: TodayData }) {
  const c = data.continueLesson
  return (
    <section
      aria-labelledby="today-title"
      className="relative isolate overflow-hidden rounded-sheet bg-night"
    >
      {/* The picture is 1.5× the banner's width, anchored left, so Thena sits to the right of the card. */}
      <div className="absolute inset-y-0 -right-1/2 left-0 -z-10 max-sm:right-0">
        <Image
          src={hero}
          alt=""
          fill
          preload
          sizes="(min-width: 1024px) 1600px, 100vw"
          placeholder="blur"
          className="object-cover object-[50%_45%]"
        />
      </div>
      <div className="flex min-h-[19rem] items-center p-4 sm:p-6 lg:min-h-[21rem]">
        <div className="flex w-full max-w-xl flex-col gap-3 rounded-card border border-white/60 bg-cream/80 p-5 shadow-float backdrop-blur-md sm:p-7">
          <p className="font-mono text-xs tracking-widest text-plum uppercase">
            <DateLine />
          </p>
          <h1 id="today-title" className="type-h2 leading-tight text-ink">
            <Greeting name={data.name} />.
            <br />
            <em className="text-violet">
              {c
                ? c.leftToday > 0
                  ? `${c.leftToday} lesson${c.leftToday === 1 ? "" : "s"} left in Day ${c.day}.`
                  : `Day ${c.day} is done.`
                : data.courseCount
                  ? "You're all caught up."
                  : "Let's build your first course."}
            </em>
          </h1>
          {c ? (
            <>
              <p className="truncate text-sm text-slate">
                {c.courseTitle} · Lesson {c.position}: {c.title} ·{" "}
                {paceLabel(c.minutes)}
              </p>
              <div className="mt-1 flex flex-wrap gap-2.5">
                <Link
                  href={`/courses/${c.slug}/${c.position}`}
                  className={buttonVariants({ size: "lg" })}
                >
                  <Play className="fill-current" aria-hidden />
                  {c.started ? "Continue" : "Start"} lesson {c.position}
                </Link>
                <Link
                  href={`/courses/${c.slug}`}
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  See the plan
                </Link>
              </div>
            </>
          ) : (
            <p className="text-slate">
              {data.courseCount
                ? "Every lesson in your courses is done. Start something new below."
                : "Paste a YouTube link below and Mentora plans it around your day."}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/** Four ticket-shaped stats: streak, lessons this week, quiz score, time watched this week. */
function Stats({ stats }: { stats: TodayData["stats"] }) {
  const watched = Math.round(stats.watchedWeekSeconds / 60)
  const label = "font-mono text-xs tracking-widest text-ink/80 uppercase"
  const big = "font-heading text-5xl leading-none tabular-nums"
  return (
    <ul
      aria-label="Your progress"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
    >
      <li className="flex min-h-40 flex-col gap-3 ticket bg-butter p-5 pl-7 text-ink">
        <span className={cn(label, "flex items-center gap-1.5")}>
          <Flame className="size-4" aria-hidden />
          Streak
        </span>
        <Streak completedAt={stats.completedAt} />
      </li>
      <li className="flex min-h-40 flex-col gap-3 ticket bg-mint p-5 pl-7 text-ink">
        <span className={label}>Lessons this week</span>
        <span className={big}>{stats.lessonsWeek}</span>
      </li>
      <li className="flex min-h-40 flex-col gap-3 ticket bg-blush p-5 pl-7 text-ink">
        <span className={label}>Quiz score</span>
        <span className={big}>
          {stats.quizScore === null ? "–" : `${stats.quizScore}%`}
        </span>
      </li>
      <li className="flex min-h-40 flex-col gap-3 ticket bg-sky p-5 pl-7 text-ink">
        <span className={label}>Watched this week</span>
        <span className={big}>
          {watched}
          <span className="ml-1 text-2xl">
            {watched === 1 ? "min" : "mins"}
          </span>
        </span>
      </li>
    </ul>
  )
}

/** A course card: thumbnail, status, lessons done, and the next lesson with a progress bar. */
function CourseTile({
  course,
  minutesPerDay,
}: {
  course: RecentCourse
  minutesPerDay: number
}) {
  const pct = course.planCount
    ? Math.round((100 * course.doneCount) / course.planCount)
    : 0
  const status = !course.nextTitle
    ? "Finished"
    : course.doneCount
      ? "In progress"
      : "Not started"
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        "group flex w-full min-w-0 flex-col gap-4 rounded-card p-3.5 transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
        TONE[course.tone]
      )}
    >
      <div className="relative">
        <Thumbnail
          src={course.thumbnailUrl}
          sizes="(min-width: 1024px) 340px, (min-width: 640px) 45vw, 100vw"
        />
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-bold text-ink backdrop-blur-sm">
          <span
            className={cn(
              "size-1.5 rounded-full",
              status === "Finished"
                ? "bg-teal"
                : status === "In progress"
                  ? "bg-coral"
                  : "bg-violet"
            )}
            aria-hidden
          />
          {status}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-1.5 pb-1">
        <h3 className="line-clamp-2 type-h4 text-ink group-hover:underline">
          {course.title}
        </h3>
        <p className="font-mono text-xs tracking-wider text-slate uppercase">
          {course.doneCount} of {course.planCount} lesson
          {course.planCount === 1 ? "" : "s"} · {paceLabel(minutesPerDay)} a day
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-slate">
              {course.nextTitle
                ? `Next: ${course.nextTitle}`
                : "All lessons done"}
            </span>
            <span className="shrink-0 font-bold text-ink tabular-nums">
              {pct}%
            </span>
          </div>
          <ProgressBar
            value={pct}
            label={`${course.title} progress`}
            className="bg-paper/70"
          />
        </div>
      </div>
    </Link>
  )
}
