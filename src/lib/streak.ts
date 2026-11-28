/**
 * The learning streak: how many days in a row you finished at least one lesson.
 *
 * Days are counted in the learner's own timezone, so this runs in the browser. A streak is still
 * alive if the last finished lesson was yesterday: you have until tonight to keep it going.
 */

/** A date's day in local time, as "2026-11-28". */
export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${m}-${d}`
}

/** Days in a row with a finished lesson, ending today (or yesterday, if today has none yet). */
export function streak(completedAt: Date[], today: Date): number {
  const days = new Set(completedAt.map(dayKey))
  const cursor = new Date(today)
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (days.has(dayKey(cursor))) {
    count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}
