import type { Metadata } from "next"

import PrivacyPage from "@/modules/legal/privacy-page"

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Mentora collects, why, and how to have it deleted.",
}

export default function Page() {
  return <PrivacyPage />
}
