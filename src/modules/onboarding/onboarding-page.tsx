import { notFound } from "next/navigation"

import BuildScreen from "./components/build-screen"
import { getBuildState } from "./queries"

/** /build/<slug>: the live build screen, or what to do next once the course is ready. */
export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const state = await getBuildState(slug)
  if (!state) notFound()
  return <BuildScreen initial={state} />
}
