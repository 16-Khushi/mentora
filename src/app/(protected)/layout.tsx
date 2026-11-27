import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

// Everything here needs a signed-in learner. src/proxy.ts already sends signed-out visitors to
// /login; this check is the safety net if a page is ever missing from the proxy's matcher.
// Pages with the app sidebar live in (shell); full-screen ones (build screen, placement test) beside it.
export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return <>{children}</>
}
