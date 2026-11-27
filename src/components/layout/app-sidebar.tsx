"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import Mascot from "@/components/mascot"
import Wordmark from "@/components/wordmark"
import { cn } from "@/lib/utils"

import { APP_NAV, isActive } from "./app-nav"

/** Left sidebar on desktop (lg and up). Phones get AppTabBar instead. */
export default function AppSidebar() {
  const pathname = usePathname()
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r border-line bg-sidebar px-4 py-6 lg:flex">
      <Link
        href="/dashboard"
        aria-label="Mentora, today"
        className="rounded-control px-3"
      >
        <Wordmark className="text-[2.25rem]" />
      </Link>
      <nav aria-label="App">
        <ul className="flex flex-col gap-1">
          {APP_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-full px-4 font-semibold transition-colors",
                    active
                      ? "bg-ink text-white"
                      : "text-slate hover:bg-lavender hover:text-ink"
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="mt-auto flex flex-col items-center gap-2 rounded-card bg-lavender p-4 text-center">
        <Mascot pose="reading" size={96} className="w-24" />
        <p className="text-sm font-semibold text-ink">
          A little every day beats a lot once.
        </p>
      </div>
    </aside>
  )
}
