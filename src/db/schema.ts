import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import type { LessonNotes } from "@/types/lesson"

/*
 * Mentora's database, in four groups:
 *   1. Auth.js        who you are (filled in by Auth.js when you sign in with Google)
 *   2. Content        YouTube videos and their captions, shared by everyone
 *   3. Courses        what the AI builds from those videos, also shared
 *   4. Learner        your own progress, never shown to anyone else
 *
 * A course is built once per video or playlist and reused by every learner who adds it,
 * so the second person to paste the same link costs no AI calls.
 */

const createdAt = () =>
  timestamp("created_at", { mode: "date" }).defaultNow().notNull()

// ---------------------------------------------------------------------------------------------
// 1. Auth.js tables. Names and columns must match what @auth/drizzle-adapter expects.
// ---------------------------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // Mentora's own columns:
  /** How many minutes a day the learner wants to study; the daily plan packs lessons around it. */
  minutesPerDay: integer("minutes_per_day").default(30).notNull(),
  createdAt: createdAt(),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
)

// ---------------------------------------------------------------------------------------------
// 2. Content: YouTube videos and their captions.
// ---------------------------------------------------------------------------------------------

/** A chapter from the video's description ("12:30 Attention"), used to cut lessons cleanly. */
export type Chapter = { title: string; startSeconds: number }

export const videos = pgTable("video", {
  /** The YouTube video id, e.g. "kCc8FmEb1nY". */
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  channelTitle: text("channel_title"),
  durationSeconds: integer("duration_seconds").notNull(),
  chapters: jsonb("chapters").$type<Chapter[]>().default([]).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: createdAt(),
})

/** The video's own captions as "[HH:MM:SS] text" lines, fetched once and reused. */
export const videoTranscripts = pgTable("video_transcript", {
  videoId: text("video_id")
    .primaryKey()
    .references(() => videos.id, { onDelete: "cascade" }),
  lines: text("lines").notNull(),
  fetchedAt: createdAt(),
})

// ---------------------------------------------------------------------------------------------
// 3. Courses: what Nemotron builds from the videos.
// ---------------------------------------------------------------------------------------------

export const sourceType = pgEnum("source_type", ["video", "playlist"])

/**
 * Where a course is in its build. queued: waiting for the background job. reading: fetching
 * captions. building: planning and writing lessons. ready: learnable. failed: see `error`.
 */
export const courseStatus = pgEnum("course_status", [
  "queued",
  "reading",
  "building",
  "ready",
  "failed",
])

export const courses = pgTable(
  "course",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Readable, unique part of the URL: /courses/<slug>. */
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    sourceType: sourceType("source_type").notNull(),
    /** The YouTube video or playlist id the course was built from. */
    sourceId: text("source_id").notNull(),
    sourceUrl: text("source_url").notNull(),
    status: courseStatus("status").default("queued").notNull(),
    /** 0 to 100, for the build screen's progress bar. */
    progress: integer("progress").default(0).notNull(),
    /** Why the build failed, in words a learner can read. */
    error: text("error"),
    totalSeconds: integer("total_seconds").default(0).notNull(),
    /** Who pasted the link first. Kept if they delete their account, so others keep the course. */
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    readyAt: timestamp("ready_at", { mode: "date" }),
  },
  // One course per video or playlist: pasting the same link again reuses it.
  (t) => [uniqueIndex("course_source_idx").on(t.sourceType, t.sourceId)]
)

/** Which videos a course is made of, in playlist order. */
export const courseVideos = pgTable(
  "course_video",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.videoId] })]
)

/** One lesson: a time range of one video, with AI-written notes. */
export const lessons = pgTable(
  "lesson",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    /** Order inside the course, starting at 1. */
    position: integer("position").notNull(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id),
    startSeconds: integer("start_seconds").notNull(),
    endSeconds: integer("end_seconds").notNull(),
    title: text("title").notNull(),
    /** One or two sentences from the lesson plan. */
    summary: text("summary").notNull(),
    /** Structured study notes (see src/types/lesson.ts). Empty until the lesson is written. */
    notes: jsonb("notes").$type<LessonNotes>(),
    /** Set when notes and quiz are written; the build screen counts these. */
    writtenAt: timestamp("written_at", { mode: "date" }),
  },
  (t) => [uniqueIndex("lesson_course_position_idx").on(t.courseId, t.position)]
)

/** A quiz question at the end of a lesson. */
export const questions = pgTable(
  "question",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation").notNull(),
    /** The second of the video where the idea is taught, for "Replay the moment". */
    replaySeconds: integer("replay_seconds").notNull(),
  },
  (t) => [index("question_lesson_idx").on(t.lessonId)]
)

/** The course's placement test. A right answer skips the lessons in `lessonIds`. */
export const placementQuestions = pgTable(
  "placement_question",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation").notNull(),
    /** The 1 to 3 lessons this question proves you already know. */
    lessonIds: jsonb("lesson_ids").$type<string[]>().notNull(),
  },
  (t) => [index("placement_question_course_idx").on(t.courseId)]
)

export const stepStatus = pgEnum("step_status", ["running", "done", "failed"])

/**
 * The live build log the build screen shows: one row per piece of work ("Reading captions",
 * "Writing lesson 4"). The key is stable, so a retried step updates its own row.
 */
export const courseSteps = pgTable(
  "course_step",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    status: stepStatus("status").default("running").notNull(),
    /** A short result, e.g. "12 lessons, 2 h 10 min". */
    detail: text("detail"),
    startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { mode: "date" }),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.key] })]
)

// ---------------------------------------------------------------------------------------------
// 4. Learner: your own progress.
// ---------------------------------------------------------------------------------------------

/** A course on your list. */
export const enrollments = pgTable(
  "enrollment",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })]
)

/** How far you got in one lesson. Done at 80% watched or after its quiz. */
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    watchedSeconds: integer("watched_seconds").default(0).notNull(),
    quizCorrect: integer("quiz_correct"),
    quizTotal: integer("quiz_total"),
    completedAt: timestamp("completed_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })]
)

/** Your placement test result, and which lessons it removed from your plan. */
export const placementResults = pgTable(
  "placement_result",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    correct: integer("correct").notNull(),
    total: integer("total").notNull(),
    /** Lessons skipped. You can switch any of them back into your plan, which edits this list. */
    skippedLessonIds: jsonb("skipped_lesson_ids")
      .$type<string[]>()
      .default([])
      .notNull(),
    /** What was picked for each question (question id → option index, -1 for "I don't know"), for the review. */
    answers: jsonb("answers")
      .$type<Record<string, number>>()
      .default({})
      .notNull(),
    takenAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })]
)

/** A learner's own note on a lesson, pinned to a moment of the video ("My notes"). */
export const lessonNotes = pgTable(
  "lesson_note",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    /** The moment it's pinned to, in seconds of the whole video. */
    seconds: integer("seconds").notNull(),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("lesson_note_user_lesson_idx").on(t.userId, t.lessonId)]
)
