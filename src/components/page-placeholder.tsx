// Temporary stand-in for a screen until its design is built.
export default function PagePlaceholder({
  title,
  note,
}: {
  title: string
  note?: string
}) {
  return (
    <section className="flex flex-1 flex-col gap-2 p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </section>
  )
}
