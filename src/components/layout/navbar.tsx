import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import Wordmark from "@/components/wordmark"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
]

/**
 * Top bar for signed-out pages: links on the left, the wordmark in the centre, actions on the right.
 * On phones the links hide and the wordmark moves to the left.
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-cream/85 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <nav
        aria-label="Main"
        className="page-container grid h-16 grid-cols-[auto_1fr] items-center gap-4 sm:h-20 md:grid-cols-[1fr_auto_1fr]"
      >
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="font-semibold text-slate-muted transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" aria-label="Mentora home" className="rounded-control">
          <Wordmark className="text-[2rem] sm:text-[2.75rem]" />
        </Link>
        <div className="flex items-center justify-end gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden sm:inline-flex"
            )}
          >
            Sign in
          </Link>
          <Link href="/new" className={buttonVariants()}>
            Start learning
          </Link>
        </div>
      </nav>
    </header>
  )
}
