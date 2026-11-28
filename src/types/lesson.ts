/**
 * A lesson's study notes, as structure rather than free text. The AI fills these fields, our
 * checks enforce the limits, and the lesson page lays them out the same way every time, so
 * notes can never turn into a wall of paragraphs.
 *
 * Inside any text field only inline formatting is allowed: **bold**, `code` and $math$.
 */
export type LessonNotes = {
  /** 1–2 sentences: what this lesson teaches and why it matters. */
  overview: string
  /** 3–5 sections, in the order the video teaches them. */
  sections: NoteSection[]
  /** 3–6 terms the lesson introduces. */
  keyTerms: { term: string; meaning: string }[]
  /** 3–4 short lines to remember. */
  takeaways: string[]
}

export type NoteSection = {
  /** Up to 6 words. */
  heading: string
  /** 2–5 bullets, one idea each, up to 25 words. */
  points: string[]
  /** One concrete example from the video, or "" for none. */
  example: string
  /** The key code shown in the video for this idea (no fences, ≤ 15 lines), or "". */
  code: string
  /** Language of `code` for highlighting ("python", "js"…), or "". */
  codeLanguage: string
  /** One LaTeX formula (no $ signs), or "". */
  formula: string
}

/** A quiz question as the lesson page shows it. */
export type LessonQuestion = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
  replaySeconds: number
}

/** Everything the lesson page needs. */
export type LessonPageData = {
  course: { slug: string; title: string }
  lesson: {
    id: string
    position: number
    title: string
    summary: string
    videoId: string
    startSeconds: number
    endSeconds: number
    notes: LessonNotes | null
  }
  questions: LessonQuestion[]
  /** Which day of the learner's plan this lesson falls on (null if skipped by the placement test). */
  day: number | null
  total: number
  prev: number | null
  next: { position: number; title: string } | null
  progress: {
    watchedSeconds: number
    done: boolean
    quizCorrect: number | null
    quizTotal: number | null
  }
}
