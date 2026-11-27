import Link from "next/link"

import Mascot from "@/components/mascot"
import Reveal from "@/components/motion/reveal"

/** Two cards before the closing banner: what you get in numbers, and a promise about your data. */
export default function TrustCards() {
  return (
    <section className="page-container grid gap-5 pt-24 pb-5 md:grid-cols-2">
      <Reveal className="flex">
        <div className="flex flex-1 flex-col justify-center gap-2 rounded-[38px] bg-butter px-8 py-10 text-ink sm:px-12">
          <div className="flex flex-wrap items-end gap-x-4">
            <span className="type-stat">10</span>
            <span className="pb-2 text-sm leading-tight font-bold">
              question placement test
              <br />
              that skips what you know
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-x-4">
            <span className="type-stat">0</span>
            <span className="pb-2 text-sm leading-tight font-bold">
              downloads: every video plays
              <br />
              in YouTube&apos;s own player
            </span>
          </div>
        </div>
      </Reveal>
      <Reveal delay={120} className="flex">
        <div
          className="flex flex-1 rounded-[38px] p-5 sm:p-6"
          style={{
            background:
              "linear-gradient(135deg, var(--coral) 0 18%, var(--butter) 18% 36%, var(--mint) 36% 54%, var(--azure) 54% 72%, var(--violet) 72% 100%)",
          }}
        >
          <div className="flex flex-1 flex-col justify-center gap-4 rounded-card bg-paper px-7 py-8 sm:px-10">
            <Mascot pose="sleeping" size={64} className="w-16" />
            <h2 className="type-h3 text-ink">
              We keep only what your learning needs
            </h2>
            <p className="text-slate">
              Your name and email from Google, and your progress. No ads, no
              tracking, nothing sold.
            </p>
            <Link
              href="/privacy"
              className="font-bold text-link underline underline-offset-4 hover:text-ink"
            >
              Read our privacy policy
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
