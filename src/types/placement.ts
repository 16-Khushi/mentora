/** "right", "wrong", or "idk" for "I don't know". */
export type AnswerStatus = "right" | "wrong" | "idk"

/** One placement question as the result page reviews it, after the test is done. */
export type ReviewedQuestion = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
  /** The option picked, or -1 for "I don't know". */
  picked: number
  status: AnswerStatus
  explanation: string
  /** The first lesson this question covers, and whether it is still in the learner's plan. */
  lesson: { position: number; title: string; inPlan: boolean }
}

/** One lesson in the result page's "You know this" / "You'll learn this" lists. */
export type ResultLesson = {
  position: number
  title: string
  minutes: number
  startSeconds: number
  thumbnailUrl: string | null
  skipped: boolean
}

export type PlacementResultData = {
  slug: string
  title: string
  channel: string | null
  thumbnailUrl: string | null
  videoSeconds: number
  minutesPerDay: number
  correct: number
  total: number
  counts: Record<AnswerStatus, number>
  questions: ReviewedQuestion[]
  lessons: ResultLesson[]
  /** Study time and days for the whole course, and for the learner's plan without skipped lessons. */
  full: { minutes: number; days: number }
  mine: { minutes: number; days: number }
}
