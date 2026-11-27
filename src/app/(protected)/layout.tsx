// Everything that needs a signed-in learner. src/proxy.ts (step 3) sends signed-out visitors to /login.
// Pages with the app sidebar live in (shell); full-screen ones (the build screen, the placement test) sit beside it.
export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}
