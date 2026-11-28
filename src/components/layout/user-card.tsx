import { LogOut } from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { signOutAction } from "@/modules/login/actions"

export type SidebarUser = { name: string; email: string; image: string | null }

/**
 * Who is signed in, with a sign-out button. Sits at the bottom of the app sidebar; `compact`
 * (collapsed sidebar) stacks the avatar over the sign-out button.
 */
export default function UserCard({
  user,
  compact = false,
  className,
}: {
  user: SidebarUser
  compact?: boolean
  className?: string
}) {
  const initial = user.name.trim().charAt(0).toUpperCase() || "M"
  return (
    <div
      title={compact ? `${user.name} · ${user.email}` : undefined}
      className={cn(
        "flex items-center rounded-tile bg-paper",
        compact ? "flex-col gap-2 p-2" : "gap-3 p-3",
        className
      )}
    >
      {user.image ? (
        <Image
          src={user.image}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-butter font-bold text-ink"
        >
          {initial}
        </span>
      )}
      {!compact && (
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold text-ink">
            {user.name}
          </span>
          <span className="truncate text-xs text-slate-muted">
            {user.email}
          </span>
        </div>
      )}
      <form action={signOutAction}>
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-slate-muted transition-colors hover:bg-lavender hover:text-ink focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  )
}
