"use client"

import { ArrowRight, HelpCircle } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

import Mascot from "@/components/mascot"
import ProgressBar from "@/components/progress-bar"
import { Button } from "@/components/ui/button"
import Wordmark from "@/components/wordmark"
import { DONT_KNOW } from "@/lib/placement"

import { submitPlacement } from "../actions"
import type { PublicQuestion } from "../queries"

type Stage = "intro" | "questions"

/**
 * The placement test: one question at a time, no going back, with "I don't know" on every
 * question so nobody has to guess. Graded on the server, which then opens the result page.
 */
export default function PlacementTest({
  slug,
  title,
  questions,
  taken,
}: {
  slug: string
  title: string
  questions: PublicQuestion[]
  taken: { correct: number; total: number } | null
}) {
  const [stage, setStage] = useState<Stage>("intro")
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()
  const question = questions[index]

  const answer = (value: number) => {
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      return
    }
    setError(null)
    startSaving(async () => {
      // On success the action opens the result page, so only an error comes back.
      const res = await submitPlacement(slug, next)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="page-container flex items-center justify-between pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Link
          href="/dashboard"
          aria-label="Mentora, today"
          className="rounded-control"
        >
          <Wordmark className="text-3xl" />
        </Link>
        {!saving && (
          <Link
            href={`/courses/${slug}`}
            className="text-sm font-semibold text-slate-muted hover:text-ink"
          >
            Skip the test
          </Link>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-10 sm:px-6">
        {stage === "intro" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <Mascot
              pose="thinking"
              size={200}
              preload
              className="w-40 sm:w-48"
            />
            <div className="flex flex-col gap-3">
              <p className="eyebrow text-plum">Placement test</p>
              <h1 className="type-h1 text-ink">Skip what you already know</h1>
              <p className="max-w-[46ch] type-lead">
                {questions.length} quick questions about{" "}
                <strong className="text-ink">{title}</strong>. Get one right and
                the lessons it covers leave your plan.
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-left text-slate">
              <li>
                • Not sure? Choose &ldquo;I don&apos;t know&rdquo;. Guessing
                only skips lessons you need.
              </li>
              <li>• One question at a time, no going back. About 2 minutes.</li>
            </ul>
            {taken && (
              <p className="text-sm text-slate-muted">
                You took it before ({taken.correct} of {taken.total}). Taking it
                again replaces that result.
              </p>
            )}
            <Button size="lg" onClick={() => setStage("questions")}>
              Start the test
              <ArrowRight aria-hidden />
            </Button>
          </div>
        )}

        {saving && (
          <div
            role="status"
            className="flex animate-in flex-col items-center gap-4 text-center duration-300 fade-in"
          >
            <Mascot
              pose="thinking"
              size={180}
              className="w-36 animate-bounce [animation-duration:1.6s] motion-reduce:animate-none"
            />
            <h1 className="type-h2 text-ink">Checking your answers</h1>
            <p className="text-slate-muted">
              Working out which lessons you can skip…
            </p>
          </div>
        )}

        {stage === "questions" && question && !saving && (
          <div
            key={question.id}
            className="flex animate-in flex-col gap-6 duration-300 fade-in slide-in-from-right-4"
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-slate-muted tabular-nums">
                Question {index + 1} of {questions.length}
              </p>
              <ProgressBar
                value={(100 * index) / questions.length}
                label="Placement test progress"
              />
            </div>
            <h1 className="type-h2 text-ink">{question.prompt}</h1>
            <div
              className="flex flex-col gap-2.5"
              role="group"
              aria-label="Answers"
            >
              {question.options.map((option, k) => (
                <button
                  key={k}
                  type="button"
                  disabled={saving}
                  onClick={() => answer(k)}
                  className="flex cursor-pointer items-center gap-3 rounded-tile border border-line bg-paper px-5 py-4 text-left text-slate transition-colors hover:border-violet hover:bg-lavender/40 focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none disabled:opacity-60"
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lavender text-sm font-bold text-ink"
                    aria-hidden
                  >
                    {String.fromCharCode(65 + k)}
                  </span>
                  {option}
                </button>
              ))}
              <button
                type="button"
                disabled={saving}
                onClick={() => answer(DONT_KNOW)}
                className="flex cursor-pointer items-center gap-3 rounded-tile border border-dashed border-violet/60 px-5 py-4 text-left text-ink transition-colors hover:bg-lavender/40 focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none disabled:opacity-60"
              >
                <HelpCircle
                  className="size-6 shrink-0 text-violet"
                  aria-hidden
                />
                I don&apos;t know
              </button>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-tile bg-blush px-4 py-3 text-ink"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
