"use client"

import { Check, RotateCcw, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import Mascot from "@/components/mascot"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LessonQuestion } from "@/types/lesson"

import { saveQuiz } from "../actions"

const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

/**
 * The lesson's quiz. Answers show right or wrong straight away with the explanation; a wrong
 * answer offers "Replay the moment", which jumps the video to where the idea is taught.
 * Answering every question saves the score and marks the lesson done.
 */
export default function LessonQuiz({
  lessonId,
  questions,
  previous,
  onReplay,
}: {
  lessonId: string
  questions: LessonQuestion[]
  previous: { correct: number; total: number } | null
  onReplay: (seconds: number) => void
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const answered = Object.keys(answers).length
  const correct = questions.filter(
    (q) => answers[q.id] === q.answerIndex
  ).length
  const finished = answered === questions.length && questions.length > 0

  // Functional update: answers given in quick succession each build on the latest state.
  const choose = (q: LessonQuestion, option: number) =>
    setAnswers((prev) => (q.id in prev ? prev : { ...prev, [q.id]: option }))

  // Save the score once, when the last question is answered.
  const saved = useRef(false)
  useEffect(() => {
    if (!finished || saved.current) return
    saved.current = true
    void saveQuiz(lessonId, correct, questions.length)
  }, [finished, correct, lessonId, questions.length])

  if (!questions.length) return null

  return (
    <section className="flex flex-col gap-6" aria-labelledby="quiz-title">
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-plum">Check it stuck</p>
        <h2 id="quiz-title" className="type-h2 text-ink">
          Quiz
        </h2>
        <p className="text-slate-muted">
          {questions.length} questions.
          {previous && ` Last time: ${previous.correct} of ${previous.total}.`}
        </p>
      </div>

      <ol className="flex flex-col gap-5">
        {questions.map((q, i) => {
          const picked = answers[q.id]
          const done = picked !== undefined
          const right = picked === q.answerIndex
          return (
            <li
              key={q.id}
              className="flex flex-col gap-3 rounded-card bg-paper p-5 sm:p-6"
            >
              <p className="type-h4 text-ink">
                <span className="mr-2 text-violet">{i + 1}.</span>
                {q.prompt}
              </p>
              <div
                className="flex flex-col gap-2"
                role="radiogroup"
                aria-label={`Question ${i + 1}`}
              >
                {q.options.map((option, k) => {
                  const isAnswer = k === q.answerIndex
                  const isPicked = k === picked
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={isPicked}
                      disabled={done}
                      onClick={() => choose(q, k)}
                      className={cn(
                        "flex items-center gap-3 rounded-tile border px-4 py-3 text-left transition-colors focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
                        !done &&
                          "cursor-pointer border-line bg-paper hover:border-violet hover:bg-lavender/40",
                        done &&
                          isAnswer &&
                          "border-transparent bg-mint text-ink",
                        done &&
                          isPicked &&
                          !isAnswer &&
                          "border-transparent bg-blush text-ink",
                        done &&
                          !isAnswer &&
                          !isPicked &&
                          "border-line text-slate-muted"
                      )}
                    >
                      {done && isAnswer && (
                        <Check
                          className="size-5 shrink-0 text-teal-deep"
                          aria-label="Right answer"
                        />
                      )}
                      {done && isPicked && !isAnswer && (
                        <X
                          className="size-5 shrink-0 text-coral-deep"
                          aria-label="Your answer"
                        />
                      )}
                      <span>{option}</span>
                    </button>
                  )
                })}
              </div>
              {done && (
                <div
                  className={cn(
                    "flex animate-in flex-col gap-3 rounded-tile px-4 py-3 fade-in sm:flex-row sm:items-center sm:justify-between",
                    right ? "bg-mint/50" : "bg-blush/60"
                  )}
                  role="status"
                >
                  <p className="text-slate">
                    <strong className="text-ink">
                      {right ? "Right. " : "Not quite. "}
                    </strong>
                    {q.explanation}
                  </p>
                  {!right && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => onReplay(q.replaySeconds)}
                    >
                      <RotateCcw aria-hidden />
                      Replay the moment ({clock(q.replaySeconds)})
                    </Button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {finished && (
        <div
          className="flex animate-in items-center gap-5 rounded-card bg-mint p-5 fade-in sm:p-6"
          role="status"
        >
          <Mascot
            pose={correct === questions.length ? "celebrate" : "reading"}
            size={88}
            className="w-20 shrink-0"
          />
          <div className="flex flex-col gap-1">
            <p className="type-h3 text-ink">
              {correct} of {questions.length} right
            </p>
            <p className="text-slate">
              {correct === questions.length
                ? "Perfect. This lesson is done."
                : "Lesson done. Replay the moments you missed whenever you like."}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
