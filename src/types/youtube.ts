import type { Chapter } from "@/db/schema"

/** What a pasted link points at, after parsing. Nothing has been fetched yet. */
export type YouTubeSource =
  | { kind: "video"; videoId: string; url: string }
  | { kind: "playlist"; playlistId: string; url: string }

/** One video's details from the YouTube Data API. */
export type VideoMeta = {
  id: string
  title: string
  channelTitle: string
  durationSeconds: number
  chapters: Chapter[]
  thumbnailUrl: string | null
}

/** Everything a course is built from: its title and its videos, in order. */
export type CourseSource = {
  kind: YouTubeSource["kind"]
  /** The video or playlist id: one course per source (see the unique index on course). */
  sourceId: string
  url: string
  title: string
  videos: VideoMeta[]
  totalSeconds: number
  /** Videos left out (private, live, too long…), so the UI can say why. */
  skipped: { id: string; reason: string }[]
}
