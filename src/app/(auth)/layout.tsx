// Sign-in screens: centered, no app chrome.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center">
      {children}
    </main>
  )
}
