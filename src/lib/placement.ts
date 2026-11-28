/**
 * Grading the placement test.
 *
 * Each question is tied to the 1–3 lessons it proves you know. A lesson is skipped only when a
 * question about it was answered right AND no question about it was answered wrong, so one lucky
 * guess can't skip a lesson you got wrong elsewhere. "I don't know" proves nothing either way.
 */

/** The answer value for "I don't know". */
export const DONT_KNOW = -1

export type GradableQuestion = {
  id: string
  answerIndex: number
  lessonIds: string[]
}

export function gradePlacement(
  questions: GradableQuestion[],
  answers: Record<string, number>
): { correct: number; total: number; skippedLessonIds: string[] } {
  const proven = new Set<string>()
  const missed = new Set<string>()
  let correct = 0
  for (const q of questions) {
    const answer = answers[q.id]
    if (answer === undefined || answer === DONT_KNOW) continue
    if (answer === q.answerIndex) {
      correct++
      q.lessonIds.forEach((id) => proven.add(id))
    } else {
      q.lessonIds.forEach((id) => missed.add(id))
    }
  }
  return {
    correct,
    total: questions.length,
    skippedLessonIds: [...proven].filter((id) => !missed.has(id)),
  }
}
