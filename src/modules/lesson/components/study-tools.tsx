"use client"

import { Dialog } from "@base-ui/react/dialog"
import { ListChecks, NotebookPen, X } from "lucide-react"

import type { LessonPageData } from "@/types/lesson"

import LessonQuiz from "./lesson-quiz"

/**
 * Study tools under the lesson list: the quiz (opens in a modal) and a shortcut to My notes.
 */
export default function StudyTools({
  data,
  quizOpen,
  onQuizOpenChange,
  onReplay,
  onOpenNotes,
}: {
  data: LessonPageData
  quizOpen: boolean
  onQuizOpenChange: (open: boolean) => void
  /** "Replay the moment": closes the quiz and plays the video from there. */
  onReplay: (seconds: number) => void
  onOpenNotes: () => void
}) {
  const { progress } = data
  const hasQuiz = Boolean(data.lesson.notes) && data.questions.length > 0
  const tile =
    "flex cursor-pointer flex-col items-start gap-1 rounded-tile p-3.5 text-left transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none disabled:cursor-default disabled:opacity-50 disabled:hover:translate-y-0"

  return (
    <section
      aria-labelledby="study-tools"
      className="flex flex-col gap-3 rounded-card bg-paper p-4 shadow-float"
    >
      <h2 id="study-tools" className="px-1 font-heading text-lg text-ink">
        Study tools
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={!hasQuiz}
          onClick={() => onQuizOpenChange(true)}
          className={`${tile} bg-mint`}
        >
          <ListChecks className="size-5 text-ink" aria-hidden />
          <span className="font-bold text-ink">Quiz</span>
          <span className="text-xs text-slate">
            {progress.quizTotal !== null && progress.quizCorrect !== null
              ? `Last: ${progress.quizCorrect} of ${progress.quizTotal}`
              : `${data.questions.length} questions`}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenNotes}
          className={`${tile} bg-butter`}
        >
          <NotebookPen className="size-5 text-ink" aria-hidden />
          <span className="font-bold text-ink">My notes</span>
          <span className="text-xs text-slate">
            {data.myNotes.length
              ? `${data.myNotes.length} pinned`
              : "Pinned to moments"}
          </span>
        </button>
      </div>

      <Dialog.Root open={quizOpen} onOpenChange={onQuizOpenChange}>
        {/* Kept mounted while closed, so answers survive "Replay the moment". */}
        <Dialog.Portal keepMounted>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-night/45 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[min(85dvh,46rem)] w-[min(94vw,40rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-card bg-cream shadow-float transition-[transform,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-center gap-3 border-b border-line bg-paper px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="font-heading text-xl leading-tight text-ink">
                  Quiz
                </Dialog.Title>
                <Dialog.Description className="text-sm text-slate-muted">
                  {data.questions.length} questions
                  {progress.quizTotal !== null && progress.quizCorrect !== null
                    ? ` · Last time ${progress.quizCorrect} of ${progress.quizTotal}`
                    : " · Answer all to finish the lesson"}
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close quiz"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate transition-colors hover:bg-lavender focus-visible:bg-lavender focus-visible:outline-none"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            <div className="overflow-y-auto p-4 sm:p-5">
              {hasQuiz && (
                <LessonQuiz
                  lessonId={data.lesson.id}
                  questions={data.questions}
                  previous={null}
                  start={data.lesson.startSeconds}
                  onReplay={onReplay}
                />
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
