"use server"

import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { startCourse } from "@/lib/courses"
import { YouTubeError } from "@/lib/youtube"

export type NewCourseState = { error: string | null; url: string }

/**
 * The "Build my course" button. Problems the learner can fix come back as a message under the
 * box; anything else is logged and shown as a general error. On success, go to the build screen,
 * which handles every case: building (watch it live), ready (someone built it already: instant),
 * or failed.
 */
export async function startCourseAction(
  _prev: NewCourseState,
  formData: FormData
): Promise<NewCourseState> {
  const url = String(formData.get("url") ?? "").trim()
  const session = await auth()
  if (!session?.user?.id)
    redirect(`/login?callbackUrl=${encodeURIComponent(`/new?url=${url}`)}`)
  if (!url) return { error: "Paste a YouTube link first.", url }

  let destination: string
  try {
    const { slug } = await startCourse(url, session.user.id)
    destination = `/build/${slug}`
  } catch (error) {
    if (error instanceof YouTubeError) return { error: error.message, url }
    console.error("[new-course]", error)
    return {
      error: "Something went wrong on our side. Please try again in a moment.",
      url,
    }
  }
  // redirect() works by throwing, so it stays outside the try/catch above.
  redirect(destination)
}
