import "katex/dist/katex.min.css"

import katex from "katex"
import { Fragment } from "react"

import Mascot from "@/components/mascot"
import type { LessonNotes } from "@/types/lesson"

/** LaTeX to HTML on the server. Bad LaTeX shows as plain text instead of breaking the page. */
function math(tex: string, display = false) {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    output: "html",
  })
}

/**
 * The only formatting allowed inside note text: **bold**, `code` and $math$.
 * Anything else stays plain text (React escapes it), so notes can't inject markup.
 */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return (
            <strong key={i} className="font-bold text-ink">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (/^`[^`]+`$/.test(part)) {
          return (
            <code
              key={i}
              className="rounded-md bg-sand px-1.5 py-0.5 font-mono text-[0.88em] text-ink"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        if (/^\$[^$]+\$$/.test(part)) {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: math(part.slice(1, -1)) }}
            />
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}

/**
 * Structured study notes (src/types/lesson.ts), laid out the same way for every lesson:
 * overview, numbered sections, key terms, takeaways. No walls of text.
 */
export default function LessonNotesView({
  notes,
}: {
  notes: LessonNotes | null
}) {
  if (!notes) {
    return (
      <div className="flex items-center gap-5 rounded-card bg-lavender p-6">
        <Mascot pose="sleeping" size={90} className="w-20 shrink-0" />
        <p className="text-slate">
          Notes couldn&apos;t be written for this lesson. The video above has
          everything; the quiz is skipped.
        </p>
      </div>
    )
  }

  return (
    <article className="flex flex-col gap-6" aria-label="Lesson notes">
      <div className="flex items-start gap-4">
        <Mascot
          pose="reading"
          size={72}
          className="hidden w-12 shrink-0 sm:block"
        />
        <div className="flex flex-col gap-1">
          <p className="eyebrow text-plum">In this lesson</p>
          <p className="max-w-[66ch] text-[1.05rem] leading-relaxed text-slate">
            <Inline text={notes.overview} />
          </p>
        </div>
      </div>

      {notes.sections.map((s, i) => (
        <section
          key={i}
          className="flex flex-col gap-2.5 border-t border-line pt-5 first-of-type:border-0 first-of-type:pt-0"
        >
          <h3 className="flex items-center gap-2.5 font-heading text-xl leading-snug text-ink">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lavender font-sans text-xs font-bold"
              aria-hidden
            >
              {i + 1}
            </span>
            <Inline text={s.heading} />
          </h3>
          <ul className="flex flex-col gap-2">
            {s.points.map((p, k) => (
              <li
                key={k}
                className="relative max-w-[66ch] pl-6 text-[0.98rem] leading-relaxed text-slate before:absolute before:top-[0.7em] before:left-1 before:size-2 before:rounded-full before:bg-violet"
              >
                <Inline text={p} />
              </li>
            ))}
          </ul>
          {s.example && (
            <div className="flex max-w-[66ch] flex-col gap-0.5 rounded-tile bg-butter px-4 py-3">
              <span className="text-xs font-bold tracking-wider text-ink uppercase">
                Example
              </span>
              <span className="text-slate">
                <Inline text={s.example} />
              </span>
            </div>
          )}
          {s.code && (
            <div className="min-w-0 overflow-hidden rounded-tile bg-night-card">
              <div className="flex justify-between bg-night-line px-4 py-2 text-xs font-semibold text-moon-muted">
                <span>{s.codeLanguage || "code"}</span>
                <span>from the video</span>
              </div>
              <pre className="overflow-x-auto px-4 py-3 font-mono text-sm leading-relaxed text-moon">
                <code>{s.code}</code>
              </pre>
            </div>
          )}
          {s.formula && (
            <div
              className="max-w-full overflow-x-auto rounded-tile bg-paper px-4 py-2 text-ink"
              dangerouslySetInnerHTML={{ __html: math(s.formula, true) }}
            />
          )}
        </section>
      ))}

      <aside className="flex flex-col gap-3 rounded-tile bg-lavender p-4 sm:p-5">
        <p className="text-xs font-bold tracking-wider text-ink uppercase">
          Key terms
        </p>
        <dl className="grid gap-2.5 sm:grid-cols-2">
          {notes.keyTerms.map((t, i) => (
            <div key={i} className="min-w-0 rounded-tile bg-paper/75 px-4 py-3">
              <dt className="font-bold text-ink">
                <Inline text={t.term} />
              </dt>
              <dd className="mt-0.5 text-sm text-slate">
                <Inline text={t.meaning} />
              </dd>
            </div>
          ))}
        </dl>
      </aside>

      <aside className="flex flex-col gap-3 rounded-tile bg-mint p-4 sm:p-5">
        <p className="text-xs font-bold tracking-wider text-ink uppercase">
          Remember
        </p>
        <ul className="flex flex-col gap-2">
          {notes.takeaways.map((t, i) => (
            <li
              key={i}
              className="grid grid-cols-[1.5rem_1fr] items-start gap-2 text-slate"
            >
              <span
                className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-teal-deep text-xs text-white"
                aria-hidden
              >
                ✓
              </span>
              <span>
                <Inline text={t} />
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </article>
  )
}
