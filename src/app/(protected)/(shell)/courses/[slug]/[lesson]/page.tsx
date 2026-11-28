import { and, eq } from "drizzle-orm"
import type { Metadata } from "next"

import { db } from "@/db"
import { courses, lessons } from "@/db/schema"
import LessonPage from "@/modules/lesson/lesson-page"

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]/[lesson]">): Promise<Metadata> {
  const { slug, lesson } = await params
  const [row] = await db
    .select({ title: lessons.title })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(
      and(eq(courses.slug, slug), eq(lessons.position, Number(lesson) || 0))
    )
  return { title: row?.title ?? "Lesson" }
}

export default function Page({
  params,
}: PageProps<"/courses/[slug]/[lesson]">) {
  return <LessonPage params={params} />
}
