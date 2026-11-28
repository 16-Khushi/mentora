import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db"
import {
  courses,
  courseVideos,
  enrollments,
  lessons,
  placementQuestions,
  placementResults,
  users,
  videos,
} from "@/db/schema"
import { DEFAULT_PACE, packDays, studyMinutes } from "@/lib/pace"
import { DONT_KNOW } from "@/lib/placement"
import type {
  AnswerStatus,
  PlacementResultData,
  ResultLesson,
} from "@/types/placement"

/** A placement question as the browser sees it during the test: no right answer, so it can't be peeked at. */
export type PublicQuestion = { id: string; prompt: string; options: string[] }

export async function getPlacement(slug: string, userId: string) {
  const [course] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      status: courses.status,
    })
    .from(courses)
    .where(eq(courses.slug, slug))
  if (!course) return null
  await db
    .insert(enrollments)
    .values({ userId, courseId: course.id })
    .onConflictDoNothing()

  const [questions, [taken]] = await Promise.all([
    db
      .select({
        id: placementQuestions.id,
        prompt: placementQuestions.prompt,
        options: placementQuestions.options,
      })
      .from(placementQuestions)
      .where(eq(placementQuestions.courseId, course.id))
      .orderBy(asc(placementQuestions.position)),
    db
      .select({
        correct: placementResults.correct,
        total: placementResults.total,
      })
      .from(placementResults)
      .where(
        and(
          eq(placementResults.userId, userId),
          eq(placementResults.courseId, course.id)
        )
      ),
  ])
  return {
    course,
    questions: questions as PublicQuestion[],
    taken: taken ?? null,
  }
}

/**
 * The result page after a placement test: every question with what was picked and the right
 * answer, and the course split into "You know this" and "You'll learn this".
 * Null when the course doesn't exist; `result: null` when this learner hasn't taken the test.
 */
export async function getPlacementResult(
  slug: string,
  userId: string
): Promise<{ data: PlacementResultData | null } | null> {
  const [course] = await db
    .select({ id: courses.id, slug: courses.slug, title: courses.title })
    .from(courses)
    .where(eq(courses.slug, slug))
  if (!course) return null

  const [[result], [user], courseVids, lessonRows, questionRows] =
    await Promise.all([
      db
        .select()
        .from(placementResults)
        .where(
          and(
            eq(placementResults.userId, userId),
            eq(placementResults.courseId, course.id)
          )
        ),
      db
        .select({ minutesPerDay: users.minutesPerDay })
        .from(users)
        .where(eq(users.id, userId)),
      db
        .select({
          channel: videos.channelTitle,
          thumbnailUrl: videos.thumbnailUrl,
          seconds: videos.durationSeconds,
        })
        .from(courseVideos)
        .innerJoin(videos, eq(videos.id, courseVideos.videoId))
        .where(eq(courseVideos.courseId, course.id))
        .orderBy(asc(courseVideos.position)),
      db
        .select({
          id: lessons.id,
          position: lessons.position,
          title: lessons.title,
          startSeconds: lessons.startSeconds,
          endSeconds: lessons.endSeconds,
          thumbnailUrl: videos.thumbnailUrl,
        })
        .from(lessons)
        .innerJoin(videos, eq(videos.id, lessons.videoId))
        .where(eq(lessons.courseId, course.id))
        .orderBy(asc(lessons.position)),
      db
        .select()
        .from(placementQuestions)
        .where(eq(placementQuestions.courseId, course.id))
        .orderBy(asc(placementQuestions.position)),
    ])
  if (!result) return { data: null }

  const skipped = new Set(result.skippedLessonIds)
  const lessonList: ResultLesson[] = lessonRows.map((l) => ({
    position: l.position,
    title: l.title,
    minutes: studyMinutes(l.endSeconds - l.startSeconds),
    startSeconds: l.startSeconds,
    thumbnailUrl: l.thumbnailUrl,
    skipped: skipped.has(l.id),
  }))
  const byId = new Map(lessonRows.map((l, i) => [l.id, lessonList[i]]))

  const counts: Record<AnswerStatus, number> = { right: 0, wrong: 0, idk: 0 }
  const questions = questionRows.map((q) => {
    const picked = result.answers[q.id] ?? DONT_KNOW
    const status: AnswerStatus =
      picked === DONT_KNOW
        ? "idk"
        : picked === q.answerIndex
          ? "right"
          : "wrong"
    counts[status]++
    const first = q.lessonIds.map((id) => byId.get(id)).find(Boolean)
    return {
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      answerIndex: q.answerIndex,
      picked,
      status,
      explanation: q.explanation,
      lesson: {
        position: first?.position ?? 1,
        title: first?.title ?? "",
        inPlan: first ? !first.skipped : true,
      },
    }
  })

  const minutesPerDay = user?.minutesPerDay ?? DEFAULT_PACE
  const plan = lessonList.filter((l) => !l.skipped)
  const measure = (list: ResultLesson[]) => ({
    minutes: list.reduce((sum, l) => sum + l.minutes, 0),
    days:
      packDays(
        list.map((l) => l.minutes),
        minutesPerDay
      ).at(-1) ?? 0,
  })

  return {
    data: {
      slug: course.slug,
      title: course.title,
      channel: courseVids[0]?.channel ?? null,
      thumbnailUrl: courseVids[0]?.thumbnailUrl ?? null,
      videoSeconds: courseVids.reduce((sum, v) => sum + v.seconds, 0),
      minutesPerDay,
      correct: result.correct,
      total: result.total,
      counts,
      questions,
      lessons: lessonList,
      full: measure(lessonList),
      mine: measure(plan),
    },
  }
}
