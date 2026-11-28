"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "@/db"
import { courses, enrollments, users } from "@/db/schema"
import { auth } from "@/lib/auth"
import { isValidPace } from "@/lib/pace"

/** Saves how many minutes a day the learner studies; every course's days re-pack around it. */
export async function setPace(minutes: number) {
  const session = await auth()
  if (!session?.user?.id) return
  if (!isValidPace(minutes)) return
  await db
    .update(users)
    .set({ minutesPerDay: minutes })
    .where(eq(users.id, session.user.id))
  revalidatePath("/courses", "layout")
  revalidatePath("/dashboard")
}

/**
 * Removes the course from the learner's courses. Their progress is kept, so opening the course
 * again (from a link or by pasting the video) picks up where they left off.
 */
export async function leaveCourse(slug: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.slug, slug))
  if (course) {
    await db
      .delete(enrollments)
      .where(
        and(
          eq(enrollments.userId, session.user.id),
          eq(enrollments.courseId, course.id)
        )
      )
  }
  revalidatePath("/courses")
  revalidatePath("/dashboard")
  redirect("/courses")
}
