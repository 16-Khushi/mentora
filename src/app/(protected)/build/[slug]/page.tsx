import type { Metadata } from "next"

import OnboardingPage from "@/modules/onboarding/onboarding-page"

export const metadata: Metadata = { title: "Building your course" }

export default function Page({ params }: PageProps<"/build/[slug]">) {
  return <OnboardingPage params={params} />
}
