import Mascot from "@/components/mascot"
import Parallax from "@/components/motion/parallax"
import Reveal from "@/components/motion/reveal"
import Wordmark from "@/components/wordmark"

/** Introduces the guide character, like a friendly host at the door. */
export default function MeetThena() {
  return (
    <section className="page-container pb-24">
      <Reveal>
        <div className="flex flex-col items-center gap-10 rounded-sheet bg-sky/60 px-6 py-14 sm:px-12 sm:py-16">
          <h2 className="flex flex-wrap items-baseline justify-center gap-x-4 type-h1 text-ink">
            Hi! I&apos;m
            <Wordmark className="text-6xl sm:text-7xl" name="Thena" />
          </h2>
          <div className="grid w-full items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <Parallax speed={0.08} className="flex justify-center">
              <Mascot
                pose="wave"
                size={360}
                className="w-56 sm:w-72 md:w-[360px]"
              />
            </Parallax>
            <div className="flex flex-col gap-4 rounded-[48px_48px_48px_12px] bg-lavender p-8 sm:p-10">
              <p className="type-lead text-slate">
                A wise, slightly sleepy owl who reads everything twice. I turn
                the videos you save into short lessons, quiz you kindly, and
                cheer when you reach the end.
              </p>
              <p className="type-lead text-slate">
                You&apos;ll find me on every page, usually with a book.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
