import AppSidebar from "@/components/layout/app-sidebar"
import AppTabBar from "@/components/layout/app-tab-bar"
import { auth } from "@/lib/auth"

// Every page with the app navigation: a sidebar on desktop, a bottom tab bar on phones.
// Full-screen pages (the build screen, the placement test) live outside this group.
export default async function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()
  const user = {
    name: session?.user?.name ?? "Learner",
    email: session?.user?.email ?? "",
    image: session?.user?.image ?? null,
  }
  return (
    <div className="flex min-h-dvh flex-1">
      <AppSidebar user={user} />
      <main className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
        {children}
      </main>
      <AppTabBar />
    </div>
  )
}
