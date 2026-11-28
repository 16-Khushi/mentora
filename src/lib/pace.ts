/**
 * Packs a course's lessons into days that fit the learner's minutes per day.
 *
 * A lesson's study time is its video length plus a few minutes for the notes and quiz.
 * Lessons stay whole and in order. A day takes lessons until the next one would go over the
 * budget; a lesson longer than a whole day gets a day of its own.
 */

/** One-tap choices for minutes per day. Any other value in CUSTOM_PACE is a custom pace. */
export const PACES = [30, 60, 90, 120] as const
export const DEFAULT_PACE = 30
/** Limits for a custom pace, in minutes a day. */
export const CUSTOM_PACE = { min: 10, max: 480 }

/** Whether `minutes` is a pace a learner may save (a preset or a custom value in range). */
export function isValidPace(minutes: number) {
  return (
    Number.isInteger(minutes) &&
    minutes >= CUSTOM_PACE.min &&
    minutes <= CUSTOM_PACE.max
  )
}

/** A pace as people read it: 30 → "30 mins", 120 → "120 mins". Always minutes, never hours. */
export function paceLabel(minutes: number) {
  return `${minutes} mins`
}

/** Time for reading the notes and taking the quiz, on top of the video. */
export const EXTRA_MINUTES_PER_LESSON = 3

/** How long one lesson takes to study, in minutes (rounded up). */
export function studyMinutes(videoSeconds: number) {
  return Math.ceil(videoSeconds / 60) + EXTRA_MINUTES_PER_LESSON
}

/**
 * For each lesson (in order), the day it falls on: 1, 1, 2, 3, 3…
 * `minutes` are each lesson's study minutes (see studyMinutes).
 */
export function packDays(minutes: number[], minutesPerDay: number): number[] {
  const budget = Math.max(5, minutesPerDay)
  const days: number[] = []
  let day = 1
  let used = 0
  for (const m of minutes) {
    if (used > 0 && used + m > budget) {
      day++
      used = 0
    }
    days.push(day)
    used += m
  }
  return days
}
