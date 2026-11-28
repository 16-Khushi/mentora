/** Everything the build screen shows, fetched every couple of seconds while a course is built. */
export type BuildState = {
  slug: string
  title: string
  status: "queued" | "reading" | "building" | "ready" | "failed"
  progress: number
  error: string | null
  totalSeconds: number
  /** Seconds from start to ready, once ready. */
  builtInSeconds: number | null
  /** The four stages of a build, summarised from the build log. */
  stages: {
    captions: Stage
    plan: Stage
    placement: Stage
  }
  /** One tile per planned lesson, in course order. */
  lessons: { position: number; title: string; state: StepState }[]
  /** The most recently finished lesson, for the "just written" line. */
  latest: { position: number; title: string; detail: string | null } | null
  quizQuestions: number
  placementQuestions: number
}

export type StepState = "waiting" | "running" | "done" | "failed"
export type Stage = { state: StepState; detail: string | null }
