"use client"

import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react"
import Image from "next/image"
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
  mute(): void
  unMute(): void
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
const TICK_MS = 250

/** 754 → "12:34", 3725 → "1:02:05". */
function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}

export type PlayerHandle = {
  /** Jump to a moment (seconds of the whole video) and play, e.g. "Replay the moment". */
  playFrom: (seconds: number) => void
  /** Where the video is now, in seconds of the whole video (for pinning a note). */
  currentTime: () => number
}

/**
 * The lesson's video: YouTube's player (creators keep their views; nothing is downloaded) with
 * YouTube's controls hidden and our own on top, so everything is about this lesson only. The bar
 * runs from 0:00 to the lesson's length, seeking stays inside it, and it stops at the lesson's end.
 * Counts the seconds actually watched (each once, so skipping ahead doesn't count) and saves them
 * every 10 s, on pause and when the page is hidden.
 */
export default function LessonPlayer({
  ref,
  lessonId,
  videoId,
  start,
  end,
  poster,
  initialWatched,
  autoplay = false,
  onEnded,
  onDone,
  onWatched,
}: {
  ref?: React.Ref<PlayerHandle>
  lessonId: string
  videoId: string
  start: number
  end: number
  /** The video's thumbnail, shown until the first play. */
  poster: string | null
  initialWatched: number
  /** Start playing as soon as the player is ready (autoplay from the previous lesson). */
  autoplay?: boolean
  onEnded?: () => void
  onDone?: () => void
  /** Seconds of this lesson watched so far, as they grow. */
  onWatched?: (seconds: number) => void
}) {
  const frame = useRef<HTMLDivElement>(null)
  const mount = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const seen = useRef(new Set<number>())
  // A jump asked for before the first play: YouTube resets to `start` when playback begins,
  // so the jump is applied once the video is actually playing.
  const pendingSeek = useRef<number | null>(null)
  const saved = useRef(initialWatched)
  const length = Math.max(1, end - start)

  const [ready, setReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0) // seconds into the lesson
  const [speed, setSpeed] = useState<number>(1)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // Keep the latest callbacks without recreating the player when they change.
  const callbacks = useRef({ onEnded, onDone, onWatched })
  useEffect(() => {
    callbacks.current = { onEnded, onDone, onWatched }
  })

  const save = useCallback(async () => {
    const total = Math.max(initialWatched, seen.current.size)
    if (total <= saved.current) return
    saved.current = total
    const done = await saveWatch(lessonId, total)
    if (done) callbacks.current.onDone?.()
  }, [initialWatched, lessonId])

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
        playerVars: {
          start,
          end,
          controls: 0, // our own controls instead
          disablekb: 1, // our own shortcuts instead
          fs: 0,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          modestbranding: 1,
        },
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
            setPlaying(e.data === YT.PlayerState.PLAYING)
            if (e.data === YT.PlayerState.PLAYING) {
              setStarted(true)
              if (pendingSeek.current !== null) {
                player.current?.seekTo(pendingSeek.current, true)
                pendingSeek.current = null
              }
            }
            if (e.data === YT.PlayerState.PAUSED) void save()
            if (e.data === YT.PlayerState.ENDED) {
              setCurrent(length)
              void save()
              callbacks.current.onEnded?.()
            }
          },
        },
      })
      // Four times a second while playing: move the bar, and note which second is on screen.
      tick = setInterval(() => {
        const p = player.current
        if (!p || p.getPlayerState?.() !== YT.PlayerState.PLAYING) return
        const t = p.getCurrentTime()
        setCurrent(Math.min(length, Math.max(0, t - start)))
        const second = Math.floor(t)
        if (second >= start && second < end && !seen.current.has(second)) {
          seen.current.add(second)
          callbacks.current.onWatched?.(
            Math.max(initialWatched, seen.current.size)
          )
        }
      }, TICK_MS)
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

  // Autoplay (coming from the previous lesson): play as soon as the player is ready.
  useEffect(() => {
    if (ready && autoplay) player.current?.playVideo()
  }, [ready, autoplay])

  useEffect(() => {
    const onChange = () =>
      setFullscreen(document.fullscreenElement === frame.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  /** Go to a point of the lesson (seconds from its start), staying inside it. */
  const seek = useCallback(
    (lessonSeconds: number) => {
      const s = Math.min(Math.max(lessonSeconds, 0), length - 1)
      player.current?.seekTo(start + s, true)
      setCurrent(s)
    },
    [length, start]
  )

  const toggle = useCallback(() => {
    const p = player.current
    if (!p) return
    if (playing) {
      p.pauseVideo()
      return
    }
    if (current >= length - 1) seek(0) // finished: play again from the top
    p.playVideo()
  }, [playing, current, length, seek])

  const toggleMute = useCallback(() => {
    const p = player.current
    if (!p) return
    if (muted) p.unMute()
    else p.mute()
    setMuted(!muted)
  }, [muted])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void frame.current?.requestFullscreen()
  }, [])

  const nextSpeed = () =>
    setSpeed(
      SPEEDS[
        (SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length
      ]
    )

  useImperativeHandle(ref, () => ({
    playFrom: (seconds: number) => {
      seek(seconds - start)
      if (!started)
        pendingSeek.current = Math.min(Math.max(seconds, start), end - 1)
      player.current?.playVideo()
      frame.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    },
    currentTime: () =>
      Math.floor(player.current?.getCurrentTime?.() ?? start + current),
  }))

  // Keyboard shortcuts, unless the learner is typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target?.closest("input, textarea, select, [contenteditable=true]") ||
        e.metaKey ||
        e.ctrlKey ||
        !player.current
      )
        return
      if (e.key === " " || e.key === "k") {
        if (target?.closest("button, a")) return // let buttons and links use space themselves
        e.preventDefault()
        toggle()
      } else if (e.key === "ArrowRight") {
        seek(current + 5)
      } else if (e.key === "ArrowLeft") {
        seek(current - 5)
      } else if (e.key === "m") {
        toggleMute()
      } else if (e.key === "f") {
        toggleFullscreen()
      } else if (e.key === ">" || e.key === "<") {
        const i = SPEEDS.indexOf(speed as (typeof SPEEDS)[number])
        setSpeed(
          SPEEDS[
            e.key === ">"
              ? Math.min(i + 1, SPEEDS.length - 1)
              : Math.max(i - 1, 0)
          ]
        )
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle, seek, toggleMute, toggleFullscreen, current, speed])

  const control =
    "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:ring-3 focus-visible:ring-butter/60 focus-visible:outline-none disabled:cursor-default disabled:opacity-40"
  const pct = (100 * current) / length

  return (
    <div
      ref={frame}
      className={cn(
        "flex flex-col overflow-hidden bg-night shadow-float",
        fullscreen ? "h-full w-full" : "rounded-tile"
      )}
    >
      <div
        className={cn(
          "relative w-full bg-black",
          fullscreen ? "flex-1" : "aspect-video"
        )}
      >
        <div
          ref={mount}
          className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full"
        />
        {/* Clicks on the video play and pause it (YouTube's own controls are off). */}
        {started && (
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={toggle}
            onDoubleClick={toggleFullscreen}
            className="absolute inset-0 cursor-pointer"
          />
        )}
        {!started && (
          <button
            type="button"
            onClick={() => player.current?.playVideo()}
            disabled={!ready}
            aria-label={`Play lesson, ${clock(length)}`}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center disabled:cursor-wait"
          >
            {poster && (
              <Image
                src={poster}
                alt=""
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover"
                preload
              />
            )}
            <span className="absolute inset-0 bg-night/35" aria-hidden />
            <span className="relative flex flex-col items-center gap-3">
              <span className="flex size-16 items-center justify-center rounded-full bg-butter text-ink shadow-float transition-transform group-hover:scale-105">
                <Play className="ml-1 size-7 fill-current" aria-hidden />
              </span>
              <span className="rounded-full bg-night/70 px-3 py-1 text-sm font-bold text-white tabular-nums backdrop-blur-sm">
                {ready ? `Lesson · ${clock(length)}` : "Loading the video…"}
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-3 pt-2 pb-2.5 sm:px-4">
        <input
          type="range"
          min={0}
          max={Math.floor(length)}
          step={1}
          value={Math.floor(current)}
          disabled={!ready}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Lesson position"
          aria-valuetext={`${clock(current)} of ${clock(length)}`}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-butter disabled:cursor-default [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-butter [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-butter"
          style={{
            background: `linear-gradient(to right, var(--color-butter) ${pct}%, rgb(255 255 255 / 0.22) ${pct}%)`,
          }}
        />
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={toggle}
            disabled={!ready}
            aria-label={playing ? "Pause" : "Play"}
            className={control}
          >
            {playing ? (
              <Pause className="size-[1.125rem] fill-current" aria-hidden />
            ) : (
              <Play className="size-[1.125rem] fill-current" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => seek(current - 10)}
            disabled={!ready}
            aria-label="Back 10 seconds"
            className={cn(control, "max-sm:hidden")}
          >
            <RotateCcw className="size-[1.125rem]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => seek(current + 10)}
            disabled={!ready}
            aria-label="Forward 10 seconds"
            className={cn(control, "max-sm:hidden")}
          >
            <RotateCw className="size-[1.125rem]" aria-hidden />
          </button>
          <span className="ml-1.5 font-mono text-sm whitespace-nowrap text-white/90 tabular-nums">
            {clock(current)} / {clock(length)}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={nextSpeed}
            disabled={!ready}
            aria-label={`Speed ${speed}×, change`}
            title="Speed (< and >)"
            className={cn(control, "w-auto min-w-9 px-2 text-sm font-bold")}
          >
            {speed}×
          </button>
          <button
            type="button"
            onClick={toggleMute}
            disabled={!ready}
            aria-label={muted ? "Unmute" : "Mute"}
            title="Mute (m)"
            className={control}
          >
            {muted ? (
              <VolumeX className="size-[1.125rem]" aria-hidden />
            ) : (
              <Volume2 className="size-[1.125rem]" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            title="Full screen (f)"
            className={control}
          >
            {fullscreen ? (
              <Minimize className="size-[1.125rem]" aria-hidden />
            ) : (
              <Maximize className="size-[1.125rem]" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
