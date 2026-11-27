// Landing and other signed-out pages. The public navbar and footer go here once designed.
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <main className="flex min-h-dvh flex-1 flex-col">{children}</main>
}
