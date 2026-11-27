import Mascot from "@/components/mascot"
import Paper from "@/components/paper"
import SectionHeading from "@/components/section-heading"
import { SITE } from "@/lib/site"

export type LegalSection = { title: string; body: React.ReactNode }

/** Shared layout for Terms and Privacy: heading, a short summary card, then numbered sections. */
export default function LegalLayout({
  eyebrow,
  title,
  summary,
  sections,
}: {
  eyebrow: string
  title: string
  summary: React.ReactNode
  sections: LegalSection[]
}) {
  return (
    <div className="page-container flex flex-col gap-10 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow={eyebrow}
        title={title}
        lead={`Last updated ${SITE.legalUpdated}`}
      />
      <div className="flex items-center gap-5 rounded-card bg-lavender p-6 sm:p-8">
        <Mascot
          pose="reading"
          size={88}
          className="w-20 shrink-0 max-sm:hidden"
        />
        <div className="type-body text-slate">{summary}</div>
      </div>
      <Paper className="flex flex-col gap-10 sm:p-12">
        {sections.map((s, i) => (
          <section key={s.title} className="flex flex-col gap-3">
            <h2 className="type-h4 text-ink">
              <span className="text-violet">{i + 1}.</span> {s.title}
            </h2>
            <div className="flex max-w-[68ch] flex-col gap-3 type-body text-slate [&_a]:text-link [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
              {s.body}
            </div>
          </section>
        ))}
      </Paper>
    </div>
  )
}

/** The contact address, or a clear placeholder while it isn't set. */
export function ContactEmail() {
  return SITE.contactEmail ? (
    <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
  ) : (
    <strong>[contact email coming soon]</strong>
  )
}
