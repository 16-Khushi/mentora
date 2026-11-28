import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"

import PlacementResult from "./components/placement-result"
import { getPlacementResult } from "./queries"

/** /build/<slug>/result: the placement test's result, with a full review of the answers. */
export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ new?: string }>
}) {
  const [{ slug }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ])
  if (!session?.user?.id) redirect("/login")
  const found = await getPlacementResult(slug, session.user.id)
  if (!found) notFound()
  if (!found.data) redirect(`/build/${slug}/test`)
  return <PlacementResult data={found.data} celebrate={query.new === "1"} />
}
