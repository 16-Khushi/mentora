import { asc, count, eq } from "drizzle-orm"

import { db } from "@/db"
import {
  courses,
  courseSteps,
  lessons,
  placementQuestions,
  questions,
} from "@/db/schema"
import type { BuildState, Stage, StepState } from "@/types/build"

type Step = {
  key: string
  status: "running" | "done" | "failed"
  detail: string | null
  finishedAt: Date | null
}

/** Combines several build-log rows (one per video) into one stage. */
function stage(steps: Step[], fallback: StepState = "waiting"): Stage {
  if (!steps.length) return { state: fallback, detail: null }
  const state: StepState = steps.some((s) => s.status === "running")
    ? "running"
    : steps.every((s) => s.status === "failed")
      ? "failed"
      : "done"
  const last = steps.filter((s) => s.detail).at(-1)
  return { state, detail: last?.detail ?? null }
}

/** The build screen's view of a course, or null if there's no such course. */
export async function getBuildState(slug: string): Promise<BuildState | null> {
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug))
  if (!course) return null

  const [steps, lessonRows, [{ quiz }], [{ placement }]] = await Promise.all([
    db
      .select({
        key: courseSteps.key,
        status: courseSteps.status,
        detail: courseSteps.detail,
        finishedAt: courseSteps.finishedAt,
      })
      .from(courseSteps)
      .where(eq(courseSteps.courseId, course.id))
      .orderBy(asc(courseSteps.startedAt)),
    db
      .select({
        id: lessons.id,
        position: lessons.position,
        title: lessons.title,
      })
      .from(lessons)
      .where(eq(lessons.courseId, course.id))
      .orderBy(asc(lessons.position)),
    db
      .select({ quiz: count() })
      .from(questions)
      .innerJoin(lessons, eq(lessons.id, questions.lessonId))
      .where(eq(lessons.courseId, course.id)),
    db
      .select({ placement: count() })
      .from(placementQuestions)
      .where(eq(placementQuestions.courseId, course.id)),
  ])

  const byPrefix = (prefix: string) =>
    steps.filter((s) => s.key.startsWith(prefix))
  const lessonSteps = new Map(
    byPrefix("lesson-").map((s) => [Number(s.key.slice(7)), s])
  )
  const latestStep = byPrefix("lesson-")
    .filter((s) => s.status === "done" && s.finishedAt)
    .sort((a, b) => b.finishedAt!.getTime() - a.finishedAt!.getTime())[0]
  const latestPosition = latestStep ? Number(latestStep.key.slice(7)) : null
  const latestLesson = lessonRows.find((l) => l.position === latestPosition)

  return {
    slug: course.slug,
    title: course.title,
    status: course.status,
    progress: course.progress,
    error: course.error,
    totalSeconds: course.totalSeconds,
    builtInSeconds:
      course.readyAt && course.status === "ready"
        ? Math.round(
            (course.readyAt.getTime() - course.createdAt.getTime()) / 1000
          )
        : null,
    stages: {
      captions: stage(
        byPrefix("captions-"),
        course.status === "queued" ? "waiting" : "running"
      ),
      plan: stage(byPrefix("plan-")),
      placement: stage(byPrefix("placement")),
    },
    lessons: lessonRows.map((l) => {
      const s = lessonSteps.get(l.position)
      return {
        position: l.position,
        title: l.title,
        state: s ? (s.status as StepState) : "waiting",
      }
    }),
    latest: latestLesson
      ? {
          position: latestLesson.position,
          title: latestLesson.title,
          detail: latestStep?.detail ?? null,
        }
      : null,
    quizQuestions: quiz,
    placementQuestions: placement,
  }
}
