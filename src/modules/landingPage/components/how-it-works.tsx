import Reveal from "@/components/motion/reveal"
import Paper from "@/components/paper"
import SectionHeading from "@/components/section-heading"

// A real sequence, so the numbers carry meaning.
const STEPS = [
  {
    title: "Paste a link",
    body: "Any YouTube video or playlist with captions. Up to a few hours of video.",
  },
  {
    title: "Mentora builds the course",
    body: "NVIDIA Nemotron reads the captions, splits them into lessons on topic boundaries and writes notes, quizzes and a placement test. About a minute.",
  },
  {
    title: "Learn a little every day",
    body: "Take the placement test, then follow today's lessons. Watch, read, answer, and you're done for the day.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="page-container scroll-mt-24 pb-24">
      <Reveal>
        <Paper className="flex flex-col gap-12 sm:p-14">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps, then just show up"
            lead="You choose what to learn. Mentora does the course design."
          />
          <ol className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-3">
                <span
                  aria-hidden
                  className="font-fraunces text-5xl leading-none text-violet"
                >
                  {i + 1}
                </span>
                <h3 className="type-h4 text-ink">{s.title}</h3>
                <p className="text-slate">{s.body}</p>
              </li>
            ))}
          </ol>
        </Paper>
      </Reveal>
    </section>
  )
}
