import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"

// Landing and other signed-out pages.
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  )
}
