"use server"

import { signIn, signOut } from "@/lib/auth"

/**
 * Only same-site paths are allowed as a destination after signing in ("/new?url=…"), never a full
 * URL, so a crafted link can't bounce someone to another website.
 */
function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : ""
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard"
}

export async function signInWith(
  provider: "google" | "github",
  formData: FormData
) {
  await signIn(provider, { redirectTo: safeNext(formData.get("next")) })
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}
