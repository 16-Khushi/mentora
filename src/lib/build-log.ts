import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { courses, courseSteps } from "@/db/schema"

/**
 * Runs one piece of a course build and records it in the build log (course_step), which the
 * build screen shows live: "running" while it works, then "done" with a short result, or "failed".
 * The key is stable ("lesson-4"), so a retry updates the same row instead of adding another.
 */
export async function track<T>(
  courseId: string,
  key: string,
  label: string,
  work: () => Promise<T>,
  result?: (value: T) => string | null
): Promise<T> {
  const where = and(
    eq(courseSteps.courseId, courseId),
    eq(courseSteps.key, key)
  )
  const row = {
    courseId,
    key,
    label,
    status: "running" as const,
    detail: null,
    startedAt: new Date(),
    finishedAt: null,
  }
  await db
    .insert(courseSteps)
    .values(row)
    .onConflictDoUpdate({
      target: [courseSteps.courseId, courseSteps.key],
      set: row,
    })
  try {
    const value = await work()
    await db
      .update(courseSteps)
      .set({
        status: "done",
        detail: result?.(value) ?? null,
        finishedAt: new Date(),
      })
      .where(where)
    return value
  } catch (error) {
    await db
      .update(courseSteps)
      .set({
        status: "failed",
        detail: (error as Error).message.slice(0, 200),
        finishedAt: new Date(),
      })
      .where(where)
    throw error
  }
}

/** Updates the course row (status, progress, error…). */
export function setCourse(
  courseId: string,
  values: Partial<typeof courses.$inferInsert>
) {
  return db.update(courses).set(values).where(eq(courses.id, courseId))
}
