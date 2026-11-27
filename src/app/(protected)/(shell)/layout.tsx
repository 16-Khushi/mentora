// Every page with the app sidebar. The sidebar itself is built once the designs are in.
export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
