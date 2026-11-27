/** Facts about the site that several pages show. */
export const SITE = {
  name: "Mentora",
  /** Where people send questions and data requests. Set NEXT_PUBLIC_CONTACT_EMAIL in .env.local. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  /** Shown on the legal pages. Update it whenever their text changes. */
  legalUpdated: "27 November 2026",
} as const
