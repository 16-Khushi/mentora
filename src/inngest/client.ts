import { Inngest } from "inngest"

// Locally: run `npm run inngest:dev` next to `npm run dev` (INNGEST_DEV=1 in .env.local).
// On Vercel, the Inngest integration sets INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY.
export const inngest = new Inngest({ id: "mentora" })

/** Sent with { courseId } when a course should be built (or rebuilt after a failure). */
export const BUILD_COURSE = "course/build.requested"
