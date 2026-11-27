import type { Metadata } from "next"
import CoursePage from "@/modules/course/course-page"

export const metadata: Metadata = { title: "Course" }

export default function Page({ params }: PageProps<"/courses/[slug]">) {
  return <CoursePage params={params} />
}
