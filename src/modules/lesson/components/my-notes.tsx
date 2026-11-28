"use client"

import { Clock, Trash2 } from "lucide-react"
import { useOptimistic, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { MyNote } from "@/types/lesson"

import { addLessonNote, deleteLessonNote } from "../actions"

/** Seconds of the lesson as "3:21". */
const clock = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`

/**
 * "My notes": the learner's own notes, each pinned to a moment of the video. The moment is taken
 * when they start typing (or now, with "Use the video's time now"); clicking a note's time jumps
 * the video back there.
 */
export default function MyNotes({
  lessonId,
  start,
  notes,
  currentTime,
  onJump,
}: {
  lessonId: string
  /** The lesson's start in the video, so times show from the lesson's 0:00. */
  start: number
  notes: MyNote[]
  /** Where the video is now (seconds of the whole video). */
  currentTime: () => number
  onJump: (seconds: number) => void
}) {
  const [list, setList] = useState(notes)
  const [shown, changeShown] = useOptimistic(
    list,
    (current, change: { add?: MyNote; remove?: string }) =>
      change.add
        ? [...current, change.add].sort((a, b) => a.seconds - b.seconds)
        : current.filter((n) => n.id !== change.remove)
  )
  const [draft, setDraft] = useState("")
  const [pinned, setPinned] = useState<number | null>(null)
  const [, start_] = useTransition()
  const box = useRef<HTMLTextAreaElement>(null)

  const save = () => {
    const body = draft.trim()
    if (!body) return
    const seconds = pinned ?? currentTime()
    setDraft("")
    setPinned(null)
    start_(async () => {
      changeShown({ add: { id: `new-${Date.now()}`, seconds, body } })
      const saved = await addLessonNote(lessonId, seconds, body)
      if (saved)
        setList((l) => [...l, saved].sort((a, b) => a.seconds - b.seconds))
      else toast("Couldn't save that note. Try again.")
    })
  }

  const remove = (id: string) =>
    start_(async () => {
      changeShown({ remove: id })
      await deleteLessonNote(id)
      setList((l) => l.filter((n) => n.id !== id))
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5 rounded-tile border border-line bg-paper p-3.5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 rounded-full bg-lavender px-2.5 py-1 font-mono text-xs font-semibold text-ink">
            <Clock className="size-3.5" aria-hidden />
            {pinned === null
              ? "at the video's time"
              : `at ${clock(pinned - start)}`}
          </span>
          <button
            type="button"
            onClick={() => setPinned(currentTime())}
            className="cursor-pointer font-semibold text-violet underline-offset-4 hover:underline"
          >
            Use the video&apos;s time now
          </button>
        </div>
        <label htmlFor="my-note" className="sr-only">
          Your note
        </label>
        <textarea
          id="my-note"
          ref={box}
          rows={3}
          value={draft}
          maxLength={2000}
          onChange={(e) => {
            if (!draft && e.target.value && pinned === null)
              setPinned(currentTime()) // pin to the moment they started writing
            setDraft(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              save()
            }
          }}
          placeholder="What clicked at this moment? The time is taken when you start typing."
          className="w-full resize-y rounded-control border border-line bg-cream/40 px-3 py-2.5 text-[0.95rem] text-slate outline-none placeholder:text-slate-muted focus:ring-3 focus:ring-violet/30"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-muted">
            ⌘/Ctrl + Enter to save
          </span>
          <Button size="sm" onClick={save} disabled={!draft.trim()}>
            Save note
          </Button>
        </div>
      </div>

      {shown.length ? (
        <ul className="flex flex-col gap-2">
          {shown.map((n) => (
            <li
              key={n.id}
              className="group flex items-start gap-3 rounded-tile bg-paper px-3.5 py-3"
            >
              <button
                type="button"
                onClick={() => onJump(n.seconds)}
                aria-label={`Play from ${clock(n.seconds - start)}`}
                className="shrink-0 cursor-pointer rounded-full bg-butter px-2.5 py-0.5 font-mono text-xs font-bold text-ink hover:bg-ink hover:text-white"
              >
                {clock(n.seconds - start)}
              </button>
              <p className="min-w-0 flex-1 text-[0.95rem] whitespace-pre-wrap text-slate">
                {n.body}
              </p>
              <button
                type="button"
                onClick={() => remove(n.id)}
                aria-label="Delete note"
                className="shrink-0 cursor-pointer rounded-full p-1 text-slate-muted opacity-60 group-hover:opacity-100 hover:bg-blush hover:text-coral-deep"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-muted">
          No notes yet. Pause on anything worth remembering and write it down.
        </p>
      )}
    </div>
  )
}
