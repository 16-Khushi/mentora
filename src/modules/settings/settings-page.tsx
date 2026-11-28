import { eq } from "drizzle-orm"
import { LogOut } from "lucide-react"
import Image from "next/image"
import { redirect } from "next/navigation"

import Eyebrow from "@/components/eyebrow"
import SectionHeading from "@/components/section-heading"
import { db } from "@/db"
import { accounts, users } from "@/db/schema"
import { auth } from "@/lib/auth"
import { DEFAULT_PACE } from "@/lib/pace"
import { signOutAction } from "@/modules/login/actions"

import PacePicker from "./components/pace-picker"

const PROVIDER: Record<string, string> = { google: "Google", github: "GitHub" }

/** /settings: the daily pace and the signed-in account. */
export default async function SettingsPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect("/login")
  const [[user], linked] = await Promise.all([
    db
      .select({
        name: users.name,
        email: users.email,
        image: users.image,
        minutesPerDay: users.minutesPerDay,
      })
      .from(users)
      .where(eq(users.id, userId)),
    db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(eq(accounts.userId, userId)),
  ])
  const name = user?.name ?? "Learner"
  const providers = linked.map((a) => PROVIDER[a.provider] ?? a.provider)

  return (
    <div className="page-container flex max-w-3xl flex-col gap-8 py-8 lg:py-12">
      <SectionHeading as="h1" eyebrow="Account" title="Settings" />

      <section
        aria-labelledby="pace-title"
        className="flex flex-col gap-4 rounded-card bg-paper p-6 shadow-float sm:p-8"
      >
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Plan</Eyebrow>
          <h2 id="pace-title" className="type-h3 text-ink">
            Daily pace
          </h2>
          <p className="text-slate">
            How long you want to study each day. Every course plan packs its
            lessons into days of this length.
          </p>
        </div>
        <PacePicker minutesPerDay={user?.minutesPerDay ?? DEFAULT_PACE} />
      </section>

      <section
        aria-labelledby="account-title"
        className="flex flex-col gap-5 rounded-card bg-paper p-6 shadow-float sm:p-8"
      >
        <div className="flex flex-col gap-1.5">
          <Eyebrow>You</Eyebrow>
          <h2 id="account-title" className="type-h3 text-ink">
            Account
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {user?.image ? (
            <Image
              src={user.image}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-full"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-butter text-xl font-bold text-ink"
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-lg font-bold text-ink">{name}</span>
            <span className="truncate text-slate-muted">{user?.email}</span>
            {providers.length > 0 && (
              <span className="text-sm text-slate-muted">
                Signed in with {providers.join(" and ")}
              </span>
            )}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex h-11 cursor-pointer items-center gap-2 rounded-control border border-line px-4 font-semibold text-ink transition-colors hover:bg-lavender focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
