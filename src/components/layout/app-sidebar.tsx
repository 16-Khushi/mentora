"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import Wordmark from "@/components/wordmark"
import { cn } from "@/lib/utils"

import mark from "../../../public/brand/mentora-mark.png"
import { APP_NAV, isActive } from "./app-nav"
import { SIDEBAR_COOKIE } from "./sidebar-state"
import UserCard, { type SidebarUser } from "./user-card"

/**
 * Left sidebar on desktop (lg and up); phones get AppTabBar instead. Collapses to a slim rail of
 * icons with the toggle or ⌘/Ctrl + B, and remembers that in a cookie.
 */
export default function AppSidebar({
  user,
  initialCollapsed,
}: {
  user: SidebarUser
  initialCollapsed: boolean
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  const toggle = () =>
    setCollapsed((c) => {
      document.cookie = `${SIDEBAR_COOKIE}=${c ? "open" : "collapsed"}; path=/; max-age=31536000; samesite=lax`
      return !c
    })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col gap-8 border-r border-line bg-sidebar py-6 transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.75rem] px-3" : "w-64 px-4"
      )}
    >
      <div
        className={cn(
          "flex items-center",
          collapsed ? "flex-col gap-4" : "justify-between"
        )}
      >
        <Link
          href="/dashboard"
          aria-label="Mentora, today"
          className={cn("rounded-control", !collapsed && "px-3")}
        >
          {collapsed ? (
            <Image
              src={mark}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-[0.7rem]"
            />
          ) : (
            <Wordmark className="text-[2.25rem]" />
          )}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={`${collapsed ? "Expand" : "Collapse"} sidebar (⌘/Ctrl + B)`}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-muted transition-colors hover:bg-lavender hover:text-ink focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"
        >
          <ToggleIcon className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <nav aria-label="App">
        <ul className="flex flex-col gap-1">
          {APP_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? label : undefined}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-full font-semibold transition-colors",
                    collapsed ? "justify-center" : "px-4",
                    active
                      ? "bg-ink text-white"
                      : "text-slate hover:bg-lavender hover:text-ink"
                  )}
                >
                  <Icon
                    className="size-5 shrink-0"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  {!collapsed && label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <UserCard user={user} compact={collapsed} className="mt-auto" />
    </aside>
  )
}
