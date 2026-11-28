/**
 * Self-check for src/lib/pace.ts. No keys needed.
 *
 *   npx tsx src/lib/pace.check.ts
 */
import assert from "node:assert/strict"

import { isValidPace, packDays, paceLabel, studyMinutes } from "./pace"

// Video length plus 3 minutes for notes and quiz, rounded up.
assert.equal(studyMinutes(600), 13)
assert.equal(studyMinutes(601), 14)

// Lessons fill a day until the next would go over the budget.
assert.deepEqual(packDays([10, 10, 10, 10], 30), [1, 1, 1, 2])
assert.deepEqual(packDays([12, 12, 12], 30), [1, 1, 2])

// A lesson longer than the whole day gets a day of its own (lessons are never split).
assert.deepEqual(packDays([45, 10, 10], 30), [1, 2, 2])
assert.deepEqual(packDays([10, 45, 10], 30), [1, 2, 3])

// More minutes a day, fewer days.
const lessons = [13, 9, 15, 11, 8, 17, 12, 10]
const daysAt = (pace: number) => Math.max(...packDays(lessons, pace))
assert.ok(daysAt(15) > daysAt(30) && daysAt(30) > daysAt(60))
assert.equal(daysAt(90), 2)

// Empty course, silly budget.
assert.deepEqual(packDays([], 30), [])
assert.deepEqual(packDays([10, 10], 0), [1, 2])

// Custom paces: whole minutes from 10 to 480.
assert.ok(isValidPace(45) && isValidPace(10) && isValidPace(480))
assert.ok(
  !isValidPace(9) &&
    !isValidPace(481) &&
    !isValidPace(37.5) &&
    !isValidPace(Number.NaN)
)

assert.deepEqual([30, 60, 90, 120, 45].map(paceLabel), [
  "30 mins",
  "60 mins",
  "90 mins",
  "120 mins",
  "45 mins",
])

console.log("pace.check: ok")
