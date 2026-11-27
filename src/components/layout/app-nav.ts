import { Library, Plus, Settings, Sun } from "lucide-react"

/** The signed-in app's sections, shared by the desktop sidebar and the phone tab bar. */
export const APP_NAV = [
  { href: "/dashboard", label: "Today", icon: Sun },
  { href: "/new", label: "New course", icon: Plus },
  { href: "/courses", label: "My courses", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

/** A section is active on its own page and on everything under it (/courses/abc counts as My courses). */
export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
