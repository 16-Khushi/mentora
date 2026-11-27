import Link from "next/link"

import Mascot from "@/components/mascot"
import Wordmark from "@/components/wordmark"
import { PROVIDERS } from "@/lib/auth"

import { signInWith } from "./actions"
import { GitHubIcon, GoogleIcon } from "./components/provider-icons"

// Auth.js sends these codes in ?error= when sign-in fails. Say what happened and what to do.
const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email already signed in with the other provider. Use the same one you used last time.",
  AccessDenied: "Sign-in was cancelled. Try again whenever you're ready.",
  Configuration:
    "Sign-in isn't set up correctly on our side yet. Please try again later.",
}

const BUTTON =
  "flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-control border border-line bg-paper text-base font-semibold text-ink transition-colors hover:bg-lavender focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  // Where to go after signing in. Auth.js's proxy adds ?callbackUrl= when it sends people here.
  const raw = params.callbackUrl ?? params.next
  const next = typeof raw === "string" ? toPath(raw) : "/dashboard"
  const errorCode = typeof params.error === "string" ? params.error : null
  const error = errorCode
    ? (ERRORS[errorCode] ?? "Sign-in didn't work. Please try again.")
    : null
  const none = !PROVIDERS.google && !PROVIDERS.github

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 px-4 py-10">
      <Link href="/" aria-label="Mentora home" className="rounded-control">
        <Wordmark className="text-5xl" />
      </Link>
      <div className="flex w-full flex-col items-center gap-6 rounded-sheet bg-paper px-6 pt-4 pb-8 sm:px-10">
        <Mascot pose="wave" size={150} preload className="w-36" />
        <div className="flex flex-col gap-2 text-center">
          <h1 className="type-h2 text-ink">Welcome to Mentora</h1>
          <p className="text-slate-muted">
            Sign in to turn videos into courses you finish.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="w-full rounded-tile bg-blush px-4 py-3 text-sm text-ink"
          >
            {error}
          </p>
        )}

        <div className="flex w-full flex-col gap-3">
          {PROVIDERS.google && (
            <form action={signInWith.bind(null, "google")}>
              <input type="hidden" name="next" value={next} />
              <button type="submit" className={BUTTON}>
                <GoogleIcon className="size-5" />
                Continue with Google
              </button>
            </form>
          )}
          {PROVIDERS.github && (
            <form action={signInWith.bind(null, "github")}>
              <input type="hidden" name="next" value={next} />
              <button type="submit" className={BUTTON}>
                <GitHubIcon className="size-5" />
                Continue with GitHub
              </button>
            </form>
          )}
          {none && (
            <p className="text-center text-sm text-slate-muted">
              No sign-in providers are set up yet. Add the Google or GitHub keys
              to .env.local.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-slate-muted">
          By continuing you agree to our{" "}
          <Link
            href="/terms"
            className="text-link underline underline-offset-2"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-link underline underline-offset-2"
          >
            Privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

/**
 * Auth.js passes callbackUrl as a full URL ("http://localhost:3000/new?url=…"). Keep only its path
 * and query: that always points at this site, whatever was in the link.
 */
function toPath(value: string) {
  try {
    const url = new URL(value, "http://mentora.local")
    const path = `${url.pathname}${url.search}`
    return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard"
  } catch {
    return "/dashboard"
  }
}
