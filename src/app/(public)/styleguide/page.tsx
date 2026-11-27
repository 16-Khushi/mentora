import type { Metadata } from "next"

import StyleguidePage from "@/modules/styleguide/styleguide-page"

// Temporary: a check page for the design system (DESIGN.md section 8). Delete before submitting.
export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <StyleguidePage />
}
