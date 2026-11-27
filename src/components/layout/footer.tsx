import { Mail } from "lucide-react"
import Link from "next/link"

import Mascot from "@/components/mascot"
import Wordmark from "@/components/wordmark"
import { SITE } from "@/lib/site"

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
]

/**
 * A slim footer for signed-out pages: wordmark and small print on the left, links in the
 * middle, and Thena peeking up from the bottom edge on the right.
 */
export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
      <div className="page-container flex flex-col gap-6 pt-10 pb-10 sm:flex-row sm:items-end sm:gap-12 sm:pr-56">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            aria-label="Mentora home"
            className="self-start rounded-control"
          >
            <Wordmark className="text-5xl" />
          </Link>
          <p className="text-xs text-slate-muted">
            © {new Date().getFullYear()} Mentora. All rights reserved.
          </p>
        </div>
        <nav aria-label="Footer" className="sm:pb-1">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            {SITE.contactEmail && (
              <li>
                <a
                  href={`mailto:${SITE.contactEmail}`}
                  aria-label={`Email ${SITE.contactEmail}`}
                  className="flex text-ink hover:text-violet"
                >
                  <Mail className="size-5" aria-hidden />
                </a>
              </li>
            )}
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="font-semibold text-link underline underline-offset-4 hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* Thena peeks up from the bottom edge; the footer cuts her off at the waist. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[6%] -bottom-24 hidden w-52 sm:block"
      >
        <Mascot pose="wave" size={208} className="w-full" />
      </div>
    </footer>
  )
}
