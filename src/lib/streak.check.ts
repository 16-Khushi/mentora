/**
 * Self-check for src/lib/streak.ts. No keys needed.
 *
 *   npx tsx src/lib/streak.check.ts
 */
import assert from "node:assert/strict"

import { dayKey, streak } from "./streak"

const today = new Date(2026, 10, 28, 21, 30) // 28 Nov, 9:30 pm local
const at = (day: number, hour = 12) => new Date(2026, 10, day, hour)

assert.equal(dayKey(today), "2026-11-28")

// Nothing finished: no streak.
assert.equal(streak([], today), 0)

// Today, yesterday and the day before: 3, however many lessons a day.
assert.equal(streak([at(28), at(28, 8), at(27), at(26)], today), 3)

// Nothing yet today but yesterday counts: the streak is still alive.
assert.equal(streak([at(27), at(26)], today), 2)

// A missed day breaks it: only the run that reaches today or yesterday counts.
assert.equal(streak([at(28), at(26), at(25)], today), 1)
assert.equal(streak([at(25), at(24)], today), 0)

// Across a month boundary.
const dec2 = new Date(2026, 11, 2, 10)
assert.equal(
  streak([new Date(2026, 11, 2), new Date(2026, 11, 1), at(30), at(29)], dec2),
  4
)

console.log("streak.check: ok")
