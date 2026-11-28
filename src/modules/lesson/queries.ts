import { and, asc, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  courses,
  enrollments,
  lessonNotes,
  lessonProgress,
  lessons,
  questions,
  videos,
} from "@/db/schema"
import { fetchChannelForVideo } from "@/lib/youtube"
import { getCoursePage } from "@/modules/course/queries"
import type { LessonOutline, LessonPageData } from "@/types/lesson"

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
      thumbnailUrl: videos.thumbnailUrl,
      seconds: sql<number>`${lessons.endSeconds} - ${lessons.startSeconds}`,
    })
    .from(lessons)
    .innerJoin(videos, eq(videos.id, lessons.videoId))
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position))
  const index = all.findIndex((l) => l.position === position)
  if (index < 0) return null

  const [[lesson], quiz, [progress], plan, myNotes] = await Promise.all([
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
    db
      .select({
        id: lessonNotes.id,
        seconds: lessonNotes.seconds,
        body: lessonNotes.body,
      })
      .from(lessonNotes)
      .where(
        and(
          eq(lessonNotes.userId, userId),
          eq(lessonNotes.lessonId, all[index].id)
        )
      )
      .orderBy(asc(lessonNotes.seconds), asc(lessonNotes.createdAt)),
  ])
  const creator = await fetchChannelForVideo(lesson.videoId)

  const day =
    plan?.days.find((d) => d.lessons.some((l) => l.position === position))
      ?.day ?? null
  const after = all[index + 1]

  // The side list: the learner's plan by day. A lesson the placement test skipped isn't in the
  // plan, so opening one shows the full course instead (where it sits, marked skipped).
  const byPosition = new Map(all.map((l) => [l.position, l]))
  const days = day === null ? plan?.fullDays : plan?.days
  const outline: LessonOutline = {
    days: (days ?? []).map((d) => ({
      day: d.day,
      lessons: d.lessons.map((l) => ({
        position: l.position,
        title: l.title,
        // Video length, matching the player's clock (study time adds notes and quiz on top).
        minutes: Math.max(
          1,
          Math.round(Number(byPosition.get(l.position)?.seconds ?? 0) / 60)
        ),
        done: l.done,
        skipped: l.skipped,
        thumbnailUrl: byPosition.get(l.position)?.thumbnailUrl ?? null,
      })),
    })),
    doneCount: plan?.doneCount ?? 0,
    total: all.length,
  }

  return {
    course: {
      slug: course.slug,
      title: course.title,
      channel: plan?.channel ?? null,
    },
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
    outline,
    creator,
    myNotes,
  }
}
