"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "@/db"
import {
  courses,
  lessons,
  placementQuestions,
  placementResults,
} from "@/db/schema"
import { auth } from "@/lib/auth"
import { DONT_KNOW, gradePlacement } from "@/lib/placement"

/**
 * Grades the placement test here on the server (the browser never had the right answers), saves
 * the answers and which lessons leave this learner's plan, then opens the result page.
 * Taking it again replaces the earlier result.
 */
export async function submitPlacement(
  slug: string,
  answers: Record<string, number>
): Promise<{ error: string } | void> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: "Sign in again to save your result." }

  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.slug, slug))
  if (!course) return { error: "This course no longer exists." }

  const questions = await db
    .select({
      id: placementQuestions.id,
      answerIndex: placementQuestions.answerIndex,
      lessonIds: placementQuestions.lessonIds,
      options: placementQuestions.options,
    })
    .from(placementQuestions)
    .where(eq(placementQuestions.courseId, course.id))

  // Only answers to this course's questions, and only real option numbers or "I don't know".
  const clean: Record<string, number> = {}
  for (const q of questions) {
    const a = answers[q.id]
    if (Number.isInteger(a) && a >= DONT_KNOW && a < q.options.length)
      clean[q.id] = a
  }
  const result = gradePlacement(questions, clean)

  await db
    .insert(placementResults)
    .values({ userId, courseId: course.id, ...result, answers: clean })
    .onConflictDoUpdate({
      target: [placementResults.userId, placementResults.courseId],
      set: { ...result, answers: clean, takenAt: new Date() },
    })
  revalidatePath(`/courses/${slug}`)
  revalidatePath("/courses")
  redirect(`/build/${slug}/result?new=1`)
}

/** "Add back": puts a skipped lesson back into the learner's plan. */
export async function addLessonBack(slug: string, position: number) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return
  const [row] = await db
    .select({ courseId: courses.id, lessonId: lessons.id })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(and(eq(courses.slug, slug), eq(lessons.position, position)))
  if (!row) return
  const where = and(
    eq(placementResults.userId, userId),
    eq(placementResults.courseId, row.courseId)
  )
  const [current] = await db
    .select({ skipped: placementResults.skippedLessonIds })
    .from(placementResults)
    .where(where)
  if (!current) return
  await db
    .update(placementResults)
    .set({
      skippedLessonIds: current.skipped.filter((id) => id !== row.lessonId),
    })
    .where(where)
  revalidatePath(`/courses/${slug}`)
  revalidatePath(`/build/${slug}/result`)
}
