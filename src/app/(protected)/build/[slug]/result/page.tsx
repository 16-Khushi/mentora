import type { Metadata } from "next"
import ResultPage from "@/modules/placement/result-page"

export const metadata: Metadata = { title: "Placement result" }

export default function Page({
  params,
  searchParams,
}: PageProps<"/build/[slug]/result">) {
  return (
    <ResultPage
      params={params}
      searchParams={searchParams as Promise<{ new?: string }>}
    />
  )
}
