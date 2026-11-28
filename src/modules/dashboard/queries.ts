import { and, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import {
  courses,
  enrollments,
  lessonProgress,
  lessons,
  placementResults,
  users,
  videos,
} from "@/db/schema"
import { DEFAULT_PACE, packDays, studyMinutes } from "@/lib/pace"
import type { ContinueLesson, RecentCourse, TodayData } from "@/types/dashboard"

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Everything the Today page shows, from progress Mentora already saves: the lesson to continue,
 * each course's next day of lessons, and the stats. The streak itself is counted in the browser
 * (it depends on the learner's timezone), from the completion times returned here.
 */
export async function getToday(userId: string): Promise<TodayData> {
  const [[user], enrolled, progress, results] = await Promise.all([
    db
      .select({ name: users.name, minutesPerDay: users.minutesPerDay })
      .from(users)
      .where(eq(users.id, userId)),
    db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        joinedAt: enrollments.createdAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(and(eq(enrollments.userId, userId), eq(courses.status, "ready"))),
    db
      .select({
        lessonId: lessonProgress.lessonId,
        watchedSeconds: lessonProgress.watchedSeconds,
        quizCorrect: lessonProgress.quizCorrect,
        quizTotal: lessonProgress.quizTotal,
        completedAt: lessonProgress.completedAt,
        updatedAt: lessonProgress.updatedAt,
      })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId)),
    db
      .select({
        courseId: placementResults.courseId,
        skipped: placementResults.skippedLessonIds,
      })
      .from(placementResults)
      .where(eq(placementResults.userId, userId)),
  ])

  const minutesPerDay = user?.minutesPerDay ?? DEFAULT_PACE
  const weekAgo = Date.now() - WEEK_MS
  const quizzes = progress.filter((p) => p.quizTotal)
  const quizTotal = quizzes.reduce((s, p) => s + (p.quizTotal ?? 0), 0)
  const stats: TodayData["stats"] = {
    lessonsWeek: progress.filter(
      (p) => p.completedAt && p.completedAt.getTime() >= weekAgo
    ).length,
    quizScore: quizTotal
      ? Math.round(
          (100 * quizzes.reduce((s, p) => s + (p.quizCorrect ?? 0), 0)) /
            quizTotal
        )
      : null,
    watchedWeekSeconds: progress
      .filter((p) => p.updatedAt.getTime() >= weekAgo)
      .reduce((s, p) => s + p.watchedSeconds, 0),
    completedAt: progress
      .flatMap((p) => (p.completedAt ? [p.completedAt.toISOString()] : []))
      .sort(),
  }
  const base = {
    name: user?.name?.split(" ")[0] || "there",
    minutesPerDay,
    courseCount: enrolled.length,
    stats,
  }
  if (!enrolled.length) return { ...base, continueLesson: null, recent: [] }

  const lessonRows = await db
    .select({
      id: lessons.id,
      courseId: lessons.courseId,
      position: lessons.position,
      title: lessons.title,
      startSeconds: lessons.startSeconds,
      endSeconds: lessons.endSeconds,
      thumbnailUrl: videos.thumbnailUrl,
    })
    .from(lessons)
    .innerJoin(videos, eq(videos.id, lessons.videoId))
    .where(
      inArray(
        lessons.courseId,
        enrolled.map((c) => c.id)
      )
    )
    .orderBy(lessons.courseId, lessons.position)

  const progressOf = new Map(progress.map((p) => [p.lessonId, p]))
  const skipped = new Set(results.flatMap((r) => r.skipped))

  const perCourse = enrolled.map((course) => {
    const all = lessonRows.filter((l) => l.courseId === course.id)
    const plan = all
      .filter((l) => !skipped.has(l.id))
      .map((l) => ({
        ...l,
        seconds: l.endSeconds - l.startSeconds,
        minutes: studyMinutes(l.endSeconds - l.startSeconds),
        progress: progressOf.get(l.id),
        done: Boolean(progressOf.get(l.id)?.completedAt),
      }))
    const dayOf = packDays(
      plan.map((l) => l.minutes),
      minutesPerDay
    )
    const next = plan.findIndex((l) => !l.done)
    const lastActive = Math.max(
      course.joinedAt.getTime(),
      ...all.map((l) => progressOf.get(l.id)?.updatedAt.getTime() ?? 0)
    )
    return { course, plan, dayOf, next, lastActive }
  })
  perCourse.sort((a, b) => b.lastActive - a.lastActive)

  // The cards: the three most recently studied courses, finished or not.
  const TONES: RecentCourse["tone"][] = [
    "butter",
    "mint",
    "sky",
    "blush",
    "lavender",
    "periwinkle",
  ]
  const recent: RecentCourse[] = perCourse
    .slice(0, 3)
    .map(({ course, plan, next }, i) => ({
      slug: course.slug,
      title: course.title,
      thumbnailUrl: plan[0]?.thumbnailUrl ?? null,
      doneCount: plan.filter((l) => l.done).length,
      planCount: plan.length,
      nextTitle: next >= 0 ? plan[next].title : null,
      tone: TONES[i % TONES.length],
    }))

  // Continue: the lesson you last watched but didn't finish; otherwise your latest course's next one.
  const started = perCourse
    .flatMap(({ course, plan }) =>
      plan
        .filter((l) => !l.done && (l.progress?.watchedSeconds ?? 0) > 0)
        .map((l) => ({ course, l }))
    )
    .sort(
      (a, b) =>
        (b.l.progress?.updatedAt.getTime() ?? 0) -
        (a.l.progress?.updatedAt.getTime() ?? 0)
    )[0]
  const pick =
    started ??
    perCourse
      .filter((c) => c.next >= 0)
      .map(({ course, plan, next }) => ({ course, l: plan[next] }))[0]
  let continueLesson: ContinueLesson | null = null
  if (pick) {
    const { plan, dayOf } = perCourse.find(
      (c) => c.course.id === pick.course.id
    )!
    const day = dayOf[plan.indexOf(pick.l)]
    continueLesson = {
      slug: pick.course.slug,
      courseTitle: pick.course.title,
      position: pick.l.position,
      title: pick.l.title,
      minutes: pick.l.minutes,
      started: Boolean(started),
      day,
      leftToday: plan.filter((l, i) => dayOf[i] === day && !l.done).length,
    }
  }

  return { ...base, continueLesson, recent }
}
