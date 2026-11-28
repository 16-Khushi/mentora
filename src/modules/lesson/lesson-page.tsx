import { ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import Eyebrow from "@/components/eyebrow"
import { buttonVariants } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"

import LessonNotesView from "./components/lesson-notes"
import LessonView from "./components/lesson-view"
import { getLessonPage } from "./queries"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>
}) {
  const { slug, lesson: position } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const data = await getLessonPage(slug, Number(position), session.user.id)
  if (!data) notFound()

  const base = `/courses/${data.course.slug}`
  const minutes = Math.round(
    (data.lesson.endSeconds - data.lesson.startSeconds) / 60
  )

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <Link
        href={base}
        className="flex w-fit items-center gap-1 text-sm font-semibold text-slate-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {data.course.title}
      </Link>

      <header className="flex flex-col gap-2">
        <Eyebrow>
          Lesson {data.lesson.position} of {data.total}
          {data.day ? ` · Day ${data.day}` : ""} · {minutes} min
        </Eyebrow>
        <h1 className="type-h1 text-ink">{data.lesson.title}</h1>
      </header>

      <LessonView
        data={data}
        notes={<LessonNotesView notes={data.lesson.notes} />}
        footer={
          <nav
            className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between"
            aria-label="Lessons"
          >
            {data.prev ? (
              <Link
                href={`${base}/${data.prev}`}
                className={buttonVariants({ variant: "ghost" })}
              >
                <ArrowLeft aria-hidden />
                Lesson {data.prev}
              </Link>
            ) : (
              <span />
            )}
            {data.next ? (
              <Link
                href={`${base}/${data.next.position}`}
                className={cn(
                  buttonVariants({ variant: "accent", size: "lg" }),
                  "sm:max-w-[60%]"
                )}
              >
                <span className="truncate">Next: {data.next.title}</span>
                <ArrowRight aria-hidden />
              </Link>
            ) : (
              <Link href={base} className={buttonVariants({ size: "lg" })}>
                Back to the course
              </Link>
            )}
          </nav>
        }
      />
    </div>
  )
}
