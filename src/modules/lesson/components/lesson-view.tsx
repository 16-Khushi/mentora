"use client"

import { Tabs } from "@base-ui/react/tabs"
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LessonPageData } from "@/types/lesson"

import { setLessonDone } from "../actions"
import LessonOutline from "./lesson-outline"
import LessonPlayer, { type PlayerHandle } from "./lesson-player"
import MyNotes from "./my-notes"
import StudyTools from "./study-tools"

// "Autoplay next lesson" is remembered in the browser and on by default.
const AUTOPLAY_KEY = "mentora.autoplay"
const AUTOPLAY_EVENT = "mentora-autoplay"
const subscribeAutoplay = (cb: () => void) => {
  window.addEventListener("storage", cb)
  window.addEventListener(AUTOPLAY_EVENT, cb)
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener(AUTOPLAY_EVENT, cb)
  }
}
const readAutoplay = () => {
  try {
    return localStorage.getItem(AUTOPLAY_KEY) !== "0"
  } catch {
    return true
  }
}
const writeAutoplay = (on: boolean) => {
  try {
    localStorage.setItem(AUTOPLAY_KEY, on ? "1" : "0")
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(AUTOPLAY_EVENT))
}

const UP_NEXT_SECONDS = 5

/**
 * The lesson page: a top bar (back, Mark as completed, previous / next), the player with our own
 * controls, the lesson's notes and quiz on the left, and the course's lessons on the right.
 * When a lesson ends with autoplay on, the next one starts after a short countdown.
 */
export default function LessonView({
  data,
  notes,
  autoplay,
}: {
  data: LessonPageData
  /** The notes, already rendered on the server. */
  notes: React.ReactNode
  /** Start playing straight away (arrived here by autoplay). */
  autoplay: boolean
}) {
  const router = useRouter()
  const player = useRef<PlayerHandle>(null)
  const { course, lesson, progress } = data
  const base = `/courses/${course.slug}`

  const [done, setDone] = useState(progress.done)
  const [shownDone, setShownDone] = useOptimistic(done)
  const [, startMarking] = useTransition()
  const autoplayOn = useSyncExternalStore(
    subscribeAutoplay,
    readAutoplay,
    () => true
  )
  const [upNext, setUpNext] = useState<number | null>(null)
  const [tab, setTab] = useState<"study" | "mine">("study")
  const [quizOpen, setQuizOpen] = useState(false)
  const tabs = useRef<HTMLDivElement>(null)

  // The "Up next" countdown, then on to the next lesson (playing).
  useEffect(() => {
    if (upNext === null || !data.next) return
    const timer = setTimeout(() => {
      if (upNext <= 1) router.push(`${base}/${data.next!.position}?autoplay=1`)
      else setUpNext(upNext - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [upNext, data.next, base, router])

  const markDone = () =>
    startMarking(async () => {
      setShownDone(!shownDone)
      await setLessonDone(lesson.id, !shownDone)
      setDone(!shownDone)
    })

  const iconLink =
    "flex size-9 items-center justify-center rounded-full border border-line bg-paper text-ink transition-colors hover:bg-lavender focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={base}
          className="flex min-w-0 items-center gap-1 text-sm font-semibold text-slate hover:text-ink"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{course.title}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={markDone}
            size="sm"
            variant={shownDone ? "outline" : "default"}
            aria-pressed={shownDone}
            className={cn(shownDone && "border-teal bg-mint text-teal-deep")}
          >
            <Check aria-hidden />
            {shownDone ? "Completed" : "Mark as completed"}
          </Button>
          {data.prev ? (
            <Link
              href={`${base}/${data.prev}`}
              aria-label={`Previous: lesson ${data.prev}`}
              className={iconLink}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          ) : (
            <span className={cn(iconLink, "opacity-40")} aria-hidden>
              <ChevronLeft className="size-4" />
            </span>
          )}
          {data.next ? (
            <Link
              href={`${base}/${data.next.position}`}
              aria-label={`Next: ${data.next.title}`}
              className={iconLink}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span className={cn(iconLink, "opacity-40")} aria-hidden>
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <LessonPlayer
              ref={player}
              lessonId={lesson.id}
              videoId={lesson.videoId}
              start={lesson.startSeconds}
              end={lesson.endSeconds}
              poster={
                data.outline.days
                  .flatMap((d) => d.lessons)
                  .find((l) => l.position === lesson.position)?.thumbnailUrl ??
                null
              }
              initialWatched={progress.watchedSeconds}
              autoplay={autoplay}
              onDone={() => setDone(true)}
              onEnded={() => {
                if (autoplayOn && data.next) setUpNext(UP_NEXT_SECONDS)
              }}
            />

            {upNext !== null && data.next ? (
              <div
                role="status"
                className="flex flex-wrap items-center gap-3 rounded-tile bg-butter px-4 py-3"
              >
                <span className="min-w-0 flex-1 text-ink">
                  <strong>Up next in {upNext}s:</strong>{" "}
                  <span className="truncate">{data.next.title}</span>
                </span>
                <Button variant="ghost" onClick={() => setUpNext(null)}>
                  Cancel
                </Button>
                <Link
                  href={`${base}/${data.next.position}?autoplay=1`}
                  className={buttonVariants()}
                >
                  Play now
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-end text-sm">
                <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-slate">
                  Autoplay next lesson
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoplayOn}
                    onClick={() => writeAutoplay(!autoplayOn)}
                    className={cn(
                      "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
                      autoplayOn ? "bg-teal" : "bg-ink/20"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left]",
                        autoplayOn ? "left-5.5" : "left-0.5"
                      )}
                    />
                  </button>
                </label>
              </div>
            )}
          </div>

          <header className="flex flex-col gap-1.5">
            <h1 className="type-h2 leading-tight text-ink">{lesson.title}</h1>
          </header>

          <CreatorCard
            creator={data.creator}
            fallbackName={course.channel}
            videoUrl={`https://www.youtube.com/watch?v=${lesson.videoId}&t=${lesson.startSeconds}s`}
          />

          <Tabs.Root
            ref={tabs}
            value={tab}
            onValueChange={(v) => setTab(v as "study" | "mine")}
            className="flex scroll-mt-6 flex-col gap-4"
          >
            <Tabs.List className="relative flex gap-6 border-b border-line">
              {(
                [
                  ["study", "Study notes"],
                  [
                    "mine",
                    `My notes${data.myNotes.length ? ` (${data.myNotes.length})` : ""}`,
                  ],
                ] as const
              ).map(([value, label]) => (
                <Tabs.Tab
                  key={value}
                  value={value}
                  className="-mb-px cursor-pointer border-b-2 border-transparent pb-2.5 font-semibold text-slate-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none data-[active]:border-ink data-[active]:text-ink"
                >
                  {label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
            <Tabs.Panel
              value="study"
              keepMounted
              className="data-[hidden]:hidden"
            >
              {notes}
            </Tabs.Panel>
            <Tabs.Panel
              value="mine"
              keepMounted
              className="data-[hidden]:hidden"
            >
              <MyNotes
                lessonId={lesson.id}
                start={lesson.startSeconds}
                notes={data.myNotes}
                currentTime={() =>
                  player.current?.currentTime() ?? lesson.startSeconds
                }
                onJump={(s) => player.current?.playFrom(s)}
              />
            </Tabs.Panel>
          </Tabs.Root>

          <nav
            aria-label="Next lesson"
            className="flex justify-end border-t border-line pt-6"
          >
            {data.next ? (
              <Link
                href={`${base}/${data.next.position}`}
                className={cn(
                  buttonVariants({ variant: "accent" }),
                  "max-w-full sm:max-w-[70%]"
                )}
              >
                <span className="truncate">Next: {data.next.title}</span>
                <ArrowRight aria-hidden />
              </Link>
            ) : (
              <Link href={base} className={buttonVariants()}>
                Back to the course
              </Link>
            )}
          </nav>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6">
          <LessonOutline
            slug={course.slug}
            title={course.title}
            position={lesson.position}
            outline={data.outline}
          />
          <StudyTools
            data={data}
            quizOpen={quizOpen}
            onQuizOpenChange={setQuizOpen}
            onReplay={(s) => {
              setQuizOpen(false)
              player.current?.playFrom(s)
            }}
            onOpenNotes={() => {
              setTab("mine")
              tabs.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
              setTimeout(() => document.getElementById("my-note")?.focus(), 400)
            }}
          />
        </aside>
      </div>
    </div>
  )
}

/** 1780000 → "1.78M", 312000 → "312K". */
const compact = (n: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n)

/** The video's creator: avatar, name and subscribers, with a link to watch on YouTube. */
function CreatorCard({
  creator,
  fallbackName,
  videoUrl,
}: {
  creator: LessonPageData["creator"]
  fallbackName: string | null
  videoUrl: string
}) {
  const name = creator?.title ?? fallbackName ?? "YouTube"
  return (
    <div className="flex items-center gap-3 rounded-tile border border-line bg-paper p-3">
      {creator?.avatarUrl ? (
        <Image
          src={creator.avatarUrl}
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-full"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lavender font-bold text-ink"
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {creator ? (
          <a
            href={creator.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-bold text-ink hover:underline"
          >
            {name}
          </a>
        ) : (
          <p className="truncate font-bold text-ink">{name}</p>
        )}
        <p className="text-sm text-slate-muted">
          {creator?.subscribers != null
            ? `${compact(creator.subscribers)} subscribers`
            : "Creator of this video"}
        </p>
      </div>
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Open YouTube
        <ExternalLink aria-hidden />
      </a>
    </div>
  )
}
