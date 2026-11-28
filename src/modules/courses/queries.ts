import { and, desc, eq, inArray, isNotNull } from "drizzle-orm"

import { db } from "@/db"
import {
  courses,
  courseVideos,
  enrollments,
  lessonProgress,
  lessons,
  videos,
} from "@/db/schema"
import type { CourseCard } from "@/types/course"
import { COURSE_TONES } from "@/types/design"

/** The learner's courses, newest first, with their progress. */
export async function listCourses(userId: string): Promise<CourseCard[]> {
  const list = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      status: courses.status,
      totalSeconds: courses.totalSeconds,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.createdAt))
  if (!list.length) return []
  const courseIds = list.map((c) => c.id)

  const [firstVideos, lessonRows, doneRows] = await Promise.all([
    db
      .select({
        courseId: courseVideos.courseId,
        position: courseVideos.position,
        channel: videos.channelTitle,
        thumbnailUrl: videos.thumbnailUrl,
      })
      .from(courseVideos)
      .innerJoin(videos, eq(videos.id, courseVideos.videoId))
      .where(inArray(courseVideos.courseId, courseIds)),
    db
      .select({ courseId: lessons.courseId, id: lessons.id })
      .from(lessons)
      .where(inArray(lessons.courseId, courseIds)),
    db
      .select({ courseId: lessons.courseId })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
      .where(
        and(
          eq(lessonProgress.userId, userId),
          inArray(lessons.courseId, courseIds),
          isNotNull(lessonProgress.completedAt)
        )
      ),
  ])

  const countBy = (rows: { courseId: string }[], id: string) =>
    rows.filter((r) => r.courseId === id).length
  return list.map((c, i) => {
    const first = firstVideos
      .filter((v) => v.courseId === c.id)
      .sort((a, b) => a.position - b.position)[0]
    return {
      slug: c.slug,
      title: c.title,
      channel: first?.channel ?? null,
      thumbnailUrl: first?.thumbnailUrl ?? null,
      status: c.status,
      lessons: countBy(lessonRows, c.id),
      done: countBy(doneRows, c.id),
      totalSeconds: c.totalSeconds,
      tone: COURSE_TONES[i % COURSE_TONES.length],
    }
  })
}
