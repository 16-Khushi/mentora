// Runs before matched pages render (Next 16's proxy, which replaced middleware). Auth.js checks
// the session and its `authorized` callback (src/lib/auth.ts) decides: let through, or go to /login.
export { auth as proxy } from "@/lib/auth"

// Only these paths pay for a session lookup; the landing, legal pages and assets never do.
// Must be constants (Next reads them at build time). Keep in step with PROTECTED in src/lib/auth.ts.
export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/new/:path*",
    "/courses/:path*",
    "/settings/:path*",
    "/build/:path*",
  ],
}
