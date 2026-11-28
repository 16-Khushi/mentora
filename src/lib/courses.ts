import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import {
  courses,
  courseVideos,
  enrollments,
  videos,
  videoTranscripts,
} from "@/db/schema"
import { BUILD_COURSE, inngest } from "@/inngest/client"

import { fetchTranscript } from "./transcript"
import { fetchCourseSource, parseYouTubeUrl, YouTubeError } from "./youtube"

/** "Let's build GPT: from scratch!" → "lets-build-gpt-from-scratch-k3x9q2" (unique). */
export function makeSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "") // "Let's" → "lets", not "let-s"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base || "course"}-${suffix}`
}

/**
 * Turns a pasted link into a course for this learner, and returns its slug.
 *
 * - The same video or playlist always maps to one course. If someone already built it, the learner
 *   just joins it: no AI cost, ready instantly. A course whose build failed is rebuilt.
 * - Otherwise the course is saved and the background build starts (src/inngest/build-course.ts).
 * - A single video without captions is refused here, before anything is saved.
 *
 * Throws YouTubeError with a message the learner can act on.
 */
export async function startCourse(
  input: string,
  userId: string
): Promise<{ slug: string; reused: boolean }> {
  const source = parseYouTubeUrl(input)
  if (!source)
    throw new YouTubeError(
      "That doesn't look like a YouTube video or playlist link."
    )
  const sourceId = source.kind === "video" ? source.videoId : source.playlistId

  const [existing] = await db
    .select({ id: courses.id, slug: courses.slug, status: courses.status })
    .from(courses)
    .where(
      and(eq(courses.sourceType, source.kind), eq(courses.sourceId, sourceId))
    )
  if (existing) {
    await enroll(userId, existing.id)
    if (existing.status === "failed") {
      await db
        .update(courses)
        .set({ status: "queued", progress: 0, error: null })
        .where(eq(courses.id, existing.id))
      await inngest.send({
        name: BUILD_COURSE,
        data: { courseId: existing.id },
      })
    }
    return { slug: existing.slug, reused: existing.status !== "failed" }
  }

  const found = await fetchCourseSource(source)

  // One video: check for captions now, so the learner hears "no captions" straight away.
  // The captions are kept, so the build doesn't fetch them again.
  if (source.kind === "video") {
    const transcript = await fetchTranscript(source.videoId)
    if (!transcript) {
      throw new YouTubeError(
        "This video has no captions, so Mentora can't build a course from it. Try another video."
      )
    }
    await saveVideos(found.videos)
    await db
      .insert(videoTranscripts)
      .values({ videoId: source.videoId, lines: transcript.lines })
      .onConflictDoNothing()
  } else {
    await saveVideos(found.videos)
  }

  const [course] = await db
    .insert(courses)
    .values({
      slug: makeSlug(found.title),
      title: found.title,
      sourceType: found.kind,
      sourceId: found.sourceId,
      sourceUrl: found.url,
      totalSeconds: found.totalSeconds,
      createdBy: userId,
    })
    .returning({ id: courses.id, slug: courses.slug })
  await db.insert(courseVideos).values(
    found.videos.map((v, i) => ({
      courseId: course.id,
      videoId: v.id,
      position: i,
    }))
  )
  await enroll(userId, course.id)

  await inngest.send({ name: BUILD_COURSE, data: { courseId: course.id } })
  return { slug: course.slug, reused: false }
}

async function saveVideos(
  list: Awaited<ReturnType<typeof fetchCourseSource>>["videos"]
) {
  for (const v of list) {
    const row = {
      id: v.id,
      title: v.title,
      channelTitle: v.channelTitle,
      durationSeconds: v.durationSeconds,
      chapters: v.chapters,
      thumbnailUrl: v.thumbnailUrl,
    }
    await db
      .insert(videos)
      .values(row)
      .onConflictDoUpdate({ target: videos.id, set: row })
  }
}

function enroll(userId: string, courseId: string) {
  return db
    .insert(enrollments)
    .values({ userId, courseId })
    .onConflictDoNothing()
}
