"use client"

import { Check, Play, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import Mascot from "@/components/mascot"
import { cn } from "@/lib/utils"
import type { LessonQuestion } from "@/types/lesson"

import { saveQuiz } from "../actions"

/** Older lessons were written saying "the transcript"; learners only see the video. */
const asVideo = (text: string) =>
  text
    .replace(/\bthe transcript\b/g, "the video")
    .replace(/\bThe transcript\b/g, "The video")
    .replace(/\btranscript\b/gi, "video")

const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

/**
 * The lesson's quiz (shown in a modal from Study tools). Answers show right or wrong straight away with the explanation; a wrong
 * answer offers "Replay the moment", which jumps the video to where the idea is taught.
 * Answering every question saves the score and marks the lesson done.
 */
export default function LessonQuiz({
  lessonId,
  questions,
  previous,
  start,
  onReplay,
}: {
  lessonId: string
  questions: LessonQuestion[]
  previous: { correct: number; total: number } | null
  /** The lesson's start in the video, so replay times read from the lesson's 0:00. */
  start: number
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
    <div className="flex flex-col gap-4">
      {previous && (
        <p className="text-sm text-slate-muted">
          Last time: {previous.correct} of {previous.total}.
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {questions.map((q, i) => {
          const picked = answers[q.id]
          const done = picked !== undefined
          const right = picked === q.answerIndex
          return (
            <li
              key={q.id}
              className="flex flex-col gap-2.5 rounded-tile border border-line bg-paper p-4"
            >
              <p className="font-semibold text-ink">
                <span className="mr-1.5 text-violet">{i + 1}.</span>
                {q.prompt}
              </p>
              <div
                className="flex flex-col gap-1.5"
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
                        "flex items-center gap-2.5 rounded-control border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
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
                          className="size-4 shrink-0 text-teal-deep"
                          aria-label="Right answer"
                        />
                      )}
                      {done && isPicked && !isAnswer && (
                        <X
                          className="size-4 shrink-0 text-coral-deep"
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
                  role="status"
                  className={cn(
                    "flex animate-in flex-col gap-1.5 rounded-r-control border-l-[3px] py-2.5 pr-3 pl-3.5 fade-in",
                    right
                      ? "border-teal bg-mint/35"
                      : "border-coral bg-blush/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-bold",
                        right ? "text-teal-deep" : "text-coral-deep"
                      )}
                    >
                      {right ? (
                        <Check className="size-4" strokeWidth={3} aria-hidden />
                      ) : (
                        <X className="size-4" strokeWidth={3} aria-hidden />
                      )}
                      {right ? "Right" : "Not quite"}
                    </span>
                    {!right && (
                      <button
                        type="button"
                        onClick={() => onReplay(q.replaySeconds)}
                        aria-label={`Rewatch this part, from ${clock(q.replaySeconds - start)}`}
                        className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-paper px-2.5 text-xs font-bold text-ink shadow-sm ring-1 ring-line transition-colors hover:bg-ink hover:text-white focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"
                      >
                        <Play className="size-3 fill-current" aria-hidden />
                        Rewatch {clock(q.replaySeconds - start)}
                      </button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-slate">
                    {asVideo(q.explanation)}
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {finished && (
        <div
          className="flex animate-in items-center gap-4 rounded-tile bg-mint p-4 fade-in"
          role="status"
        >
          <Mascot
            pose={correct === questions.length ? "celebrate" : "reading"}
            size={64}
            className="w-14 shrink-0"
          />
          <div className="flex flex-col gap-1">
            <p className="type-h4 text-ink">
              {correct} of {questions.length} right
            </p>
            <p className="text-sm text-slate">
              {correct === questions.length
                ? "Perfect. This lesson is done."
                : "Lesson done. Replay the moments you missed whenever you like."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
