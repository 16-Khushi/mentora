"use client"

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Play,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import Mascot from "@/components/mascot"
import NumberTicker from "@/components/number-ticker"
import Thumbnail from "@/components/thumbnail"
import { buttonVariants } from "@/components/ui/button"
import Wordmark from "@/components/wordmark"
import { bigBurst } from "@/lib/celebrate"
import { paceLabel } from "@/lib/pace"
import { cn } from "@/lib/utils"
import type {
  AnswerStatus,
  PlacementResultData,
  ResultLesson,
  ReviewedQuestion,
} from "@/types/placement"

import { addLessonBack } from "../actions"

const CHIP: Record<AnswerStatus, string> = {
  right: "bg-mint text-teal-deep",
  wrong: "bg-blush text-coral-deep",
  idk: "bg-lavender text-ink",
}
const ICON: Record<AnswerStatus, string> = { right: "✓", wrong: "✕", idk: "?" }
const DOT: Record<AnswerStatus, string> = {
  right: "bg-teal text-white",
  wrong: "bg-coral text-white",
  idk: "bg-lavender text-ink",
}
const WORD: Record<AnswerStatus, string> = {
  right: "right",
  wrong: "wrong",
  idk: "didn't know",
}

/** 3588 → "59:48", 4000 → "1:06:40". */
function clock(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`
}

/**
 * The placement result in two steps. First a celebration: Thena, a big burst of confetti, the
 * score and the course time counting down. Then "Review answers": every answer next to the right
 * one on the left, and "You know this" / "You'll learn this" on the right, where any skipped
 * lesson can be added back.
 */
export default function PlacementResult({
  data,
  celebrate,
}: {
  data: PlacementResultData
  /** Fire the confetti: true straight after the test, not on a later visit. */
  celebrate: boolean
}) {
  const router = useRouter()
  const [view, setView] = useState<"summary" | "review">("summary")
  const known = data.lessons.filter((l) => l.skipped)
  const learn = data.lessons.filter((l) => !l.skipped)
  const saved = data.full.minutes - data.mine.minutes
  const start = learn[0]

  const celebrated = useRef(false)
  useEffect(() => {
    if (!celebrate || celebrated.current) return
    celebrated.current = true
    // Celebrate once, then drop ?new=1 through the router so a refresh doesn't celebrate again.
    // No cleanup: the confetti should finish falling when `celebrate` turns false.
    if (known.length > 0) bigBurst() // nothing skipped: Thena reads, no confetti
    router.replace(`/build/${data.slug}/result`, { scroll: false })
  }, [celebrate, router, data.slug, known.length])

  const startLink = start ? (
    <Link
      href={`/courses/${data.slug}/${start.position}`}
      className={cn(buttonVariants({ size: "lg" }))}
    >
      Start learning: lesson {start.position}
      <ArrowRight aria-hidden />
    </Link>
  ) : (
    <Link
      href={`/courses/${data.slug}`}
      className={cn(buttonVariants({ size: "lg" }))}
    >
      See the course
      <ArrowRight aria-hidden />
    </Link>
  )

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
        <Link
          href={`/build/${data.slug}/test`}
          className="text-sm font-semibold text-slate-muted hover:text-ink"
        >
          Retake the test
        </Link>
      </header>

      {view === "summary" ? (
        <main className="mx-auto flex w-full max-w-2xl flex-1 animate-in flex-col items-center justify-center gap-5 px-4 py-10 text-center duration-500 fade-in sm:px-6">
          {known.length ? (
            <button
              type="button"
              onClick={() => bigBurst()}
              aria-label="Celebrate again"
              className="cursor-pointer rounded-full focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"
            >
              <Mascot
                pose="celebrate"
                size={200}
                preload
                className="w-40 animate-in duration-700 zoom-in-75 sm:w-48"
              />
            </button>
          ) : (
            <Mascot
              pose="reading"
              size={200}
              preload
              className="w-40 animate-in duration-700 zoom-in-75 sm:w-48"
            />
          )}
          <div className="flex flex-col items-center gap-3">
            <p className="eyebrow text-plum">Placement result</p>
            <h1 className="type-h1 text-ink">
              {known.length ? (
                <>
                  You already know{" "}
                  <em className="text-teal-deep">
                    {known.length} of {data.lessons.length} lessons.
                  </em>
                </>
              ) : (
                "Every lesson is new to you"
              )}
            </h1>
          </div>
          <ul
            className="flex flex-wrap justify-center gap-2"
            aria-label="Score"
          >
            {(["right", "wrong", "idk"] as const).map((s) => (
              <li
                key={s}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-bold",
                  CHIP[s]
                )}
              >
                {ICON[s]} {data.counts[s]} {WORD[s]}
              </li>
            ))}
          </ul>
          <p className="font-heading text-xl text-ink">
            {saved > 0 ? (
              <>
                Your course drops from {data.full.minutes} to{" "}
                <strong className="font-medium text-teal-deep">
                  <NumberTicker
                    from={data.full.minutes}
                    to={data.mine.minutes}
                  />{" "}
                  mins
                </strong>
              </>
            ) : (
              <>
                You&apos;ll learn all {data.full.minutes} mins of it, step by
                step.
              </>
            )}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {startLink}
            <button
              type="button"
              onClick={() => setView("review")}
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Review answers
            </button>
          </div>
        </main>
      ) : (
        <main className="page-container grid flex-1 animate-in items-start gap-6 py-6 duration-300 fade-in lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8">
          <section className="flex min-w-0 flex-col gap-4">
            <button
              type="button"
              onClick={() => setView("summary")}
              className="flex cursor-pointer items-center gap-1.5 self-start text-sm font-bold text-violet hover:text-ink"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to result
            </button>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="type-h2 text-ink">Your answers</h1>
              <p className="text-sm font-semibold text-slate-muted">
                {data.correct} of {data.total} right
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {data.questions.map((q, i) => (
                <AnswerRow key={q.id} q={q} n={i + 1} />
              ))}
            </ul>
          </section>

          <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-card bg-paper shadow-float">
              <div className="flex items-center gap-4 p-4">
                <Thumbnail
                  src={data.thumbnailUrl}
                  sizes="128px"
                  className="w-28 shrink-0 rounded-control sm:w-32"
                />
                <div className="min-w-0">
                  <p className="line-clamp-2 font-heading text-lg leading-tight text-ink">
                    {data.title}
                  </p>
                  <p className="text-sm text-slate-muted">
                    {data.channel ? `${data.channel} · ` : ""}
                    {clock(data.videoSeconds)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 px-5 pb-5">
                <p className="eyebrow text-plum">Your course now</p>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {saved > 0 && (
                    <s className="font-heading text-xl text-slate-muted/70">
                      {paceLabel(data.full.minutes)}
                    </s>
                  )}
                  <strong className="font-heading text-4xl font-medium text-teal-deep">
                    {paceLabel(data.mine.minutes)}
                  </strong>
                  {saved > 0 && (
                    <span className="rounded-full bg-mint px-2.5 py-0.5 text-sm font-bold text-teal-deep">
                      saves {paceLabel(saved)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    `${learn.length} lesson${learn.length === 1 ? "" : "s"}`,
                    `${data.mine.days} day${data.mine.days === 1 ? "" : "s"}`,
                    `${paceLabel(data.minutesPerDay)} a day`,
                  ].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-violet px-3 py-0.5 text-sm font-semibold text-ink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <LessonGroup
              kind="known"
              title="You know this"
              lessons={known}
              slug={data.slug}
            />
            <LessonGroup
              kind="learn"
              title="You'll learn this"
              lessons={learn}
              slug={data.slug}
            />
            <div className="[&>a]:w-full">{startLink}</div>
          </aside>
        </main>
      )}
    </div>
  )
}

/** One answer: a single line that opens to what was picked, the right answer and why. */
function AnswerRow({ q, n }: { q: ReviewedQuestion; n: number }) {
  const [open, setOpen] = useState(false)
  const id = `answer-${q.id}`
  return (
    <li className="overflow-hidden rounded-tile bg-paper shadow-float">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none focus-visible:ring-inset"
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-black",
            DOT[q.status]
          )}
          aria-hidden
        >
          {ICON[q.status]}
        </span>
        <span className="sr-only">
          Question {n}, {WORD[q.status]}:
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 font-semibold text-ink",
            !open && "truncate"
          )}
        >
          {q.prompt}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-slate-muted transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows] duration-300",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2 px-4 pb-4 sm:pl-14">
            {q.options.map((option, k) => {
              const isAnswer = k === q.answerIndex
              const isPicked = k === q.picked
              return (
                <div
                  key={k}
                  className={cn(
                    "flex items-center gap-3 rounded-control border px-3.5 py-2.5 text-[0.95rem]",
                    isAnswer
                      ? "border-teal bg-mint/50 text-ink"
                      : isPicked
                        ? "border-coral bg-blush/60 text-ink"
                        : "border-line text-slate-muted"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isAnswer
                        ? "bg-teal text-white"
                        : isPicked
                          ? "bg-coral text-white"
                          : "bg-sand text-ink"
                    )}
                    aria-hidden
                  >
                    {String.fromCharCode(65 + k)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {(isAnswer || isPicked) && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white",
                        isAnswer ? "bg-teal" : "bg-coral"
                      )}
                    >
                      {isAnswer && isPicked
                        ? "You ✓"
                        : isAnswer
                          ? "Answer"
                          : "You"}
                    </span>
                  )}
                </div>
              )
            })}
            {q.status === "idk" && (
              <p className="text-sm font-semibold text-slate-muted">
                You chose &ldquo;I don&apos;t know&rdquo;.
              </p>
            )}
            {q.explanation && (
              <p className="rounded-control bg-cream px-3.5 py-2.5 text-[0.95rem] text-slate">
                <strong className="text-ink">Why:</strong> {q.explanation}
              </p>
            )}
            <span
              className={cn(
                "self-start rounded-full px-3 py-1 text-xs font-bold",
                q.lesson.inPlan
                  ? "bg-butter text-ink"
                  : "bg-mint text-teal-deep"
              )}
            >
              Lesson {q.lesson.position} · {q.lesson.title} ·{" "}
              {q.lesson.inPlan ? "in your plan" : "skipped"}
            </span>
          </div>
        </div>
      </div>
    </li>
  )
}

/** "You know this" / "You'll learn this": a closed accordion that opens to its lessons. */
function LessonGroup({
  kind,
  title,
  lessons,
  slug,
}: {
  kind: "known" | "learn"
  title: string
  lessons: ResultLesson[]
  slug: string
}) {
  const [open, setOpen] = useState(false)
  const [, startAdding] = useTransition()
  const minutes = lessons.reduce((sum, l) => sum + l.minutes, 0)
  const id = `lessons-${kind}`

  return (
    <div className="overflow-hidden rounded-card bg-paper shadow-float">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none focus-visible:ring-inset"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-control",
            kind === "known" ? "bg-mint text-teal-deep" : "bg-lavender text-ink"
          )}
          aria-hidden
        >
          {kind === "known" ? (
            <Check className="size-4.5" strokeWidth={3} />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </span>
        <span className="flex-1">
          <span className="block font-heading text-lg leading-tight text-ink">
            {title}
          </span>
          <span className="text-sm font-semibold text-slate-muted">
            {lessons.length} lesson{lessons.length === 1 ? "" : "s"} ·{" "}
            {paceLabel(minutes)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-slate-muted transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows] duration-300",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <ul className="px-5 pb-3">
            {lessons.length === 0 && (
              <li className="border-t border-line py-3 text-sm text-slate-muted">
                {kind === "known"
                  ? "Nothing skipped. Every lesson is in your plan."
                  : "Nothing left: you know the whole course."}
              </li>
            )}
            {lessons.map((l) => (
              <li
                key={l.position}
                className="flex items-center gap-3 border-t border-line py-2.5"
              >
                <div className="relative w-20 shrink-0">
                  <Thumbnail
                    src={l.thumbnailUrl}
                    sizes="80px"
                    className={cn(
                      "rounded-[10px]",
                      l.skipped && "opacity-75 grayscale-[.5]"
                    )}
                  />
                  <span className="absolute right-1 bottom-1 rounded bg-night/80 px-1 text-[0.65rem] font-bold text-white tabular-nums">
                    {clock(l.startSeconds)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm leading-snug font-semibold text-ink">
                    {l.position}. {l.title}
                  </p>
                  <p className="text-xs text-slate-muted">
                    {paceLabel(l.minutes)}
                  </p>
                </div>
                {l.skipped && (
                  <button
                    type="button"
                    onClick={() =>
                      startAdding(async () => {
                        await addLessonBack(slug, l.position)
                        toast(`Lesson ${l.position} is back in your plan`)
                      })
                    }
                    className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full border border-violet px-3 text-xs font-bold text-ink hover:bg-lavender focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Add back
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
