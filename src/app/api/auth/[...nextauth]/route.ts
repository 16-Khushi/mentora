import { handlers } from "@/lib/auth"

// Auth.js's own endpoints: /api/auth/callback/google, /api/auth/callback/github, /api/auth/session, …
export const { GET, POST } = handlers
