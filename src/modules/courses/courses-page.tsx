import { Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import Mascot from "@/components/mascot"
import PastelCard from "@/components/pastel-card"
import SectionHeading from "@/components/section-heading"
import { buttonVariants } from "@/components/ui/button"
import { auth } from "@/lib/auth"

import CourseCard from "./components/course-card"
import { listCourses } from "./queries"

export default async function CoursesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const list = await listCourses(session.user.id)

  return (
    <div className="page-container flex flex-col gap-8 py-8 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading as="h1" eyebrow="Library" title="My courses" />
        {list.length > 0 && (
          <Link href="/new" className={buttonVariants()}>
            <Plus aria-hidden />
            New course
          </Link>
        )}
      </div>

      {list.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <li key={c.slug} className="flex">
              <CourseCard course={c} />
            </li>
          ))}
        </ul>
      ) : (
        <PastelCard
          tone="lavender"
          className="items-center gap-4 py-12 text-center"
        >
          <Mascot pose="sleeping" size={160} className="w-36" />
          <p className="type-h3 text-ink">No courses yet</p>
          <p className="max-w-[40ch] text-slate">
            Paste a YouTube video or playlist and Mentora turns it into your
            first course.
          </p>
          <Link href="/new" className={buttonVariants({ size: "lg" })}>
            Build your first course
          </Link>
        </PastelCard>
      )}
    </div>
  )
}
