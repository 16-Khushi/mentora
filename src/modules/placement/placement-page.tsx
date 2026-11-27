import PagePlaceholder from "@/components/page-placeholder"

export default async function PlacementPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PagePlaceholder title="Placement test" note={`slug: ${slug}`} />
}
