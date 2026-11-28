import { auth } from "@/lib/auth"
import { getBuildState } from "@/modules/onboarding/queries"

// The build screen asks this every couple of seconds while a course is being built.
// Not covered by src/proxy.ts (API routes aren't), so it checks the session itself.
export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/build/[slug]">
) {
  const session = await auth()
  if (!session?.user)
    return Response.json({ error: "Sign in first" }, { status: 401 })
  const { slug } = await ctx.params
  const state = await getBuildState(slug)
  if (!state) return Response.json({ error: "No such course" }, { status: 404 })
  return Response.json(state, { headers: { "Cache-Control": "no-store" } })
}
