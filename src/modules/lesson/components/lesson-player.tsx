"use client"

import { Gauge } from "lucide-react"
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import { cn } from "@/lib/utils"

import { saveWatch } from "../actions"

// ---------------------------------------------------------------------------------------------
// The YouTube IFrame Player API, loaded once per page. Docs:
// https://developers.google.com/youtube/iframe_api_reference
// ---------------------------------------------------------------------------------------------

type YTPlayer = {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getPlayerState(): number
  setPlaybackRate(rate: number): void
  destroy(): void
}
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string
      playerVars: Record<string, number | string>
      events: {
        onReady?: () => void
        onStateChange?: (e: { data: number }) => void
      }
    }
  ) => YTPlayer
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  apiPromise ??= new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(window.YT!)
    }
    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    document.head.appendChild(script)
  })
  return apiPromise
}

// ---------------------------------------------------------------------------------------------

const SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const
const SPEED_KEY = "mentora.speed"
const SAVE_EVERY_MS = 10_000

export type PlayerHandle = {
  /** Jump to a moment (seconds of the whole video) and play, e.g. "Replay the moment". */
  playFrom: (seconds: number) => void
}

/**
 * YouTube's own player, trimmed to one lesson (start → end). Creators keep their views; we
 * never download anything. Counts the seconds the learner actually watched (each second once,
 * so skipping ahead doesn't count) and saves them every 10 s and on pause.
 */
export default function LessonPlayer({
  ref,
  lessonId,
  videoId,
  start,
  end,
  initialWatched,
  onEnded,
  onDone,
}: {
  ref?: React.Ref<PlayerHandle>
  lessonId: string
  videoId: string
  start: number
  end: number
  initialWatched: number
  onEnded?: () => void
  onDone?: () => void
}) {
  const mount = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const seen = useRef(new Set<number>())
  const saved = useRef(initialWatched)
  const [ready, setReady] = useState(false)
  const [speed, setSpeed] = useState<number>(1)
  const length = Math.max(1, end - start)
  const [watched, setWatched] = useState(initialWatched)

  const save = useCallback(async () => {
    const total = Math.max(initialWatched, seen.current.size)
    if (total <= saved.current) return
    saved.current = total
    const done = await saveWatch(lessonId, total)
    if (done) onDone?.()
  }, [initialWatched, lessonId, onDone])

  // Create the player.
  useEffect(() => {
    let cancelled = false
    let tick: ReturnType<typeof setInterval> | undefined
    loadYouTubeApi().then((YT) => {
      if (cancelled || !mount.current) return
      const el = document.createElement("div")
      mount.current.replaceChildren(el)
      player.current = new YT.Player(el, {
        videoId,
        playerVars: { start, end, rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onReady: () => {
            // The speed the learner used last time, if the browser remembers it.
            try {
              const stored = Number(localStorage.getItem(SPEED_KEY))
              if (SPEEDS.includes(stored as (typeof SPEEDS)[number]))
                setSpeed(stored)
            } catch {
              // Storage unavailable (private window): keep 1×.
            }
            setReady(true)
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PAUSED) void save()
            if (e.data === YT.PlayerState.ENDED) {
              void save()
              onEnded?.()
            }
          },
        },
      })
      // Once a second: note which second of the lesson is on screen while playing.
      tick = setInterval(() => {
        const p = player.current
        if (!p || p.getPlayerState?.() !== YT.PlayerState.PLAYING) return
        const t = Math.floor(p.getCurrentTime())
        if (t >= start && t < end) {
          seen.current.add(t)
          setWatched(Math.max(initialWatched, seen.current.size))
        }
      }, 1000)
    })
    return () => {
      cancelled = true
      if (tick) clearInterval(tick)
      player.current?.destroy()
      player.current = null
    }
    // Recreate only when the lesson changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, start, end])

  // Save periodically and when the page is hidden or closed.
  useEffect(() => {
    const timer = setInterval(() => void save(), SAVE_EVERY_MS)
    const onHide = () => document.visibilityState === "hidden" && void save()
    document.addEventListener("visibilitychange", onHide)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onHide)
      void save()
    }
  }, [save])

  // Apply the speed once the player is ready, and remember it. Not before: on the first render
  // `speed` is still the default 1×, and saving it then would overwrite the learner's choice.
  useEffect(() => {
    if (!ready) return
    player.current?.setPlaybackRate(speed)
    try {
      localStorage.setItem(SPEED_KEY, String(speed))
    } catch {
      // ignore
    }
  }, [speed, ready])

  useImperativeHandle(ref, () => ({
    playFrom: (seconds: number) => {
      const p = player.current
      if (!p) return
      p.seekTo(Math.min(Math.max(seconds, start), end - 1), true)
      p.playVideo()
      mount.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    },
  }))

  // Keyboard shortcuts, unless the learner is typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target?.closest("input, textarea, select, [contenteditable=true]") ||
        e.metaKey ||
        e.ctrlKey
      )
        return
      const p = player.current
      if (!p) return
      const now = p.getCurrentTime()
      const playing = p.getPlayerState() === window.YT?.PlayerState.PLAYING
      if (e.key === " " || e.key === "k") {
        if (target?.closest("button, a")) return // let buttons and links use space themselves
        e.preventDefault()
        if (playing) p.pauseVideo()
        else p.playVideo()
      } else if (e.key === "ArrowRight") {
        p.seekTo(Math.min(now + 5, end - 1), true)
      } else if (e.key === "ArrowLeft") {
        p.seekTo(Math.max(now - 5, start), true)
      } else if (e.key === ">" || e.key === "<") {
        const i = SPEEDS.indexOf(speed as (typeof SPEEDS)[number])
        const nextIndex =
          e.key === ">"
            ? Math.min(i + 1, SPEEDS.length - 1)
            : Math.max(i - 1, 0)
        setSpeed(SPEEDS[nextIndex])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [speed, start, end])

  const percent = Math.min(100, Math.round((100 * watched) / length))

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-card bg-night">
        <div
          ref={mount}
          className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-moon-muted">
            Loading the video…
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="Playback speed"
        >
          <Gauge className="size-4 text-slate-muted" aria-hidden />
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              onClick={() => setSpeed(s)}
              className={cn(
                "h-8 cursor-pointer rounded-full px-3 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none",
                speed === s ? "bg-ink text-white" : "text-ink hover:bg-lavender"
              )}
            >
              {s}×
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-muted">
          Watched {percent}%{percent >= 80 ? " · counts as done" : ""} ·{" "}
          <span className="hidden sm:inline">
            space to pause, ← → to skip 5 s
          </span>
        </p>
      </div>
    </div>
  )
}
