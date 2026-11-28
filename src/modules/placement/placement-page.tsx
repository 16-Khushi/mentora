import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"

import PlacementTest from "./components/placement-test"
import { getPlacement } from "./queries"

/** /build/<slug>/test: the placement test for a ready course. */
export default async function PlacementPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const data = await getPlacement(slug, session.user.id)
  if (!data) notFound()
  if (data.course.status !== "ready") redirect(`/build/${slug}`)
  if (!data.questions.length) redirect(`/courses/${slug}`)
  return (
    <PlacementTest
      slug={data.course.slug}
      title={data.course.title}
      questions={data.questions}
      taken={data.taken}
    />
  )
}
