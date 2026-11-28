/**
 * Self-check for src/lib/transcript.ts.
 *
 *   npx tsx src/lib/transcript.check.ts       formatting and slicing only
 *   npx tsx --env-file=.env.local src/lib/transcript.check.ts --live [videoId]
 *                                             also fetches real captions (needs SUPADATA_API_KEY;
 *                                             uses 1 Supadata credit per video)
 */
import assert from "node:assert/strict"

import {
  chunksToLines,
  clock,
  fetchTranscript,
  lineSeconds,
  sliceLines,
} from "./transcript"

// ---- Clock ----------------------------------------------------------------------------------
assert.equal(clock(0), "00:00:00")
assert.equal(clock(8.9), "00:00:08")
assert.equal(clock(3723), "01:02:03")

// ---- Chunks to lines (Supadata times are in milliseconds) -----------------------------------
const lines = chunksToLines([
  { text: "so today we're going to", offset: 8150, duration: 1200 },
  { text: "  build a GPT \n from scratch ", offset: 9350, duration: 2000 },
  { text: "   ", offset: 11000, duration: 500 }, // empty: dropped
  { text: "attention is the key idea", offset: 125_000, duration: 3000 },
  { text: "see you next time", offset: 3_723_000, duration: 1000 },
])
assert.equal(
  lines,
  [
    "[00:00:08] so today we're going to",
    "[00:00:09] build a GPT from scratch",
    "[00:02:05] attention is the key idea",
    "[01:02:03] see you next time",
  ].join("\n")
)

// ---- Reading a line's time, and slicing a lesson's window -----------------------------------
assert.equal(lineSeconds("[00:02:05] attention"), 125)
assert.equal(lineSeconds("no timestamp"), null)
assert.equal(
  sliceLines(lines, 9, 200),
  "[00:00:09] build a GPT from scratch\n[00:02:05] attention is the key idea"
)
assert.equal(sliceLines(lines, 0, 9), "[00:00:08] so today we're going to") // end is exclusive
assert.equal(sliceLines(lines, 5000, 6000), "")

console.log("transcript.check: formatting ok")

// ---- Live (optional) ------------------------------------------------------------------------
if (process.argv.includes("--live")) {
  const id =
    process.argv.find((a) => /^[A-Za-z0-9_-]{11}$/.test(a)) ?? "kCc8FmEb1nY"
  const started = Date.now()
  const t = await fetchTranscript(id)
  if (!t) {
    console.log(`live: ${id} has no captions`)
  } else {
    const all = t.lines.split("\n")
    console.log(
      `live: ${id} → ${all.length} lines in ${t.lang}, ${Math.round((Date.now() - started) / 100) / 10}s`
    )
    console.log("  first:", all[0])
    console.log("  last: ", all[all.length - 1])
    assert.ok(lineSeconds(all[0]) !== null)
  }
  console.log("transcript.check: live ok")
}
