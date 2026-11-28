import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"

import LessonNotesView from "./components/lesson-notes"
import LessonView from "./components/lesson-view"
import { getLessonPage } from "./queries"

/** /courses/<slug>/<lesson>: one lesson, with the course's lessons beside it. */
export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; lesson: string }>
  searchParams: Promise<{ autoplay?: string }>
}) {
  const [{ slug, lesson: position }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ])
  if (!session?.user?.id) redirect("/login")
  const data = await getLessonPage(slug, Number(position), session.user.id)
  if (!data) notFound()

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col px-4 py-5 sm:px-6 lg:py-8">
      <LessonView
        key={data.lesson.id}
        data={data}
        notes={<LessonNotesView notes={data.lesson.notes} />}
        autoplay={query.autoplay === "1"}
      />
    </div>
  )
}
