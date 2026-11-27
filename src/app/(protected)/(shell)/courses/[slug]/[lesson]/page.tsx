import type { Metadata } from "next"
import LessonPage from "@/modules/lesson/lesson-page"

export const metadata: Metadata = { title: "Lesson" }

export default function Page({
  params,
}: PageProps<"/courses/[slug]/[lesson]">) {
  return <LessonPage params={params} />
}
