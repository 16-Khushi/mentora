import Mascot, { type MascotPose } from "@/components/mascot"
import Parallax from "@/components/motion/parallax"
import Reveal from "@/components/motion/reveal"
import PastelCard from "@/components/pastel-card"
import SectionHeading from "@/components/section-heading"
import type { Tone } from "@/types/design"

const FEATURES: {
  tone: Tone
  pose: MascotPose
  title: string
  body: string
}[] = [
  {
    tone: "butter",
    pose: "thinking",
    title: "Skip what you already know",
    body: "A ten-question placement test checks what you know. Every right answer drops the lessons it covers from your plan.",
  },
  {
    tone: "sky",
    pose: "reading",
    title: "Short lessons with notes",
    body: "Long videos become 8 to 25 minute lessons, each with study notes, code, maths and a quick quiz.",
  },
  {
    tone: "lavender",
    pose: "celebrate",
    title: "A plan you can finish",
    body: "Tell Mentora how many minutes a day you have. It packs the course into days and keeps your streak going.",
  },
]

export default function Features() {
  return (
    <section
      id="features"
      className="page-container flex scroll-mt-24 flex-col gap-12 py-24"
    >
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Get to know Mentora"
          title="We exist to turn saved videos into finished courses"
        />
      </Reveal>
      <div className="grid gap-5 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 140} className="flex">
            <PastelCard
              tone={f.tone}
              className="flex-1 items-center text-center"
            >
              <h3 className="type-h3 text-ink">{f.title}</h3>
              <p className="max-w-[34ch]">{f.body}</p>
              <Parallax speed={0.06} className="mt-auto pt-4">
                <Mascot pose={f.pose} size={200} className="w-44" />
              </Parallax>
            </PastelCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
