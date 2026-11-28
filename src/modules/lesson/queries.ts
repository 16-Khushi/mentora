import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db"
import {
  courses,
  enrollments,
  lessonProgress,
  lessons,
  questions,
} from "@/db/schema"
import { getCoursePage } from "@/modules/course/queries"
import type { LessonPageData } from "@/types/lesson"

/** One lesson for one learner, or null if the course or lesson doesn't exist. */
export async function getLessonPage(
  slug: string,
  position: number,
  userId: string
): Promise<LessonPageData | null> {
  const [course] = await db
    .select({ id: courses.id, slug: courses.slug, title: courses.title })
    .from(courses)
    .where(eq(courses.slug, slug))
  if (!course || !Number.isInteger(position)) return null
  await db
    .insert(enrollments)
    .values({ userId, courseId: course.id })
    .onConflictDoNothing()

  const all = await db
    .select({
      id: lessons.id,
      position: lessons.position,
      title: lessons.title,
    })
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position))
  const index = all.findIndex((l) => l.position === position)
  if (index < 0) return null

  const [[lesson], quiz, [progress], plan] = await Promise.all([
    db.select().from(lessons).where(eq(lessons.id, all[index].id)),
    db
      .select()
      .from(questions)
      .where(eq(questions.lessonId, all[index].id))
      .orderBy(asc(questions.position)),
    db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, all[index].id)
        )
      ),
    getCoursePage(slug, userId),
  ])

  const day =
    plan?.days.find((d) => d.lessons.some((l) => l.position === position))
      ?.day ?? null
  const after = all[index + 1]
  return {
    course: { slug: course.slug, title: course.title },
    lesson: {
      id: lesson.id,
      position: lesson.position,
      title: lesson.title,
      summary: lesson.summary,
      videoId: lesson.videoId,
      startSeconds: lesson.startSeconds,
      endSeconds: lesson.endSeconds,
      notes: lesson.notes,
    },
    questions: quiz.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      answerIndex: q.answerIndex,
      explanation: q.explanation,
      replaySeconds: q.replaySeconds,
    })),
    day,
    total: all.length,
    prev: all[index - 1]?.position ?? null,
    next: after ? { position: after.position, title: after.title } : null,
    progress: {
      watchedSeconds: progress?.watchedSeconds ?? 0,
      done: Boolean(progress?.completedAt),
      quizCorrect: progress?.quizCorrect ?? null,
      quizTotal: progress?.quizTotal ?? null,
    },
  }
}
