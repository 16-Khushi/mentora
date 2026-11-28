import { eq } from "drizzle-orm"
import type { Metadata } from "next"

import { db } from "@/db"
import { courses } from "@/db/schema"
import CoursePage from "@/modules/course/course-page"

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const [course] = await db
    .select({ title: courses.title })
    .from(courses)
    .where(eq(courses.slug, slug))
  return { title: course?.title ?? "Course" }
}

export default function Page({ params }: PageProps<"/courses/[slug]">) {
  return <CoursePage params={params} />
}
