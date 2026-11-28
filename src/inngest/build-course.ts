import { and, asc, count, eq, inArray, isNotNull } from "drizzle-orm"
import { NonRetriableError } from "inngest"

import { db } from "@/db"
import {
  courses,
  courseVideos,
  lessons,
  placementQuestions,
  questions,
  videos,
  videoTranscripts,
} from "@/db/schema"
import { setCourse, track } from "@/lib/build-log"
import { MODELS } from "@/lib/ai"
import {
  planVideo,
  writeLesson,
  writePlacementTest,
  type PlannedLesson,
} from "@/lib/course-writer"
import { fetchTranscript, sliceLines } from "@/lib/transcript"

import { BUILD_COURSE, inngest } from "./client"

/** What the learner sees when a course can't be built. */
const NO_CAPTIONS =
  "None of these videos have captions, so Mentora can't build a course from them."
const GENERIC_FAILURE =
  "Something went wrong while building this course. Paste the link again to retry."

/** Progress bar: captions 0–10, planning 10–20, lessons 20–95, placement test 95–100. */
const LESSONS_FROM = 20
const LESSONS_TO = 95

const modelName = (m: keyof typeof MODELS) =>
  ({
    ultra: "Nemotron 3 Ultra",
    super: "Nemotron 3.5 Super",
    lightning: "Nemotron 3.5 Lightning",
  })[m]
const minutes = (s: number) => `${Math.round(s / 60)} min`
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/** Fewer lessons than this and there's nothing worth skipping, so no placement test. */
const PLACEMENT_MIN_LESSONS = 3

async function transcriptLines(videoId: string) {
  const [row] = await db
    .select({ lines: videoTranscripts.lines })
    .from(videoTranscripts)
    .where(eq(videoTranscripts.videoId, videoId))
  return row?.lines ?? ""
}

/**
 * The durable course build. Each `step.run` is saved by Inngest once it succeeds, so if the server
 * restarts or a step fails and is retried, the build resumes from where it stopped instead of
 * starting over. Steps write to the database and return small values, keeping Inngest's saved
 * state tiny.
 */
export const buildCourse = inngest.createFunction(
  {
    id: "build-course",
    triggers: [{ event: BUILD_COURSE }],
    retries: 2, // on top of the waits and backup models inside each Nemotron call
    // Pasting the same link again while it's building replaces the old build.
    cancelOn: [{ event: BUILD_COURSE, match: "data.courseId" }],
    onFailure: async ({ event, error }) => {
      const courseId = event.data.event.data.courseId as string
      const message =
        error.message === NO_CAPTIONS ? NO_CAPTIONS : GENERIC_FAILURE
      console.error(`[build-course] ${courseId} failed: ${error.message}`)
      await setCourse(courseId, { status: "failed", error: message })
    },
  },
  async ({ event, step }) => {
    const courseId = event.data.courseId as string

    // 1. What are we building?
    const course = await step.run("load", async () => {
      const [row] = await db
        .select({ title: courses.title })
        .from(courses)
        .where(eq(courses.id, courseId))
      if (!row) throw new NonRetriableError(`Course ${courseId} not found`)
      const list = await db
        .select({
          id: videos.id,
          title: videos.title,
          durationSeconds: videos.durationSeconds,
        })
        .from(courseVideos)
        .innerJoin(videos, eq(videos.id, courseVideos.videoId))
        .where(eq(courseVideos.courseId, courseId))
        .orderBy(asc(courseVideos.position))
      await setCourse(courseId, { status: "reading", progress: 2, error: null })
      return { title: row.title, videos: list }
    })

    // 2. Captions for every video (cached ones are reused). Videos without captions are dropped.
    const kept = await step.run("captions", async () => {
      const withCaptions: string[] = []
      for (const [i, v] of course.videos.entries()) {
        const ok = await track(
          courseId,
          `captions-${v.id}`,
          `Reading captions: ${v.title}`,
          async () => {
            if (await transcriptLines(v.id)) return true
            const t = await fetchTranscript(v.id)
            if (!t) return false
            await db
              .insert(videoTranscripts)
              .values({ videoId: v.id, lines: t.lines })
              .onConflictDoNothing()
            return true
          },
          (has) =>
            has
              ? `${minutes(v.durationSeconds)} of captions`
              : "No captions: left out"
        )
        if (ok) withCaptions.push(v.id)
        else {
          await db
            .delete(courseVideos)
            .where(
              and(
                eq(courseVideos.courseId, courseId),
                eq(courseVideos.videoId, v.id)
              )
            )
        }
        await setCourse(courseId, {
          progress: 2 + Math.round((8 * (i + 1)) / course.videos.length),
        })
      }
      if (!withCaptions.length) throw new NonRetriableError(NO_CAPTIONS)
      await setCourse(courseId, { status: "building", progress: 10 })
      return withCaptions
    })

    // 3. Plan each video's lessons, side by side.
    const plans = await Promise.all(
      kept.map((videoId) =>
        step.run(`plan-${videoId}`, async () => {
          const [video] = await db
            .select()
            .from(videos)
            .where(eq(videos.id, videoId))
          return track(
            courseId,
            `plan-${videoId}`,
            course.videos.length > 1
              ? `Planning lessons: ${video.title}`
              : "Planning the lessons",
            async () =>
              planVideo({
                courseTitle: course.title,
                video,
                lines: await transcriptLines(videoId),
              }),
            (r) =>
              `${plural(r.lessons.length, "lesson")} by ${modelName(r.model)}`
          ).then((r) => r.lessons)
        })
      )
    )

    // 4. Save the plan as lessons, numbered across the whole course.
    const lessonRows = await step.run("save-plan", async () => {
      const planned: PlannedLesson[] = plans.flat()
      // A retry of this step must not add the lessons twice.
      await db.delete(lessons).where(eq(lessons.courseId, courseId))
      const rows = await db
        .insert(lessons)
        .values(planned.map((l, i) => ({ ...l, courseId, position: i + 1 })))
        .returning({ id: lessons.id, position: lessons.position })
      const totalSeconds = planned.reduce(
        (s, l) => s + (l.endSeconds - l.startSeconds),
        0
      )
      await setCourse(courseId, { progress: LESSONS_FROM, totalSeconds })
      return rows
    })

    // 5. Write every lesson side by side, each its own step (retried on its own if it fails).
    await Promise.all(
      lessonRows.map(({ id, position }) =>
        step.run(`lesson-${position}`, async () => {
          const [lesson] = await db
            .select()
            .from(lessons)
            .where(eq(lessons.id, id))
          if (lesson.writtenAt) return true // already written by an earlier attempt
          try {
            await track(
              courseId,
              `lesson-${position}`,
              `Writing lesson ${position}: ${lesson.title}`,
              async () => {
                const lines = sliceLines(
                  await transcriptLines(lesson.videoId),
                  lesson.startSeconds,
                  lesson.endSeconds
                )
                const written = await writeLesson({
                  courseTitle: course.title,
                  lesson,
                  lines,
                })
                await db.delete(questions).where(eq(questions.lessonId, id))
                await db.insert(questions).values(
                  written.questions.map((q, i) => ({
                    ...q,
                    lessonId: id,
                    position: i + 1,
                  }))
                )
                await db
                  .update(lessons)
                  .set({ notes: written.notes, writtenAt: new Date() })
                  .where(eq(lessons.id, id))
                return written
              },
              (w) =>
                `${w.notes.sections.length} sections, ${w.questions.length} quiz questions, by ${modelName(w.model)}`
            )
          } catch {
            // Every backup model failed for this lesson. The course still works without its notes;
            // the build log shows which one failed.
            return false
          } finally {
            const [{ written }] = await db
              .select({ written: count() })
              .from(lessons)
              .where(
                and(
                  eq(lessons.courseId, courseId),
                  isNotNull(lessons.writtenAt)
                )
              )
            const share = written / lessonRows.length
            await setCourse(courseId, {
              progress: Math.round(
                LESSONS_FROM + (LESSONS_TO - LESSONS_FROM) * share
              ),
            })
          }
          return true
        })
      )
    )

    // 6. The placement test, from the written lessons. A course still works without one.
    await step.run("placement", async () => {
      const rows = await db
        .select({
          id: lessons.id,
          title: lessons.title,
          summary: lessons.summary,
          notes: lessons.notes,
        })
        .from(lessons)
        .where(eq(lessons.courseId, courseId))
        .orderBy(asc(lessons.position))
      if (!rows.some((r) => r.notes)) {
        throw new NonRetriableError("No lessons could be written")
      }
      if (rows.length < PLACEMENT_MIN_LESSONS) {
        await track(
          courseId,
          "placement",
          "Writing the placement test",
          async () => null,
          () => "Not needed for a short course"
        )
        return
      }
      try {
        await track(
          courseId,
          "placement",
          "Writing the placement test",
          async () => {
            const test = await writePlacementTest({
              courseTitle: course.title,
              lessons: rows,
            })
            await db
              .delete(placementQuestions)
              .where(eq(placementQuestions.courseId, courseId))
            await db.insert(placementQuestions).values(
              test.questions.map((q, i) => ({
                courseId,
                position: i + 1,
                prompt: q.prompt,
                options: q.options,
                answerIndex: q.answerIndex,
                explanation: q.explanation,
                lessonIds: q.lessonPositions.map((p) => rows[p - 1].id),
              }))
            )
            return test
          },
          (t) => `${t.questions.length} questions by ${modelName(t.model)}`
        )
      } catch {
        // Learners can still take the course; they just won't be offered the test.
      }
    })

    // 7. Ready.
    await step.run("finish", async () => {
      const ids = lessonRows.map((r) => r.id)
      const [{ written }] = await db
        .select({ written: count() })
        .from(lessons)
        .where(and(inArray(lessons.id, ids), isNotNull(lessons.writtenAt)))
      await setCourse(courseId, {
        status: "ready",
        progress: 100,
        readyAt: new Date(),
      })
      return { lessons: ids.length, written }
    })
  }
)
