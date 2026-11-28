"use client"

import { Link2, LoaderCircle } from "lucide-react"
import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"

import { startCourseAction, type NewCourseState } from "../actions"

/**
 * The link box. A link that arrived from the landing page (/new?url=…) is filled in and started
 * once, so the learner doesn't have to click "Build" twice.
 */
export default function NewCourseForm({ initialUrl }: { initialUrl: string }) {
  const [state, action, pending] = useActionState<NewCourseState, FormData>(
    startCourseAction,
    {
      error: null,
      url: initialUrl,
    }
  )
  const form = useRef<HTMLFormElement>(null)
  const autoStarted = useRef(false)

  useEffect(() => {
    if (initialUrl && !autoStarted.current) {
      autoStarted.current = true
      form.current?.requestSubmit()
    }
  }, [initialUrl])

  return (
    <form ref={form} action={action} className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col gap-2 rounded-tile border border-line bg-paper p-2 focus-within:ring-3 focus-within:ring-violet/40 sm:flex-row sm:items-center sm:pl-5">
        <label htmlFor="new-course-url" className="sr-only">
          YouTube video or playlist link
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-0">
          <Link2 className="size-5 shrink-0 text-slate-muted" aria-hidden />
          <input
            id="new-course-url"
            name="url"
            type="url"
            inputMode="url"
            required
            autoComplete="off"
            defaultValue={state.url}
            disabled={pending}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "new-course-error" : undefined}
            placeholder="Paste a YouTube video or playlist link"
            className="h-12 min-w-0 flex-1 bg-transparent text-lg text-slate outline-none placeholder:text-slate-muted disabled:opacity-70"
          />
        </div>
        <Button type="submit" size="lg" className="h-12" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden />
              Checking the video…
            </>
          ) : (
            "Build my course"
          )}
        </Button>
      </div>
      {state.error && !pending && (
        <p
          id="new-course-error"
          role="alert"
          className="rounded-tile bg-blush px-4 py-3 text-ink"
        >
          {state.error}
        </p>
      )}
    </form>
  )
}
