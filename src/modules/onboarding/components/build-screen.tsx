"use client"

import { ArrowRight, Check, LoaderCircle, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import Mascot from "@/components/mascot"
import NightSky from "@/components/night-sky"
import { buttonVariants } from "@/components/ui/button"
import Wordmark from "@/components/wordmark"
import { cn } from "@/lib/utils"
import type { BuildState, Stage, StepState } from "@/types/build"

const POLL_MS = 1500

/** "1 h 56 min", "17 min". */
function duration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h ? `${h} h ${m} min` : `${m} min`
}

/** One sentence saying what's happening right now. */
function headline(s: BuildState) {
  if (s.status === "queued") return "Getting ready…"
  if (s.status === "reading") return "Reading the captions…"
  const written = s.lessons.filter((l) => l.state === "done").length
  if (!s.lessons.length) return "Planning your lessons…"
  if (written < s.lessons.length)
    return `Writing lessons: ${written} of ${s.lessons.length}`
  return "Writing your placement test…"
}

/**
 * The live build screen. While Nemotron writes the course it's a night sky with Thena writing and
 * each stage lighting up; once ready it turns to cream with what to do next.
 */
export default function BuildScreen({ initial }: { initial: BuildState }) {
  const [state, setState] = useState(initial)
  const finished = state.status === "ready" || state.status === "failed"

  useEffect(() => {
    if (finished) return
    let stopped = false
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/build/${state.slug}`, {
          cache: "no-store",
        })
        if (res.ok && !stopped) setState((await res.json()) as BuildState)
      } catch {
        // A dropped request: the next tick tries again.
      }
    }, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [finished, state.slug])

  if (state.status === "ready") return <Ready state={state} />
  if (state.status === "failed") return <Failed state={state} />
  return <Building state={state} />
}

// ---------------------------------------------------------------------------------------------

function Building({ state }: { state: BuildState }) {
  return (
    <NightSky className="flex min-h-dvh flex-col">
      <header className="page-container flex items-center justify-between pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Wordmark className="text-3xl text-moon" />
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-moon-muted hover:text-moon"
        >
          Leave this page: it keeps building
        </Link>
      </header>

      <main className="page-container flex flex-1 flex-col items-center gap-8 py-10 text-center">
        <Mascot pose="writing" size={200} preload className="w-40 sm:w-48" />
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-moon-muted">Building your course</p>
          <h1 className="max-w-[24ch] type-h1 text-moon">{state.title}</h1>
          <p className="type-lead text-glow" aria-live="polite">
            {headline(state)}
          </p>
        </div>

        <div className="w-full max-w-xl">
          <div
            role="progressbar"
            aria-label="Build progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={state.progress}
            className="h-2.5 overflow-hidden rounded-full bg-night-line"
          >
            <div
              className="h-full rounded-full bg-glow transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(3, state.progress)}%` }}
            />
          </div>
        </div>

        <ol className="flex w-full max-w-xl flex-col gap-3 text-left">
          <StageRow
            n={1}
            title="Read the captions"
            stage={state.stages.captions}
          />
          <StageRow n={2} title="Plan the lessons" stage={state.stages.plan} />
          <li className="flex flex-col gap-3 rounded-tile bg-night-card p-4">
            <div className="flex items-center gap-3">
              <StateIcon
                state={
                  !state.lessons.length
                    ? "waiting"
                    : state.lessons.every(
                          (l) => l.state === "done" || l.state === "failed"
                        )
                      ? "done"
                      : "running"
                }
                n={3}
              />
              <span className="font-semibold text-moon">Write the lessons</span>
            </div>
            {state.lessons.length > 0 && (
              <>
                <div className="flex flex-wrap gap-1.5" aria-label="Lessons">
                  {state.lessons.map((l) => (
                    <span
                      key={l.position}
                      title={`${l.position}. ${l.title}`}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-colors duration-500",
                        l.state === "done" && "bg-glow text-night",
                        l.state === "running" &&
                          "animate-pulse bg-night-line text-moon",
                        l.state === "waiting" &&
                          "bg-night-line/60 text-moon-muted",
                        l.state === "failed" && "bg-coral-deep text-white"
                      )}
                    >
                      {l.position}
                    </span>
                  ))}
                </div>
                {state.latest && (
                  <p
                    key={state.latest.position}
                    className="animate-in text-sm text-moon-muted duration-500 fade-in slide-in-from-bottom-1"
                  >
                    Just written:{" "}
                    <span className="text-moon">{state.latest.title}</span>
                    {state.latest.detail && <> · {state.latest.detail}</>}
                  </p>
                )}
              </>
            )}
          </li>
          <StageRow
            n={4}
            title="Write the placement test"
            stage={state.stages.placement}
          />
        </ol>
      </main>
    </NightSky>
  )
}

function StageRow({
  n,
  title,
  stage,
}: {
  n: number
  title: string
  stage: Stage
}) {
  return (
    <li className="flex items-start gap-3 rounded-tile bg-night-card p-4">
      <StateIcon state={stage.state} n={n} />
      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            "font-semibold",
            stage.state === "waiting" ? "text-moon-muted" : "text-moon"
          )}
        >
          {title}
        </span>
        {stage.detail && (
          <span className="animate-in text-sm text-moon-muted duration-500 fade-in">
            {stage.detail}
          </span>
        )}
      </div>
    </li>
  )
}

function StateIcon({ state, n }: { state: StepState; n: number }) {
  const base = "flex size-7 shrink-0 items-center justify-center rounded-full"
  if (state === "done")
    return (
      <span className={cn(base, "bg-teal text-white")}>
        <Check className="size-4" aria-label="Done" />
      </span>
    )
  if (state === "failed")
    return (
      <span className={cn(base, "bg-coral-deep text-white")}>
        <X className="size-4" aria-label="Failed" />
      </span>
    )
  if (state === "running")
    return (
      <span className={cn(base, "bg-night-line text-glow")}>
        <LoaderCircle
          className="size-4 animate-spin"
          aria-label="In progress"
        />
      </span>
    )
  return (
    <span
      className={cn(base, "border border-night-line text-sm text-moon-muted")}
    >
      {n}
    </span>
  )
}

// ---------------------------------------------------------------------------------------------

function Ready({ state }: { state: BuildState }) {
  const written = state.lessons.filter((l) => l.state === "done").length
  const stats = [
    {
      value: String(state.lessons.length),
      label: state.lessons.length === 1 ? "lesson" : "lessons",
    },
    { value: duration(state.totalSeconds), label: "of video" },
    { value: String(state.quizQuestions), label: "quiz questions" },
  ]
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
      </header>
      <main className="page-container flex flex-1 flex-col items-center justify-center gap-7 py-10 text-center">
        <Mascot pose="celebrate" size={220} preload className="w-44 sm:w-52" />
        <div className="flex flex-col items-center gap-3">
          <p className="eyebrow text-plum">Your course is ready</p>
          <h1 className="max-w-[24ch] type-h1 text-ink">{state.title}</h1>
          {state.builtInSeconds !== null && (
            <p className="text-slate-muted">
              Built in{" "}
              {state.builtInSeconds < 120
                ? `${state.builtInSeconds} seconds`
                : duration(state.builtInSeconds)}{" "}
              by NVIDIA Nemotron
            </p>
          )}
        </div>
        <dl className="flex flex-wrap justify-center gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex min-w-32 flex-col rounded-tile bg-paper px-5 py-4"
            >
              <dt className="order-2 text-sm font-semibold text-slate-muted">
                {s.label}
              </dt>
              <dd className="order-1 font-fraunces text-3xl text-ink">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
        {written < state.lessons.length && (
          <p className="text-sm text-slate-muted">
            {state.lessons.length - written} lesson
            {state.lessons.length - written === 1 ? "" : "s"} couldn&apos;t be
            written and will show the video only.
          </p>
        )}
        <div className="flex w-full max-w-md flex-col gap-3">
          {state.placementQuestions > 0 && (
            <Link
              href={`/build/${state.slug}/test`}
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              Take the placement test
              <ArrowRight aria-hidden />
            </Link>
          )}
          {state.placementQuestions > 0 && (
            <p className="-mt-1 text-sm text-slate-muted">
              {state.placementQuestions} quick questions. Get one right and you
              skip the lessons it covers.
            </p>
          )}
          <Link
            href={`/courses/${state.slug}`}
            className={cn(
              buttonVariants({
                size: "lg",
                variant: state.placementQuestions ? "outline" : "default",
              }),
              "w-full"
            )}
          >
            Start from lesson 1
          </Link>
        </div>
      </main>
    </div>
  )
}

function Failed({ state }: { state: BuildState }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <main className="page-container flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
        <Mascot pose="sleeping" size={200} preload className="w-40" />
        <div className="flex flex-col items-center gap-3">
          <p className="eyebrow text-plum">Build stopped</p>
          <h1 className="max-w-[22ch] type-h1 text-ink">
            We couldn&apos;t build this course
          </h1>
          <p className="max-w-[48ch] type-lead">
            {state.error ??
              "Something went wrong while building it. Paste the link again to retry."}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/new" className={buttonVariants({ size: "lg" })}>
            Try another link
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Back to today
          </Link>
        </div>
      </main>
    </div>
  )
}
