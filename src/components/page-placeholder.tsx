import Mascot from "@/components/mascot"
import PastelCard from "@/components/pastel-card"

// Temporary stand-in for a screen until its step is built.
export default function PagePlaceholder({
  title,
  note,
}: {
  title: string
  note?: string
}) {
  return (
    <section className="page-container flex flex-1 flex-col gap-8 py-10">
      <h1 className="type-h1 text-ink">{title}</h1>
      <PastelCard tone="lavender" className="items-center py-12 text-center">
        <Mascot pose="sleeping" size={160} className="w-40" />
        <p className="type-h4 text-ink">Thena is still building this page.</p>
        {note && <p className="text-sm text-slate-muted">{note}</p>}
      </PastelCard>
    </section>
  )
}
