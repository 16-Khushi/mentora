"use client"

import { useRef, useState } from "react"

import type { LessonPageData } from "@/types/lesson"

import LessonPlayer, { type PlayerHandle } from "./lesson-player"
import LessonQuiz from "./lesson-quiz"

/**
 * Connects the parts of a lesson that talk to each other: the quiz's "Replay the moment" drives
 * the player. The notes come in from the server as `notes`, already rendered.
 */
export default function LessonView({
  data,
  notes,
  footer,
}: {
  data: LessonPageData
  notes: React.ReactNode
  footer: React.ReactNode
}) {
  const player = useRef<PlayerHandle>(null)
  const [done, setDone] = useState(data.progress.done)
  const { lesson, progress } = data

  return (
    <div className="flex flex-col gap-10">
      <LessonPlayer
        ref={player}
        lessonId={lesson.id}
        videoId={lesson.videoId}
        start={lesson.startSeconds}
        end={lesson.endSeconds}
        initialWatched={progress.watchedSeconds}
        onDone={() => setDone(true)}
      />
      {done && (
        <p className="-mt-6 text-sm font-semibold text-teal-deep" role="status">
          ✓ Lesson done
        </p>
      )}
      {notes}
      {lesson.notes && (
        <LessonQuiz
          lessonId={lesson.id}
          questions={data.questions}
          previous={
            progress.quizTotal !== null && progress.quizCorrect !== null
              ? { correct: progress.quizCorrect, total: progress.quizTotal }
              : null
          }
          onReplay={(s) => player.current?.playFrom(s)}
        />
      )}
      {footer}
    </div>
  )
}
