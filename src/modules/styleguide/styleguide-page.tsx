import { Check, Clock, Flame, Link2, Play, RotateCcw, X } from "lucide-react"

import BrushEdge from "@/components/brush-edge"
import Eyebrow from "@/components/eyebrow"
import NightSky from "@/components/night-sky"
import Paper from "@/components/paper"
import PastelCard from "@/components/pastel-card"
import Pill from "@/components/pill"
import ProgressBar from "@/components/progress-bar"
import SectionHeading from "@/components/section-heading"
import StatBlock from "@/components/stat-block"
import { Button } from "@/components/ui/button"
import Wordmark from "@/components/wordmark"

const CORE = [
  ["cream", "#FFF6F0", "bg-cream"],
  ["paper", "#FFFFFF", "bg-paper"],
  ["sand", "#F5EBE4", "bg-sand"],
  ["ink", "#3D2D79", "bg-ink"],
  ["violet", "#644FB4", "bg-violet"],
  ["slate", "#2E455D", "bg-slate"],
  ["slate-muted", "#596B7E", "bg-slate-muted"],
  ["line", "#EADFD6", "bg-line"],
] as const

const PASTELS = [
  ["butter", "highlights, today", "bg-butter"],
  ["sky", "watching", "bg-sky"],
  ["lavender", "reading, notes", "bg-lavender"],
  ["mint", "done, correct", "bg-mint"],
  ["blush", "wrong, look again", "bg-blush"],
  ["periwinkle", "section bands", "bg-periwinkle"],
] as const

const ACCENTS = [
  ["teal", "bg-teal", "bg-teal-deep"],
  ["coral", "bg-coral", "bg-coral-deep"],
  ["azure", "bg-azure", "bg-azure-deep"],
] as const

const TYPE = [
  ["type-display", "Display · 60", "From watch later to finished"],
  ["type-h1", "H1 · 44", "Your courses"],
  ["type-h2", "H2 · 36", "Pick up where you stopped"],
  ["type-h3", "H3 · 28", "Attention is all you need"],
  ["type-h4", "H4 · 22", "Day 3 · 2 lessons"],
] as const

function Block({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-8">
      <SectionHeading eyebrow={eyebrow} title={title} />
      {children}
    </section>
  )
}

export default function StyleguidePage() {
  return (
    <div className="flex flex-col">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-24 px-4 py-16 sm:px-6">
        <header className="flex flex-col gap-6">
          <Wordmark className="text-5xl" />
          <SectionHeading
            as="h1"
            eyebrow="Design system"
            title="Mentora styleguide"
            lead="Every colour, type size and building block in one place. Check it here before any real screen is built."
          />
        </header>

        <Block eyebrow="Colour" title="Core">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CORE.map(([name, hex, cls]) => (
              <div key={name} className="flex flex-col gap-2">
                <div
                  className={`h-20 rounded-tile border border-line ${cls}`}
                />
                <p className="text-sm font-bold text-ink">{name}</p>
                <p className="font-mono text-xs text-slate-muted">{hex}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block eyebrow="Colour" title="Pastels and accents">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {PASTELS.map(([name, use, cls]) => (
              <div
                key={name}
                className={`flex h-32 flex-col justify-end rounded-card p-4 ${cls}`}
              >
                <p className="text-sm font-bold text-ink">{name}</p>
                <p className="text-xs text-slate">{use}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {ACCENTS.map(([name, bright, deep]) => (
              <div key={name} className="flex overflow-hidden rounded-tile">
                <div className={`flex h-20 flex-1 items-end p-3 ${bright}`}>
                  <span className="text-xs font-bold text-ink">{name}</span>
                </div>
                <div className={`flex h-20 flex-1 items-end p-3 ${deep}`}>
                  <span className="text-xs font-bold text-white">
                    {name}-deep · white text
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block eyebrow="Type" title="Fraunces and Nunito">
          <Paper className="flex flex-col gap-8">
            {TYPE.map(([cls, label, sample]) => (
              <div
                key={cls}
                className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-baseline"
              >
                <span className="font-mono text-xs text-slate-muted">
                  {label}
                </span>
                <p className={`${cls} text-ink`}>{sample}</p>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-baseline">
              <span className="font-mono text-xs text-slate-muted">
                Eyebrow · 14
              </span>
              <Eyebrow>Get to know your course</Eyebrow>
            </div>
            <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-baseline">
              <span className="font-mono text-xs text-slate-muted">
                Lead · 20
              </span>
              <p className="type-lead">
                Paste any YouTube link and get a course you actually finish.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-baseline">
              <span className="font-mono text-xs text-slate-muted">
                Reading · 18
              </span>
              <p className="type-reading">
                A transformer reads every word of a sentence at once and learns
                which words should pay attention to which. That is what lets it
                handle long context so well, and it is why the paper is called{" "}
                <a href="#" className="text-link underline underline-offset-4">
                  Attention is all you need
                </a>
                . Inline code looks like{" "}
                <code className="rounded-md bg-sand px-1.5 py-0.5 font-mono text-[0.9em] text-ink">
                  softmax(QK^T)
                </code>
                .
              </p>
            </div>
          </Paper>
        </Block>

        <Block eyebrow="Controls" title="Buttons, pills and inputs">
          <div className="flex flex-wrap gap-3">
            <Button>Build my course</Button>
            <Button variant="accent">
              <Play /> Start lesson
            </Button>
            <Button variant="outline">Full course</Button>
            <Button variant="secondary">See notes</Button>
            <Button variant="ghost">Skip</Button>
            <Button variant="destructive">Remove course</Button>
            <Button variant="link">Learn more</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill>Day 3</Pill>
            <Pill>
              <Clock /> 18 min
            </Pill>
            <Pill variant="solid">My course</Pill>
            <Pill variant="butter">
              <Flame /> 7 day streak
            </Pill>
            <Pill variant="mint">
              <Check /> Done
            </Pill>
            <Pill variant="blush">Look again</Pill>
            <Pill variant="sky">Watching</Pill>
            <Pill variant="lavender">Notes</Pill>
          </div>
          <label className="flex max-w-2xl items-center gap-2 rounded-tile border border-line bg-paper p-2 pl-5 focus-within:ring-3 focus-within:ring-violet/40">
            <Link2 className="size-5 shrink-0 text-slate-muted" aria-hidden />
            <span className="sr-only">YouTube link</span>
            <input
              id="styleguide-link"
              className="h-12 min-w-0 flex-1 bg-transparent text-lg text-slate outline-none placeholder:text-slate-muted"
              placeholder="Paste a YouTube video or playlist link"
            />
            <Button size="lg" className="h-12">
              Build course
            </Button>
          </label>
        </Block>

        <Block eyebrow="Cards" title="Pastel cards and stats">
          <div className="grid gap-5 md:grid-cols-3">
            <PastelCard tone="butter">
              <Eyebrow>Placement test</Eyebrow>
              <h3 className="type-h3 text-ink">Skip what you already know</h3>
              <p>
                Ten quick questions. Answer right and those lessons leave your
                plan.
              </p>
            </PastelCard>
            <PastelCard tone="sky">
              <Eyebrow>Daily plan</Eyebrow>
              <h3 className="type-h3 text-ink">Fits the minutes you have</h3>
              <p>Pick a pace and every course is packed into days around it.</p>
            </PastelCard>
            <PastelCard tone="lavender">
              <Eyebrow>Notes and quiz</Eyebrow>
              <h3 className="type-h3 text-ink">Check that it stuck</h3>
              <p>Study notes and a short quiz for every lesson.</p>
            </PastelCard>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <PastelCard tone="butter" className="justify-center">
              <StatBlock value="2h 10m" label="saved by your placement test" />
            </PastelCard>
            <Paper className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="type-h4 text-ink">
                  Neural networks: zero to hero
                </h3>
                <Pill>Day 2 of 9</Pill>
              </div>
              <ProgressBar value={38} label="Course progress" />
              <ProgressBar value={100} label="Lesson progress" />
              <p className="text-sm text-slate-muted">
                Violet while you go, teal when it&apos;s done.
              </p>
            </Paper>
          </div>
        </Block>

        <Block eyebrow="Quiz" title="Answer states">
          <Paper className="flex max-w-2xl flex-col gap-3">
            <p className="type-h4 text-ink">
              What does attention let a transformer do?
            </p>
            <div className="rounded-tile border border-line bg-paper px-5 py-4">
              Read the sentence one word at a time
            </div>
            <div className="rounded-tile border border-transparent bg-paper px-5 py-4 ring-3 ring-violet">
              Selected: compare every word with every other word
            </div>
            <div className="flex items-center gap-3 rounded-tile bg-mint px-5 py-4 text-ink">
              <Check className="size-5 shrink-0 text-teal-deep" aria-hidden />
              Correct: compare every word with every other word
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-tile bg-blush px-5 py-4 text-ink">
              <X className="size-5 shrink-0 text-coral-deep" aria-hidden />
              <span className="flex-1">
                Wrong: store the whole video in memory
              </span>
              <Button size="sm" variant="outline">
                <RotateCcw /> Replay the moment
              </Button>
            </div>
          </Paper>
        </Block>
      </div>

      <NightSky>
        <BrushEdge flip seed={9} />
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
          <p className="eyebrow text-moon-muted">Night section</p>
          <h2 className="type-display text-moon">
            From watch later to finished
          </h2>
          <p className="max-w-[48ch] type-lead text-moon-muted">
            Used for the landing&apos;s night band and the build screen while
            your course is written.
          </p>
        </div>
        <BrushEdge />
      </NightSky>
      <div className="h-24" />
    </div>
  )
}
