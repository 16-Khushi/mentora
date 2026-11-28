/**
 * Self-check for src/lib/course-writer.ts.
 *
 *   npx tsx src/lib/course-writer.check.ts      the answer-cleaning rules, offline
 *   npx tsx --env-file=.env.local src/lib/course-writer.check.ts --live [videoId]
 *       the whole writer on a real video: YouTube details, captions, lesson plan, the first two
 *       lessons written, and a placement test. Uses YouTube, 1 Supadata credit and a few cents of Nebius.
 */
import assert from "node:assert/strict"

import { BadAnswer } from "./ai"
import {
  cleanLesson,
  cleanNotes,
  cleanPlacement,
  planVideo,
  repairPlan,
  minLessonsFor,
  planningWindows,
  splitEvenly,
  writeLesson,
  writePlacementTest,
} from "./course-writer"
import { fetchTranscript, sliceLines } from "./transcript"
import { fetchVideos } from "./youtube"

const video = {
  id: "vid12345678",
  title: "Neural nets",
  durationSeconds: 3600,
  chapters: [],
}
/** Runs one named group of assertions; a failure names the group. */
function check(name: string, fn: () => void) {
  try {
    fn()
  } catch (error) {
    console.error(`✗ ${name}`)
    throw error
  }
}

const l = (title: string, startSeconds: number) => ({
  title,
  summary: "s",
  startSeconds,
})

// ---- repairPlan: lessons never overlap or leave gaps ----------------------------------------
check("lessons never overlap or leave gaps", () => {
  const plan = repairPlan([l("C", 2400), l("A", 30), l("B", 1200)], video)
  assert.deepEqual(
    plan.map((p) => [p.title, p.startSeconds, p.endSeconds]),
    [
      ["A", 0, 1200], // first lesson always starts at 0
      ["B", 1200, 2400],
      ["C", 2400, 3600], // last lesson ends with the video
    ]
  )
})
check("bad times are clamped, duplicates and tiny pieces merged", () => {
  // Out-of-range times are clamped; duplicates removed; a 2-minute piece merges into the one before.
  const plan = repairPlan(
    [
      l("A", 0),
      l("B", 900),
      l("B again", 900),
      l("tiny", 1500),
      l("C", 1620),
      l("past end", 9999),
    ],
    video
  )
  assert.deepEqual(
    plan.map((p) => p.title),
    ["A", "B", "C"]
  )
  assert.equal(plan[1].endSeconds, 1620) // B absorbed "tiny"
  assert.equal(plan[2].endSeconds, 3600) // "past end" was clamped to 3599, a 1 s piece: merged into C
})
check("a short first lesson gives way to the next", () => {
  // Short first lesson: the next one starts at 0 instead.
  const plan = repairPlan(
    [l("hello", 0), l("Real start", 60), l("Next", 1500)],
    video
  )
  assert.deepEqual(
    plan.map((p) => [p.title, p.startSeconds]),
    [
      ["Real start", 0],
      ["Next", 1500],
    ]
  )
})
check("starts near a chapter snap onto it", () => {
  // Starts within 90 s of a chapter snap onto it.
  const withChapters = {
    ...video,
    chapters: [
      { title: "x", startSeconds: 0 },
      { title: "y", startSeconds: 1000 },
      { title: "z", startSeconds: 2000 },
    ],
  }
  const plan = repairPlan([l("A", 0), l("B", 1060), l("C", 1950)], withChapters)
  assert.deepEqual(
    plan.map((p) => p.startSeconds),
    [0, 1000, 2000]
  )
})
check("nothing usable becomes one lesson", () => {
  // Nothing usable: one lesson for the whole video.
  const plan = repairPlan([], video)
  assert.deepEqual(
    plan.map((p) => [p.title, p.startSeconds, p.endSeconds]),
    [["Neural nets", 0, 3600]]
  )
})

check("a window keeps lessons inside it", () => {
  const plan = repairPlan([l("x", 100), l("y", 2500), l("z", 3300)], video, {
    from: 1800,
    to: 3600,
  })
  assert.deepEqual(
    plan.map((p) => [p.title, p.startSeconds, p.endSeconds]),
    [
      ["x", 1800, 2500], // 100 is before the window: clamped to its start
      ["y", 2500, 3300],
      ["z", 3300, 3600],
    ]
  )
})

check("splitEvenly cuts a too-long lesson into parts", () => {
  const parts = splitEvenly({
    videoId: "v",
    startSeconds: 1000,
    endSeconds: 1000 + 62 * 60,
    title: "End",
    summary: "",
  })
  assert.equal(parts.length, 5) // 62 min / 15 min target → 5 parts
  assert.deepEqual(
    parts.map((p) => p.title),
    [1, 2, 3, 4, 5].map((i) => `End (part ${i} of 5)`)
  )
  assert.equal(parts[0].startSeconds, 1000)
  assert.equal(parts[4].endSeconds, 1000 + 62 * 60)
  for (let i = 1; i < parts.length; i++)
    assert.equal(parts[i].startSeconds, parts[i - 1].endSeconds)
})

check(
  "long videos are planned in ~30 min windows, cut on chapters when close",
  () => {
    assert.deepEqual(planningWindows(video), [
      { from: 0, to: 1800 },
      { from: 1800, to: 3600 },
    ])
    assert.deepEqual(planningWindows({ ...video, durationSeconds: 1500 }), [
      { from: 0, to: 1500 },
    ])
    const withChapter = {
      ...video,
      chapters: [
        { title: "a", startSeconds: 0 },
        { title: "b", startSeconds: 1700 },
      ],
    }
    assert.deepEqual(
      planningWindows(withChapter).map((w) => w.from),
      [0, 1700]
    )
  }
)

check(
  "minLessonsFor: short videos are one lesson, longer ones at least two",
  () => {
    assert.equal(minLessonsFor(10 * 60), 1)
    assert.equal(minLessonsFor(19 * 60), 2)
    assert.equal(minLessonsFor(30 * 60), 2)
    assert.equal(minLessonsFor(46 * 60), 4)
  }
)

// ---- cleanLesson ----------------------------------------------------------------------------
const q = (extra: Record<string, unknown> = {}) => ({
  prompt: "What does attention do?",
  options: [
    "Compares tokens",
    "Stores the video",
    "Sorts words",
    "Counts letters",
  ],
  answerIndex: 0,
  explanation: "It compares every token with every other token.",
  replaySeconds: 1300,
  ...extra,
})
const section = (heading: string, extra: Record<string, unknown> = {}) => ({
  heading,
  points: [
    "**Attention** lets each token look at earlier tokens.",
    "Scores come from queries and keys.",
  ],
  example: "",
  code: "",
  codeLanguage: "",
  formula: "",
  ...extra,
})
const notes = {
  overview: "How a token gathers information from the tokens before it.",
  sections: [
    section("Queries and keys"),
    section("Masking future tokens"),
    section("Weighted sum of values"),
  ],
  keyTerms: [
    { term: "Query", meaning: "What a token is looking for." },
    { term: "Key", meaning: "What a token contains." },
    { term: "Value", meaning: "What a token passes on." },
  ],
  takeaways: [
    "Attention is a weighted average.",
    "Masking stops tokens seeing the future.",
    "Scale scores before softmax.",
  ],
}

check("cleanNotes keeps the structure and tidies it", () => {
  const out = cleanNotes({
    ...notes,
    sections: [
      section("## Queries and keys", {
        points: ["- **Query**: what I want", "* **Key**: what I have", ""],
      }),
      section("Masking future tokens", {
        code: "```python\nwei = wei.masked_fill(tril == 0, float('-inf'))\n```",
        codeLanguage: "Python",
      }),
      section("Softmax", { formula: "$\\mathrm{softmax}(QK^T/\\sqrt{d})$" }),
      section("Too thin", { points: ["only one point"] }), // under 2 points: dropped
    ],
  })
  assert.equal(out.sections.length, 3)
  assert.equal(out.sections[0].heading, "Queries and keys") // stray "##" removed
  assert.deepEqual(out.sections[0].points, [
    "**Query**: what I want",
    "**Key**: what I have",
  ]) // bullet markers and blanks removed
  assert.equal(
    out.sections[1].code,
    "wei = wei.masked_fill(tril == 0, float('-inf'))"
  ) // fences removed
  assert.equal(out.sections[1].codeLanguage, "python")
  assert.equal(out.sections[2].formula, "\\mathrm{softmax}(QK^T/\\sqrt{d})") // $ signs removed
})

check("cleanNotes sends cluttered notes back for a rewrite", () => {
  const long = "word ".repeat(45).trim()
  assert.throws(
    () =>
      cleanNotes({
        ...notes,
        sections: [
          section("A", { points: [long, "ok"] }),
          section("B"),
          section("C"),
        ],
      }),
    /bullet was 45 words/
  )
  assert.throws(
    () => cleanNotes({ ...notes, sections: [section("A"), section("B")] }),
    /only 2 usable sections/
  )
  assert.throws(
    () => cleanNotes({ ...notes, overview: "word ".repeat(60) }),
    /overview too long/
  )
  assert.throws(() => cleanNotes({ ...notes, keyTerms: [] }), /key terms/)
  assert.throws(() => cleanNotes({ ...notes, takeaways: ["one"] }), /takeaways/)
  assert.throws(() => cleanNotes("a wall of markdown text"), BadAnswer)
})

check("cleanLesson keeps good questions and clamps replay times", () => {
  const lesson = cleanLesson(
    {
      notes,
      questions: [q(), q({ replaySeconds: 5 }), q(), q({ answerIndex: 9 })],
    },
    { startSeconds: 1200, endSeconds: 2400 }
  )
  assert.equal(lesson.questions.length, 3) // the one with answerIndex 9 is dropped
  assert.equal(lesson.questions[1].replaySeconds, 1200) // outside the lesson: clamped to its start
  for (const item of lesson.questions) {
    assert.equal(item.options[item.answerIndex], "Compares tokens") // still right after shuffling
  }
})
assert.throws(
  () =>
    cleanLesson(
      { notes: "too short", questions: [q(), q(), q()] },
      { startSeconds: 0, endSeconds: 60 }
    ),
  BadAnswer
)
assert.throws(
  () =>
    cleanLesson(
      { notes, questions: [q(), q({ options: ["a", "a", "b"] })] },
      { startSeconds: 0, endSeconds: 60 }
    ),
  BadAnswer
)

// ---- cleanPlacement -------------------------------------------------------------------------
check("cleanPlacement drops questions with bad lesson numbers", () => {
  const p = (lessonNumbers: number[]) => ({ ...q(), lessonNumbers })
  const out = cleanPlacement(
    { questions: [p([1]), p([2, 2, 3]), p([7]), p([1, 2, 3, 4]), p([3])] },
    3
  )
  assert.deepEqual(
    out.map((x) => x.lessonPositions),
    [[1], [2, 3], [1, 2, 3], [3]]
  ) // bad lesson numbers dropped
  assert.throws(() => cleanPlacement({ questions: [p([1])] }, 3), BadAnswer)
})

console.log("course-writer.check: cleaning rules ok")

// ---- Live (optional) ------------------------------------------------------------------------
if (process.argv.includes("--live")) {
  const id =
    process.argv.find((a) => /^[A-Za-z0-9_-]{11}$/.test(a)) ?? "kCc8FmEb1nY"
  const t0 = Date.now()
  const secs = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`

  const { videos } = await fetchVideos([id])
  const v = videos[0]
  assert.ok(v, "video not found")
  const transcript = await fetchTranscript(id)
  assert.ok(transcript, "no captions")
  console.log(
    `[${secs()}] "${v.title}" ${Math.round(v.durationSeconds / 60)} min, ${transcript.lines.split("\n").length} caption lines`
  )

  const plan = await planVideo({
    courseTitle: v.title,
    video: v,
    lines: transcript.lines,
  })
  console.log(
    `[${secs()}] plan by ${plan.model}: ${plan.lessons.length} lessons (${plan.usage.input} in / ${plan.usage.output} out tokens)`
  )
  for (const [i, lesson] of plan.lessons.entries()) {
    const m = Math.round((lesson.endSeconds - lesson.startSeconds) / 60)
    console.log(`   ${String(i + 1).padStart(2)}. ${lesson.title} (${m} min)`)
  }

  const written = await Promise.all(
    plan.lessons.slice(0, 2).map((lesson) =>
      writeLesson({
        courseTitle: v.title,
        lesson,
        lines: sliceLines(
          transcript.lines,
          lesson.startSeconds,
          lesson.endSeconds
        ),
      })
    )
  )
  for (const [i, w] of written.entries()) {
    console.log(
      `[${secs()}] lesson ${i + 1} by ${w.model}: ${w.notes.sections.length} sections, ${w.notes.keyTerms.length} key terms, ${w.questions.length} questions`
    )
  }
  // Save the real notes so they can be looked at as a page.
  const { writeFileSync } = await import("node:fs")
  const out = process.argv.find((a) => a.startsWith("--save="))?.slice(7)
  if (out) {
    writeFileSync(
      out,
      JSON.stringify(
        {
          title: v.title,
          lessons: plan.lessons
            .slice(0, 2)
            .map((l, i) => ({ ...l, ...written[i] })),
        },
        null,
        2
      )
    )
    console.log(`saved the first two lessons to ${out}`)
  }
  const n = written[0].notes
  console.log(`\n--- lesson 1 notes ---\n${n.overview}`)
  for (const sec of n.sections) {
    console.log(`\n## ${sec.heading}`)
    for (const p of sec.points) console.log(`  • ${p}`)
    if (sec.example) console.log(`  e.g. ${sec.example}`)
    if (sec.code)
      console.log(
        `  [${sec.codeLanguage || "code"}, ${sec.code.split("\n").length} lines]`
      )
    if (sec.formula) console.log(`  formula: ${sec.formula}`)
  }
  console.log(`\nKey terms: ${n.keyTerms.map((k) => k.term).join(", ")}`)
  console.log(`Takeaways:\n${n.takeaways.map((t) => `  ✓ ${t}`).join("\n")}`)
  const sample = written[0].questions[0]
  console.log(
    `\n--- a quiz question ---\n${sample.prompt}\n${sample.options.map((o, i) => `  ${i === sample.answerIndex ? "✓" : " "} ${o}`).join("\n")}\n  replay at ${sample.replaySeconds}s: ${sample.explanation}`
  )

  const test = await writePlacementTest({
    courseTitle: v.title,
    lessons: plan.lessons.map((lesson, i) => ({
      ...lesson,
      notes: written[i]?.notes,
    })),
  })
  console.log(
    `\n[${secs()}] placement test by ${test.model}: ${test.questions.length} questions`
  )
  console.log(
    "   covers lessons:",
    test.questions.map((x) => x.lessonPositions.join("+")).join(", ")
  )
  console.log("course-writer.check: live ok")
}
