import { Captions, Clock, ListVideo } from "lucide-react"

import Mascot from "@/components/mascot"
import PastelCard from "@/components/pastel-card"
import SectionHeading from "@/components/section-heading"
import { LIMITS } from "@/lib/youtube"

import NewCourseForm from "./components/new-course-form"

const hours = LIMITS.maxTotalSeconds / 3600

const TIPS = [
  {
    icon: Captions,
    text: "The video needs captions. Most lectures and tutorials have them.",
  },
  {
    icon: ListVideo,
    text: `Playlists work too: up to ${LIMITS.maxPlaylistVideos} videos.`,
  },
  {
    icon: Clock,
    text: `Up to ${hours} hours per course. It's ready in about a minute.`,
  },
]

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { url } = await searchParams
  const initialUrl = typeof url === "string" ? url : ""

  return (
    <div className="page-container flex flex-col gap-10 py-10 lg:py-14">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-6">
          <SectionHeading
            as="h1"
            eyebrow="New course"
            title="What do you want to learn?"
            lead="Paste a YouTube video or playlist. Mentora turns it into short lessons with notes, quizzes and a plan for your days."
          />
          <NewCourseForm initialUrl={initialUrl} />
        </div>
        <Mascot pose="thinking" size={220} className="hidden w-52 lg:block" />
      </div>

      <PastelCard tone="sky" className="gap-4">
        <p className="eyebrow text-plum">Good to know</p>
        <ul className="grid gap-4 sm:grid-cols-3">
          {TIPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <Icon
                className="mt-0.5 size-5 shrink-0 text-ink"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="text-slate">{text}</span>
            </li>
          ))}
        </ul>
      </PastelCard>
    </div>
  )
}
