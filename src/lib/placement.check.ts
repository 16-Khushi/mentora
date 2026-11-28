/**
 * Self-check for src/lib/placement.ts. No keys needed.
 *
 *   npx tsx src/lib/placement.check.ts
 */
import assert from "node:assert/strict"

import { DONT_KNOW, gradePlacement } from "./placement"

const q = (id: string, answerIndex: number, lessonIds: string[]) => ({
  id,
  answerIndex,
  lessonIds,
})
const test = [
  q("q1", 0, ["L1"]),
  q("q2", 1, ["L2", "L3"]),
  q("q3", 2, ["L3"]),
  q("q4", 0, ["L4"]),
]

// Right answers skip the lessons they prove.
assert.deepEqual(gradePlacement(test, { q1: 0, q4: 0 }), {
  correct: 2,
  total: 4,
  skippedLessonIds: ["L1", "L4"],
})

// A wrong answer about a lesson keeps it, even if another question about it was right.
assert.deepEqual(gradePlacement(test, { q2: 1, q3: 0 }).skippedLessonIds, [
  "L2",
])

// "I don't know" and unanswered questions prove nothing and keep nothing out.
assert.deepEqual(gradePlacement(test, { q1: DONT_KNOW, q2: DONT_KNOW }), {
  correct: 0,
  total: 4,
  skippedLessonIds: [],
})

// Everything right: every lesson is skipped.
assert.deepEqual(
  gradePlacement(test, { q1: 0, q2: 1, q3: 2, q4: 0 }).skippedLessonIds.sort(),
  ["L1", "L2", "L3", "L4"]
)

console.log("placement.check: ok")
