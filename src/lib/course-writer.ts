/**
 * The course writer: what Nemotron is asked to do, and how each answer is checked.
 *
 *   planVideo          one video's captions  → lessons (title, summary, start)
 *   writeLesson        one lesson's captions → study notes + a 4–5 question quiz
 *   writePlacementTest the course's lessons  → up to 10 questions, each tied to lessons it proves
 *
 * The model gives us words and numbers; the rules live here. Lesson boundaries are built only
 * from start times (so lessons can never overlap or leave gaps), timestamps are clamped into the
 * video, and answers that don't hold up go back to the model or the next one in the chain.
 */
import type { Chapter } from "@/db/schema"
import type { LessonNotes, NoteSection } from "@/types/lesson"

import {
  BadAnswer,
  nemotronJson,
  type ModelName,
  type Schema,
  type Usage,
} from "./ai"
import { clock, sliceLines } from "./transcript"

/** Lessons aim for this length; shorter pieces are merged into the lesson before them. */
export const LESSON = {
  minSeconds: 4 * 60,
  /** Longer than this, a lesson is planned again on its own (see planVideo). */
  maxSeconds: 18 * 60,
  targetMin: 8,
  targetMax: 15,
  /** Videos shorter than this are one lesson. */
  singleLessonMinutes: 12,
}

export type PlannedLesson = {
  videoId: string
  startSeconds: number
  endSeconds: number
  title: string
  summary: string
}

export type QuizQuestion = {
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
  replaySeconds: number
}

export type WrittenLesson = { notes: LessonNotes; questions: QuizQuestion[] }

export type PlacementQuestion = {
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
  /** Positions (1-based) of the lessons a right answer proves you know. */
  lessonPositions: number[]
}

type Meta = { model: ModelName; usage: Usage }

// ---------------------------------------------------------------------------------------------
// Shared checks
// ---------------------------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null
const text = (v: unknown, max = 2000) =>
  typeof v === "string" ? v.trim().slice(0, max) : ""

/** Random order, so the right answer isn't always in the same place (models favour "A"). */
function shuffleOptions(options: string[], answerIndex: number) {
  const order = options.map((_, i) => i).sort(() => Math.random() - 0.5)
  return {
    options: order.map((i) => options[i]),
    answerIndex: order.indexOf(answerIndex),
  }
}

/** A multiple-choice question that's usable: 3–5 distinct options and a real right answer. */
function cleanChoice(raw: unknown) {
  if (!isObject(raw)) return null
  const prompt = text(raw.prompt, 500)
  const explanation = text(raw.explanation, 600)
  const options = Array.isArray(raw.options)
    ? raw.options.map((o) => text(o, 200))
    : []
  const answerIndex = Number(raw.answerIndex)
  const distinct = new Set(options.map((o) => o.toLowerCase()))
  if (!prompt || !explanation) return null
  if (options.length < 3 || options.length > 5 || options.some((o) => !o))
    return null
  if (distinct.size !== options.length) return null
  if (
    !Number.isInteger(answerIndex) ||
    answerIndex < 0 ||
    answerIndex >= options.length
  )
    return null
  return { prompt, explanation, ...shuffleOptions(options, answerIndex) }
}

const choiceSchema = (
  extra: Record<string, unknown>,
  required: string[]
): Schema => ({
  type: "object",
  additionalProperties: false,
  required: ["prompt", "options", "answerIndex", "explanation", ...required],
  properties: {
    prompt: { type: "string" },
    options: { type: "array", items: { type: "string" } },
    answerIndex: { type: "integer" },
    explanation: { type: "string" },
    ...extra,
  },
})

// ---------------------------------------------------------------------------------------------
// 1. Planning lessons
// ---------------------------------------------------------------------------------------------

const PLAN_SCHEMA: Schema = {
  type: "object",
  additionalProperties: false,
  required: ["lessons"],
  properties: {
    lessons: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "summary", "startSeconds"],
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          startSeconds: { type: "integer" },
        },
      },
    },
  },
}

const PLAN_SYSTEM = `You design online courses from video transcripts.
Split ONE video into lessons a learner can finish in one sitting.

Rules:
- Each lesson is one coherent topic, ${LESSON.targetMin} to ${LESSON.targetMax} minutes long. A video under ${LESSON.singleLessonMinutes} minutes is a single lesson; anything longer has at least two.
- Cut where the speaker moves to a new topic, never mid-explanation. If chapters are given, cut on chapter starts.
- Lessons run in order and cover the whole video: the first starts at 0 and each one ends where the next begins.
- startSeconds is a whole number of seconds, taken from the [HH:MM:SS] timestamps.
- title: specific and short (max 8 words), in the video's own terms. No numbering, no "Lesson 1".
- summary: one or two plain sentences on what the learner will understand by the end.
Reply with JSON only.`

type Video = {
  id: string
  title: string
  durationSeconds: number
  chapters: Chapter[]
}
/** The part of the video being planned, in seconds: the whole video, or one long lesson. */
type Window = { from: number; to: number }

/**
 * Turns the model's start times into clean, gap-free lessons inside `window`: sorted, clamped,
 * the first starting at window.from, snapped to chapters when close, tiny pieces merged.
 */
export function repairPlan(
  raw: { title: string; summary: string; startSeconds: number }[],
  video: Video,
  window: Window = { from: 0, to: video.durationSeconds }
): PlannedLesson[] {
  const snap = (s: number) => {
    const near = video.chapters.find((c) => Math.abs(c.startSeconds - s) <= 90)
    return near &&
      near.startSeconds >= window.from &&
      near.startSeconds < window.to
      ? near.startSeconds
      : s
  }
  const clamp = (s: number) =>
    Math.min(Math.max(window.from, Math.round(Number(s) || 0)), window.to - 1)

  let items = raw
    .map((l) => ({
      title: text(l.title, 90),
      summary: text(l.summary, 400),
      start: snap(clamp(l.startSeconds)),
    }))
    .filter((l) => l.title)
    .sort((a, b) => a.start - b.start)
    // One lesson per start time.
    .filter((l, i, all) => i === 0 || l.start !== all[i - 1].start)

  if (!items.length)
    items = [{ title: video.title, summary: "", start: window.from }]
  items[0].start = window.from

  // Merge pieces shorter than the minimum into the lesson before.
  const merged: typeof items = []
  for (const [i, item] of items.entries()) {
    const end = items[i + 1]?.start ?? window.to
    if (end - item.start < LESSON.minSeconds && merged.length) continue
    merged.push(item)
  }
  // A short first lesson followed by others: the next one starts earlier instead.
  if (
    merged.length > 1 &&
    merged[1].start - merged[0].start < LESSON.minSeconds
  ) {
    merged[1].start = window.from
    merged.shift()
  }

  return merged.map((l, i) => ({
    videoId: video.id,
    startSeconds: l.start,
    endSeconds: merged[i + 1]?.start ?? window.to,
    title: l.title,
    summary: l.summary,
  }))
}

/** Last resort for a lesson that's still too long: equal parts, "Title (part 2 of 3)". */
export function splitEvenly(lesson: PlannedLesson): PlannedLesson[] {
  const length = lesson.endSeconds - lesson.startSeconds
  const parts = Math.ceil(length / (LESSON.targetMax * 60))
  if (parts <= 1) return [lesson]
  const size = Math.ceil(length / parts)
  return Array.from({ length: parts }, (_, i) => ({
    ...lesson,
    startSeconds: lesson.startSeconds + i * size,
    endSeconds: Math.min(
      lesson.endSeconds,
      lesson.startSeconds + (i + 1) * size
    ),
    title: `${lesson.title} (part ${i + 1} of ${parts})`,
  }))
}

/**
 * How many lessons a stretch of video needs: one if it's short, otherwise enough that none is
 * longer than the target. A prompt alone isn't enough (a model happily makes one 19-minute
 * lesson), so this number is written into every planning request and checked afterwards.
 */
export function minLessonsFor(seconds: number) {
  if (seconds < LESSON.singleLessonMinutes * 60) return 1
  return Math.max(2, Math.ceil(seconds / (LESSON.targetMax * 60)))
}

/** One planning call for `window` of the video. */
async function planWindow(input: {
  courseTitle: string
  video: Video
  lines: string
  window: Window
}) {
  const { video, window } = input
  const whole = window.from === 0 && window.to === video.durationSeconds
  const inWindow = video.chapters.filter(
    (c) => c.startSeconds >= window.from && c.startSeconds < window.to
  )
  const chapters = inWindow.length
    ? inWindow.map((c) => `${clock(c.startSeconds)} ${c.title}`).join("\n")
    : "(none)"
  const part = whole
    ? `Length: ${clock(video.durationSeconds)} (${video.durationSeconds} seconds)`
    : `This is one part of the video, from ${clock(window.from)} to ${clock(window.to)} (seconds ${window.from} to ${window.to}). Split only this part; the first lesson starts at ${window.from}.`
  const atLeast = minLessonsFor(window.to - window.from)
  const user = `Course: ${input.courseTitle}
Video: ${video.title}
${part}
Make at least ${atLeast} lesson${atLeast === 1 ? "" : "s"}.
Chapters:
${chapters}

Transcript:
${sliceLines(input.lines, window.from, window.to)}`

  return nemotronJson({
    job: "plan",
    system: PLAN_SYSTEM,
    user,
    schema: PLAN_SCHEMA,
    maxTokens: 3000,
    validate: (json) => {
      const lessons =
        isObject(json) && Array.isArray(json.lessons) ? json.lessons : []
      if (!lessons.length) throw new BadAnswer("plan had no lessons")
      return repairPlan(lessons as never, video, window)
    },
  })
}

/** Long videos are planned in windows about this long, side by side. */
const WINDOW_SECONDS = 30 * 60

/**
 * Where to cut a long video into planning windows: evenly, but moved onto a chapter start
 * when one is within 3 minutes, so a window rarely starts mid-topic.
 */
export function planningWindows(video: Video): Window[] {
  const count = Math.max(1, Math.round(video.durationSeconds / WINDOW_SECONDS))
  if (count === 1) return [{ from: 0, to: video.durationSeconds }]
  const cuts = Array.from({ length: count - 1 }, (_, i) => {
    const even = Math.round(((i + 1) * video.durationSeconds) / count)
    const chapter = video.chapters.find(
      (c) => Math.abs(c.startSeconds - even) <= 180
    )
    return chapter?.startSeconds ?? even
  })
  const bounds = [0, ...cuts, video.durationSeconds]
  return bounds.slice(0, -1).map((from, i) => ({ from, to: bounds[i + 1] }))
}

/**
 * Plans one video's lessons. One call over a two-hour transcript loses precision (titles drift
 * away from their timestamps), so long videos are planned in ~30-minute windows side by side,
 * then joined and cleaned as one plan. Any lesson still over LESSON.maxSeconds gets a focused
 * second call on just its stretch; anything still too long is split into equal parts.
 */
export async function planVideo(input: {
  courseTitle: string
  video: Video
  lines: string
}): Promise<{ lessons: PlannedLesson[] } & Meta> {
  const windows = planningWindows(input.video)
  const results = await Promise.all(
    windows.map((window) => planWindow({ ...input, window }))
  )
  const usage = { input: 0, output: 0 }
  for (const r of results) {
    usage.input += r.usage.input
    usage.output += r.usage.output
  }
  // Join the windows and clean them as one plan: this also merges tiny pieces at the seams.
  const joined = repairPlan(
    results.flatMap((r) =>
      r.data.map((l) => ({
        title: l.title,
        summary: l.summary,
        startSeconds: l.startSeconds,
      }))
    ),
    input.video
  )

  const lessons = (
    await Promise.all(
      joined.map(async (lesson) => {
        if (lesson.endSeconds - lesson.startSeconds <= LESSON.maxSeconds)
          return [lesson]
        const again = await planWindow({
          ...input,
          window: { from: lesson.startSeconds, to: lesson.endSeconds },
        }).catch(() => null)
        if (again) {
          usage.input += again.usage.input
          usage.output += again.usage.output
        }
        return (again?.data ?? [lesson]).flatMap((piece) =>
          piece.endSeconds - piece.startSeconds > LESSON.maxSeconds
            ? splitEvenly(piece)
            : [piece]
        )
      })
    )
  ).flat()

  return { lessons, model: results[0].model, usage }
}

// ---------------------------------------------------------------------------------------------
// 2. Writing one lesson
// ---------------------------------------------------------------------------------------------

/**
 * Limits for lesson notes. They're structure, not an essay: the model fills fields, these limits
 * are checked, and the lesson page lays them out the same way every time (see src/types/lesson.ts).
 */
export const NOTES = {
  sections: { min: 3, max: 5 },
  points: { min: 2, max: 5 },
  /** Asked for 25; answers over the hard limit go back for a rewrite. */
  pointWords: { ask: 25, max: 40 },
  overviewWords: 50,
  keyTerms: { min: 3, max: 6 },
  takeaways: { min: 3, max: 4 },
  codeLines: 15,
}

const str = { type: "string" }
const strings = { type: "array", items: str }

const LESSON_SCHEMA: Schema = {
  type: "object",
  additionalProperties: false,
  required: ["notes", "questions"],
  properties: {
    notes: {
      type: "object",
      additionalProperties: false,
      required: ["overview", "sections", "keyTerms", "takeaways"],
      properties: {
        overview: str,
        sections: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "heading",
              "points",
              "example",
              "code",
              "codeLanguage",
              "formula",
            ],
            properties: {
              heading: str,
              points: strings,
              example: str,
              code: str,
              codeLanguage: str,
              formula: str,
            },
          },
        },
        keyTerms: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["term", "meaning"],
            properties: { term: str, meaning: str },
          },
        },
        takeaways: strings,
      },
    },
    questions: {
      type: "array",
      items: choiceSchema({ replaySeconds: { type: "integer" } }, [
        "replaySeconds",
      ]),
    },
  },
}

const LESSON_SYSTEM = `You are a patient teacher writing a study sheet for ONE lesson of a video course.
You get the transcript of just this lesson. Teach only what the video teaches; never add facts it doesn't contain.

notes is a structured study sheet, NOT an essay. No paragraphs anywhere.
- overview: 1 or 2 short sentences: what this lesson teaches and why it matters.
- sections: ${NOTES.sections.min} to ${NOTES.sections.max}, in the order the video teaches them.
  - heading: at most 6 words, specific ("Masking future tokens", not "Overview").
  - points: ${NOTES.points.min} to ${NOTES.points.max} bullets. Each bullet is ONE idea in at most ${NOTES.pointWords.ask} words, in plain language. Put the key term in **bold**. Never repeat an idea.
  - example: one concrete example from the video in at most 35 words, or "".
  - code: if the video shows code for this idea, the key lines only (at most ${NOTES.codeLines} lines, no triple-backtick fences, no commentary), else "".
  - codeLanguage: the language of code ("python", "javascript"…), or "".
  - formula: one LaTeX formula if the idea is mathematical (no $ signs), else "".
- keyTerms: ${NOTES.keyTerms.min} to ${NOTES.keyTerms.max} terms the lesson introduces. meaning: at most 18 words.
- takeaways: ${NOTES.takeaways.min} or ${NOTES.takeaways.max} lines a learner should remember, at most 20 words each.
Inside any text you may use only **bold**, \`inline code\` and $inline math$.

questions: 4 or 5 multiple-choice questions that check understanding, not trivia.
- 4 options each, one clearly right; wrong options are believable mistakes a learner might make.
- answerIndex: the 0-based index of the right option.
- explanation: one or two sentences on why the right answer is right. Talk about "the video", never "the transcript": learners watch, they never see a transcript.
- replaySeconds: the second in the video where the answer is explained, from the [HH:MM:SS] timestamps.
Reply with JSON only.`

const words = (s: string) => s.split(/\s+/).filter(Boolean).length
/** One line of text: whitespace collapsed, stray markdown headings and bullet markers removed. */
const line = (v: unknown, max = 600) =>
  text(v, max)
    .replace(/\s+/g, " ")
    .replace(/^(#{1,6}\s+|[-*•]\s+|\d+[.)]\s+)/, "")
    .trim()

/**
 * Checks the notes against NOTES and tidies them. Throws BadAnswer when they break the
 * structure (too few sections, long bullets…), so the model rewrites them.
 */
export function cleanNotes(raw: unknown): LessonNotes {
  if (!isObject(raw)) throw new BadAnswer("notes were not an object")

  const overview = line(raw.overview)
  if (!overview) throw new BadAnswer("notes had no overview")
  if (words(overview) > NOTES.overviewWords) {
    throw new BadAnswer(`overview too long (${words(overview)} words)`)
  }

  const sections: NoteSection[] = []
  for (const s of Array.isArray(raw.sections) ? raw.sections : []) {
    if (!isObject(s)) continue
    const heading = line(s.heading, 80)
    const points = (Array.isArray(s.points) ? s.points : [])
      .map((p) => line(p))
      .filter(Boolean)
    if (!heading || points.length < NOTES.points.min) continue
    const long = points.find((p) => words(p) > NOTES.pointWords.max)
    if (long)
      throw new BadAnswer(
        `a bullet was ${words(long)} words: "${long.slice(0, 60)}…"`
      )
    const code = text(s.code, 4000)
      .replace(/^\s*```[\w-]*\s*\n?/, "")
      .replace(/\n?\s*```\s*$/, "")
      .trimEnd()
    sections.push({
      heading,
      points: points.slice(0, NOTES.points.max),
      example: line(s.example, 400),
      code: code
        .split("\n")
        .slice(0, NOTES.codeLines + 5)
        .join("\n"),
      codeLanguage: code ? line(s.codeLanguage, 20).toLowerCase() : "",
      formula: line(s.formula, 300).replace(/^\$+|\$+$/g, ""),
    })
  }
  if (sections.length < NOTES.sections.min) {
    throw new BadAnswer(`only ${sections.length} usable sections`)
  }

  const keyTerms = (Array.isArray(raw.keyTerms) ? raw.keyTerms : [])
    .map((k) =>
      isObject(k)
        ? { term: line(k.term, 60), meaning: line(k.meaning, 200) }
        : null
    )
    .filter((k): k is { term: string; meaning: string } =>
      Boolean(k?.term && k.meaning)
    )
  if (keyTerms.length < NOTES.keyTerms.min) {
    throw new BadAnswer(`only ${keyTerms.length} key terms`)
  }

  const takeaways = (Array.isArray(raw.takeaways) ? raw.takeaways : [])
    .map((t) => line(t, 300))
    .filter(Boolean)
  if (takeaways.length < NOTES.takeaways.min) {
    throw new BadAnswer(`only ${takeaways.length} takeaways`)
  }

  return {
    overview,
    sections: sections.slice(0, NOTES.sections.max),
    keyTerms: keyTerms.slice(0, NOTES.keyTerms.max),
    takeaways: takeaways.slice(0, NOTES.takeaways.max),
  }
}

/** The notes as plain text, for giving the placement test a summary of each lesson. */
export function notesToText(notes: LessonNotes) {
  return [
    notes.overview,
    ...notes.sections.map((s) => `${s.heading}: ${s.points.join(" ")}`),
  ]
    .join(" ")
    .replace(/\*\*/g, "")
}

/** Keeps notes and questions that hold up; replay times are clamped into the lesson. */
export function cleanLesson(
  json: unknown,
  lesson: { startSeconds: number; endSeconds: number }
): WrittenLesson {
  if (!isObject(json)) throw new BadAnswer("lesson was not an object")
  const notes = cleanNotes(json.notes)
  const questions: QuizQuestion[] = []
  for (const q of Array.isArray(json.questions) ? json.questions : []) {
    const choice = cleanChoice(q)
    if (!choice || !isObject(q)) continue
    const replay = Math.round(Number(q.replaySeconds))
    const inside = replay >= lesson.startSeconds && replay < lesson.endSeconds
    questions.push({
      ...choice,
      replaySeconds: inside ? replay : lesson.startSeconds,
    })
  }
  if (questions.length < 3)
    throw new BadAnswer(`only ${questions.length} usable questions`)
  return { notes, questions: questions.slice(0, 5) }
}

export async function writeLesson(input: {
  courseTitle: string
  lesson: PlannedLesson
  /** Only this lesson's transcript lines (see sliceLines). */
  lines: string
}): Promise<WrittenLesson & Meta> {
  const { lesson } = input
  const user = `Course: ${input.courseTitle}
Lesson: ${lesson.title}
What it covers: ${lesson.summary}
Runs from ${clock(lesson.startSeconds)} to ${clock(lesson.endSeconds)} (seconds ${lesson.startSeconds} to ${lesson.endSeconds}).

Transcript:
${input.lines}`
  const { data, model, usage } = await nemotronJson({
    job: "lesson",
    system: LESSON_SYSTEM,
    user,
    schema: LESSON_SCHEMA,
    maxTokens: 4000,
    validate: (json) => cleanLesson(json, lesson),
  })
  return { ...data, model, usage }
}

// ---------------------------------------------------------------------------------------------
// 3. The placement test
// ---------------------------------------------------------------------------------------------

const PLACEMENT_SCHEMA: Schema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: choiceSchema(
        { lessonNumbers: { type: "array", items: { type: "integer" } } },
        ["lessonNumbers"]
      ),
    },
  },
}

const PLACEMENT_SYSTEM = `You write a placement test for a video course. It lets learners skip lessons they already know.

Write 10 multiple-choice questions (fewer only if the course has fewer than 5 lessons: then 2 per lesson).
- Each question checks one idea a lesson teaches, so a right answer is real evidence the learner knows that lesson.
- lessonNumbers: the 1 to 3 lesson numbers (from the list) that the question proves. Spread questions across the whole course.
- Start with the basics and get harder, like a good exam.
- 4 options each, one clearly right, wrong options believable.
- answerIndex: the 0-based index of the right option. explanation: one or two sentences, about "the video" (never "the transcript").
Reply with JSON only.`

export function cleanPlacement(
  json: unknown,
  lessonCount: number
): PlacementQuestion[] {
  const raw =
    isObject(json) && Array.isArray(json.questions) ? json.questions : []
  const out: PlacementQuestion[] = []
  for (const q of raw) {
    const choice = cleanChoice(q)
    if (!choice || !isObject(q)) continue
    const numbers = Array.isArray(q.lessonNumbers)
      ? q.lessonNumbers.map(Number)
      : []
    const lessonPositions = [...new Set(numbers)].filter(
      (n) => Number.isInteger(n) && n >= 1 && n <= lessonCount
    )
    if (!lessonPositions.length || lessonPositions.length > 3) continue
    out.push({ ...choice, lessonPositions })
  }
  if (out.length < 3)
    throw new BadAnswer(`only ${out.length} usable placement questions`)
  return out.slice(0, 10)
}

export async function writePlacementTest(input: {
  courseTitle: string
  /** In course order. `notes` (optional) gives the model more to ask about. */
  lessons: { title: string; summary: string; notes?: LessonNotes | null }[]
}): Promise<{ questions: PlacementQuestion[] } & Meta> {
  const list = input.lessons
    .map((l, i) => {
      const excerpt = l.notes
        ? `\n   Notes: ${notesToText(l.notes).slice(0, 700)}`
        : ""
      return `${i + 1}. ${l.title}: ${l.summary}${excerpt}`
    })
    .join("\n")
  const { data, model, usage } = await nemotronJson({
    job: "placement",
    system: PLACEMENT_SYSTEM,
    user: `Course: ${input.courseTitle}\n\nLessons:\n${list}`,
    schema: PLACEMENT_SCHEMA,
    maxTokens: 5000,
    validate: (json) => cleanPlacement(json, input.lessons.length),
  })
  return { questions: data, model, usage }
}
