import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"

import Cloud from "@/components/cloud"
import Mascot from "@/components/mascot"
import Reveal from "@/components/motion/reveal"
import Wordmark from "@/components/wordmark"

// Honest numbers only: what the product does, never invented usage figures.
const STATS = [
  { value: "About 1 min", label: "to turn a video into a course" },
  { value: "Free", label: "No cost and no ads" },
  { value: "8 to 25 min", label: "per lesson, with notes and a quiz" },
]

// Pale buttons that sit on the violet banner, with a soft drop like a sticker.
const PALE_BUTTON =
  "inline-flex h-14 items-center gap-3 rounded-control bg-lavender px-5 font-semibold text-ink shadow-[0_6px_14px_rgb(23_17_47/0.28)] transition-transform hover:-translate-y-0.5"

/**
 * The closing banner: wide and short, violet, with clouds. Logo and a line on the left,
 * short facts in the middle, and Thena on the right, cropped by the banner's edges.
 */
export default function FinalCta() {
  return (
    <section className="page-container pb-24">
      <Reveal>
        <div
          className="relative overflow-hidden rounded-[38px] bg-violet text-white"
          style={{
            // A faint painted texture, so the violet doesn't look flat.
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgb(255 255 255 / 0.08), transparent 40%), radial-gradient(circle at 70% 90%, rgb(23 17 47 / 0.25), transparent 50%)",
          }}
        >
          <Cloud className="top-5 left-[30%] w-10" />
          <Cloud className="top-3 left-[47%] w-12" />
          <Cloud className="top-6 left-[54%] w-14" />
          <Cloud className="right-[38%] bottom-6 w-9 opacity-80 max-md:hidden" />

          <div className="relative z-10 grid gap-8 px-7 pt-10 pb-8 sm:px-10 md:grid-cols-[1.35fr_0.75fr] md:pr-[36%] md:pb-10">
            <div className="flex flex-col gap-5">
              <Wordmark className="text-5xl text-white" />
              <p className="max-w-[24ch] font-fraunces text-[1.75rem] leading-tight text-white">
                The <strong className="font-bold">calm way</strong> to finish
                what you start on YouTube
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/new" className={PALE_BUTTON}>
                  <Play className="size-5 fill-ink" aria-hidden />
                  Build your first course
                </Link>
                <Link href="/#how-it-works" className={PALE_BUTTON}>
                  How it works
                  <ArrowRight className="size-5" aria-hidden />
                </Link>
              </div>
            </div>
            <ul className="flex flex-col justify-center gap-5">
              {STATS.map((s) => (
                <li key={s.value} className="flex flex-col">
                  <span className="text-2xl leading-tight font-bold">
                    {s.value}
                  </span>
                  <span className="text-sm text-lavender">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Thena, big and tilted, cut off by the banner's top and bottom edges. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -bottom-28 hidden w-[38%] rotate-[-8deg] md:block"
          >
            <Mascot pose="reading" size={460} className="w-full" />
          </div>
          {/* On phones she peeks up from the bottom instead. */}
          <div
            aria-hidden
            className="relative -mb-24 flex justify-center md:hidden"
          >
            <Mascot pose="reading" size={260} className="w-64 rotate-[-6deg]" />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
