"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

import { APP_NAV, isActive } from "./app-nav"

/** Bottom tab bar on phones and tablets (below lg), clear of the home indicator. */
export default function AppTabBar() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2">
        {APP_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors",
                  active ? "text-ink" : "text-slate-muted hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-lavender"
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
