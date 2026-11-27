import PagePlaceholder from "@/components/page-placeholder"

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PagePlaceholder title="Building your course" note={`slug: ${slug}`} />
}
