import { and, asc, count, eq, inArray, isNotNull } from "drizzle-orm"

import { db } from "@/db"
import {
  courses,
  courseVideos,
  enrollments,
  lessonProgress,
  lessons,
  placementQuestions,
  placementResults,
  users,
  videos,
} from "@/db/schema"
import { DEFAULT_PACE, packDays, studyMinutes } from "@/lib/pace"
import type { CourseDay, CourseLesson, CoursePageData } from "@/types/course"

/**
 * Everything the course page shows for one learner. Joining is implicit: opening a course
 * (for example from a shared link) adds it to the learner's courses.
 */
export async function getCoursePage(
  slug: string,
  userId: string
): Promise<CoursePageData | null> {
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug))
  if (!course) return null
  await db
    .insert(enrollments)
    .values({ userId, courseId: course.id })
    .onConflictDoNothing()

  const [[user], [firstVideo], rows, [placement], [result]] = await Promise.all(
    [
      db
        .select({ minutesPerDay: users.minutesPerDay })
        .from(users)
        .where(eq(users.id, userId)),
      db
        .select({
          channel: videos.channelTitle,
          thumbnailUrl: videos.thumbnailUrl,
        })
        .from(courseVideos)
        .innerJoin(videos, eq(videos.id, courseVideos.videoId))
        .where(eq(courseVideos.courseId, course.id))
        .orderBy(asc(courseVideos.position))
        .limit(1),
      db
        .select({
          id: lessons.id,
          position: lessons.position,
          title: lessons.title,
          summary: lessons.summary,
          startSeconds: lessons.startSeconds,
          endSeconds: lessons.endSeconds,
          writtenAt: lessons.writtenAt,
        })
        .from(lessons)
        .where(eq(lessons.courseId, course.id))
        .orderBy(asc(lessons.position)),
      db
        .select({ n: count() })
        .from(placementQuestions)
        .where(eq(placementQuestions.courseId, course.id)),
      db
        .select({ skipped: placementResults.skippedLessonIds })
        .from(placementResults)
        .where(
          and(
            eq(placementResults.userId, userId),
            eq(placementResults.courseId, course.id)
          )
        ),
    ]
  )

  const ids = rows.map((r) => r.id)
  const doneIds = new Set(
    ids.length
      ? (
          await db
            .select({ id: lessonProgress.lessonId })
            .from(lessonProgress)
            .where(
              and(
                eq(lessonProgress.userId, userId),
                inArray(lessonProgress.lessonId, ids),
                isNotNull(lessonProgress.completedAt)
              )
            )
        ).map((r) => r.id)
      : []
  )
  const skippedIds = new Set(result?.skipped ?? [])

  const all: CourseLesson[] = rows.map((r) => ({
    position: r.position,
    title: r.title,
    summary: r.summary,
    minutes: studyMinutes(r.endSeconds - r.startSeconds),
    written: Boolean(r.writtenAt),
    done: doneIds.has(r.id),
    skipped: skippedIds.has(r.id),
  }))
  const plan = all.filter((l) => !l.skipped)
  const minutesPerDay = user?.minutesPerDay ?? DEFAULT_PACE
  const days = groupDays(plan, minutesPerDay)
  const fullDays = groupDays(all, minutesPerDay)
  const skipped = all.filter((l) => l.skipped)

  const next = plan.find((l) => !l.done) ?? null
  return {
    slug: course.slug,
    title: course.title,
    channel: firstVideo?.channel ?? null,
    thumbnailUrl: firstVideo?.thumbnailUrl ?? null,
    status: course.status,
    minutesPerDay,
    lessons: all,
    days,
    fullDays,
    skippedCount: skipped.length,
    minutesSaved: skipped.reduce((sum, l) => sum + l.minutes, 0),
    today: days.find((d) => d.lessons.some((l) => !l.done))?.day ?? null,
    next,
    doneCount: plan.filter((l) => l.done).length,
    planCount: plan.length,
    placement: { available: (placement?.n ?? 0) > 0, taken: Boolean(result) },
  }
}

/** Lessons (in order) packed into days that fit the learner's minutes per day. */
function groupDays(list: CourseLesson[], minutesPerDay: number): CourseDay[] {
  const dayOf = packDays(
    list.map((l) => l.minutes),
    minutesPerDay
  )
  const days: CourseDay[] = []
  list.forEach((lesson, i) => {
    let group = days.find((d) => d.day === dayOf[i])
    if (!group) days.push((group = { day: dayOf[i], minutes: 0, lessons: [] }))
    group.lessons.push(lesson)
    group.minutes += lesson.minutes
  })
  return days
}
