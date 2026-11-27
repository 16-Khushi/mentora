import { DrizzleAdapter } from "@auth/drizzle-adapter"
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

import { db } from "@/db"
import { accounts, sessions, users, verificationTokens } from "@/db/schema"

/** Sign-in providers that have keys in the environment. GitHub turns on once its keys exist. */
export const PROVIDERS = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
}

/** Pages that need a signed-in learner. Kept in step with the matcher in src/proxy.ts. */
const PROTECTED = ["/dashboard", "/new", "/courses", "/settings", "/build"]

/**
 * Auth.js: sign in with Google or GitHub. The Drizzle adapter stores users, linked accounts and
 * sessions in our own database (the Auth.js tables in src/db/schema.ts), so a session is a row we
 * can look up and delete, and signing out really ends it. Auth.js reads AUTH_SECRET and the
 * AUTH_GOOGLE_* / AUTH_GITHUB_* keys from the environment by itself.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    ...(PROVIDERS.google ? [Google] : []),
    ...(PROVIDERS.github ? [GitHub] : []),
  ],
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  callbacks: {
    /**
     * Runs in src/proxy.ts for every matched request, before the page renders.
     * true lets the request through, false sends it to /login (remembering where it was going).
     */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const signedIn = Boolean(auth?.user)
      // Already signed in? The login page has nothing to offer: go to today's lessons.
      if (pathname === "/login") {
        return signedIn
          ? Response.redirect(new URL("/dashboard", request.nextUrl))
          : true
      }
      if (
        PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))
      ) {
        return signedIn
      }
      return true
    },
    /** Put the user's id on the session, so pages can load their courses and progress. */
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
