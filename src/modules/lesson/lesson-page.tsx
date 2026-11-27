import PagePlaceholder from "@/components/page-placeholder"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>
}) {
  const { slug, lesson } = await params
  return (
    <PagePlaceholder title="Lesson" note={`slug: ${slug}, lesson: ${lesson}`} />
  )
}
