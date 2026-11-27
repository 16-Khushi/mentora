import type { Metadata } from "next"

import TermsPage from "@/modules/legal/terms-page"

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The rules for using Mentora, in plain language.",
}

export default function Page() {
  return <TermsPage />
}
