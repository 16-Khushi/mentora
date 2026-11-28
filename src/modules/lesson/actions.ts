"use server"

import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { lessonNotes, lessonProgress, lessons } from "@/db/schema"
import { auth } from "@/lib/auth"

/** Share of a lesson that counts as watched. */
const WATCHED = 0.8

async function lessonLength(lessonId: string) {
  const [l] = await db
    .select({ start: lessons.startSeconds, end: lessons.endSeconds })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
  return l ? l.end - l.start : null
}

/**
 * Saves how many seconds of this lesson the learner has actually watched (never goes down).
 * At 80% of the lesson it counts as done. Returns whether it's done.
 */
export async function saveWatch(
  lessonId: string,
  watchedSeconds: number
): Promise<boolean> {
  const session = await auth()
  const userId = session?.user?.id
  const length = await lessonLength(lessonId)
  if (!userId || !length) return false
  const seconds = Math.max(0, Math.min(Math.round(watchedSeconds), length))
  const done = seconds >= length * WATCHED

  await db
    .insert(lessonProgress)
    .values({
      userId,
      lessonId,
      watchedSeconds: seconds,
      completedAt: done ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        watchedSeconds: sql`greatest(${lessonProgress.watchedSeconds}, ${seconds})`,
        // Only ever set once: the first time the lesson reaches 80%.
        ...(done && {
          completedAt: sql`coalesce(${lessonProgress.completedAt}, now())`,
        }),
        updatedAt: new Date(),
      },
    })
  if (done) revalidatePath("/courses", "layout")
  return done
}

/** Saves the quiz score. Finishing the quiz marks the lesson done. */
export async function saveQuiz(
  lessonId: string,
  correct: number,
  total: number
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId || !(await lessonLength(lessonId))) return
  const score = {
    quizCorrect: Math.max(0, Math.round(correct)),
    quizTotal: Math.max(0, Math.round(total)),
  }
  await db
    .insert(lessonProgress)
    .values({ userId, lessonId, ...score, completedAt: new Date() })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        ...score,
        completedAt: sql`coalesce(${lessonProgress.completedAt}, now())`,
        updatedAt: new Date(),
      },
    })
  revalidatePath("/courses", "layout")
  revalidatePath("/dashboard")
}

/**
 * "Mark as completed" (or undo it): for lessons the learner finished some other way, like
 * reading the notes or watching on YouTube. Watch time is left as it is.
 */
export async function setLessonDone(lessonId: string, done: boolean) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return
  const completedAt = done ? new Date() : null
  await db
    .insert(lessonProgress)
    .values({ userId, lessonId, completedAt })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: { completedAt, updatedAt: new Date() },
    })
  revalidatePath("/courses", "layout")
  revalidatePath("/dashboard")
}

const NOTE_MAX = 2000

/** "My notes": saves a note pinned to a moment of the video. Returns the saved note. */
export async function addLessonNote(
  lessonId: string,
  seconds: number,
  body: string
) {
  const session = await auth()
  const userId = session?.user?.id
  const text = body.trim().slice(0, NOTE_MAX)
  if (!userId || !text) return null
  const [note] = await db
    .insert(lessonNotes)
    .values({
      userId,
      lessonId,
      seconds: Math.max(0, Math.round(seconds)),
      body: text,
    })
    .returning({
      id: lessonNotes.id,
      seconds: lessonNotes.seconds,
      body: lessonNotes.body,
    })
  return note
}

/** Deletes one of the learner's own notes. */
export async function deleteLessonNote(id: string) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return
  await db
    .delete(lessonNotes)
    .where(and(eq(lessonNotes.id, id), eq(lessonNotes.userId, userId)))
}
