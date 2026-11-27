import type { Metadata } from "next"
import NewCoursePage from "@/modules/new-course/new-course-page"

export const metadata: Metadata = { title: "New course" }

export default function Page() {
  return <NewCoursePage />
}
