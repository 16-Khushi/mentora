import { BookOpenText, HeartHandshake, RotateCcw, Users } from "lucide-react"

import Reveal from "@/components/motion/reveal"
import SectionHeading from "@/components/section-heading"

// Deep accent shades: white text on them passes contrast (DESIGN.md section 2).
const BENEFITS = [
  {
    icon: HeartHandshake,
    cls: "bg-teal-deep",
    text: "Videos play in YouTube's own player, so creators keep every view.",
  },
  {
    icon: RotateCcw,
    cls: "bg-coral-deep",
    text: "Missed a quiz question? Replay the exact moment it was taught.",
  },
  {
    icon: BookOpenText,
    cls: "bg-violet",
    text: "Notes that handle code blocks and maths, written for each lesson.",
  },
  {
    icon: Users,
    cls: "bg-azure-deep",
    text: "Each course is built once and shared, so the next learner starts instantly.",
  },
]

export default function Benefits() {
  return (
    <section className="bg-periwinkle/50 py-24">
      <div className="page-container flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Why Mentora"
          title="Made for finishing"
        />
        <ul className="grid gap-4 md:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, cls, text }, i) => (
            <li key={text} className="flex">
              <Reveal
                delay={i * 110}
                className={`flex flex-1 items-center gap-5 rounded-tile p-6 text-white sm:p-8 ${cls}`}
              >
                <Icon
                  className="size-8 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="type-body text-white">{text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
