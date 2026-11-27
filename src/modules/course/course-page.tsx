import PagePlaceholder from "@/components/page-placeholder"

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PagePlaceholder title="Course" note={`slug: ${slug}`} />
}
