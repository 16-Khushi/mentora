import type { Metadata } from "next"
import PlacementPage from "@/modules/placement/placement-page"

export const metadata: Metadata = { title: "Placement test" }

export default function Page({ params }: PageProps<"/build/[slug]/test">) {
  return <PlacementPage params={params} />
}
