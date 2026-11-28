import type { Tone } from "@/types/design"

/** One day of the plan. */
export type CourseDay = {
  day: number
  minutes: number
  lessons: CourseLesson[]
}

/** One lesson as the course page lists it. */
export type CourseLesson = {
  position: number
  title: string
  summary: string
  minutes: number
  /** Notes and quiz are written (false only if every model failed for this lesson). */
  written: boolean
  done: boolean
  /** Removed from this learner's plan by their placement test. */
  skipped: boolean
}

export type CoursePageData = {
  slug: string
  title: string
  channel: string | null
  thumbnailUrl: string | null
  status: "queued" | "reading" | "building" | "ready" | "failed"
  minutesPerDay: number
  lessons: CourseLesson[]
  /** The lessons in the learner's plan (not skipped), grouped into days. */
  days: CourseDay[]
  /** Every lesson, skipped ones included, grouped into days ("Full course"). */
  fullDays: CourseDay[]
  /** Lessons the placement test removed, and the study time that saves. */
  skippedCount: number
  minutesSaved: number
  /** The first day that still has an unfinished lesson (null when everything is done). */
  today: number | null
  /** The next lesson to study (null when finished). */
  next: CourseLesson | null
  doneCount: number
  planCount: number
  placement: { available: boolean; taken: boolean }
}

/** A course on the My courses page. */
export type CourseCard = {
  slug: string
  title: string
  channel: string | null
  thumbnailUrl: string | null
  status: CoursePageData["status"]
  lessons: number
  done: number
  totalSeconds: number
  tone: Tone
}
