import type { Chapter } from "@/db/schema"
import type { CourseSource, VideoMeta, YouTubeSource } from "@/types/youtube"

/** Limits for one course. Kept small for the hackathon: a course builds in about a minute. */
export const LIMITS = {
  /** Longest total course, in seconds (3 hours). */
  maxTotalSeconds: 3 * 60 * 60,
  /** Most videos taken from one playlist. */
  maxPlaylistVideos: 30,
  /** Shortest video worth a lesson. */
  minVideoSeconds: 60,
}

/** A problem a learner can fix (bad link, private video…). Its message is shown as-is. */
export class YouTubeError extends Error {}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,64}$/
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
])

/**
 * Reads every common YouTube link shape. Returns null when it isn't one.
 *
 *   youtube.com/watch?v=ID           youtu.be/ID
 *   youtube.com/shorts/ID            youtube.com/embed/ID, /live/ID, /v/ID
 *   youtube.com/playlist?list=ID     youtube.com/watch?v=ID&list=ID  (a video inside a playlist)
 *
 * A video opened from a playlist becomes the whole playlist, because that's usually what
 * someone means when they paste it. Two kinds of list are skipped: YouTube's auto-generated
 * "Mix" lists (ids starting RD) and private lists like Watch Later (WL) and Liked (LL).
 */
export function parseYouTubeUrl(input: string): YouTubeSource | null {
  const text = input.trim()
  if (!text) return null
  let url: URL
  try {
    url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()

  let videoId: string | null = null
  if (host === "youtu.be" || host === "www.youtu.be") {
    videoId = url.pathname.split("/")[1] ?? null
  } else if (HOSTS.has(host)) {
    const [, first, second] = url.pathname.split("/")
    if (first === "watch") videoId = url.searchParams.get("v")
    else if (["shorts", "embed", "live", "v"].includes(first ?? ""))
      videoId = second ?? null
    else if (first !== "playlist") return null
  } else {
    return null
  }

  const list = url.searchParams.get("list")
  const usableList =
    list &&
    PLAYLIST_ID.test(list) &&
    !list.startsWith("RD") &&
    !["WL", "LL"].includes(list)

  if (usableList) {
    return {
      kind: "playlist",
      playlistId: list,
      url: `https://www.youtube.com/playlist?list=${list}`,
    }
  }
  if (videoId && VIDEO_ID.test(videoId)) {
    return {
      kind: "video",
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    }
  }
  return null
}

/** "PT1H2M3S" (the API's ISO 8601 duration) to seconds: 3723. Also handles days ("P1DT2H"). */
export function parseDuration(iso: string): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso)
  if (!m) return 0
  const [, d = "0", h = "0", min = "0", s = "0"] = m
  return Number(d) * 86400 + Number(h) * 3600 + Number(min) * 60 + Number(s)
}

/** "1:02:03" or "12:30" to seconds. */
function toSeconds(stamp: string) {
  return stamp
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0)
}

/**
 * Chapters from a video description, the way YouTube itself reads them: lines with a timestamp
 * ("0:00 Intro", "(12:30) Attention", "1:02:03 - Wrap up"). Following YouTube's rules, they only
 * count if the first is at 0:00, there are at least three, and each is at least 10 seconds long.
 * Otherwise returns [] and lessons are planned from the captions alone.
 */
export function parseChapters(
  description: string,
  durationSeconds: number
): Chapter[] {
  const chapters: Chapter[] = []
  for (const line of description.split("\n")) {
    const m =
      /^\s*[[(]?((?:\d{1,2}:)?\d{1,2}:\d{2})[\])]?\s*[-–—:|.]?\s*(.+?)\s*$/.exec(
        line
      )
    if (!m) continue
    const startSeconds = toSeconds(m[1])
    const title = m[2].replace(/^[-–—:|.\s]+/, "").trim()
    if (!title || startSeconds >= durationSeconds) continue
    chapters.push({ title, startSeconds })
  }
  if (chapters.length < 3 || chapters[0].startSeconds !== 0) return []
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].startSeconds - chapters[i - 1].startSeconds < 10) return []
  }
  const last = chapters[chapters.length - 1]
  if (durationSeconds - last.startSeconds < 10) return []
  return chapters
}

// ---------------------------------------------------------------------------------------------
// YouTube Data API v3. Docs: https://developers.google.com/youtube/v3/docs
// ---------------------------------------------------------------------------------------------

type Thumbs = Record<string, { url: string } | undefined>
type ApiVideo = {
  id: string
  snippet: {
    title: string
    channelTitle: string
    description: string
    liveBroadcastContent: string
    thumbnails: Thumbs
  }
  contentDetails: { duration: string }
  status: { privacyStatus: string; embeddable: boolean }
}

async function api<T>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new Error("YOUTUBE_API_KEY is missing. Add it to .env.local.")
  const qs = new URLSearchParams({ ...params, key })
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/${path}?${qs}`,
    {
      cache: "no-store",
    }
  )
  if (res.status === 404)
    throw new YouTubeError("YouTube couldn't find that link.")
  if (!res.ok) {
    // 403 is usually the daily quota or a bad key: our problem, not the learner's.
    throw new Error(
      `YouTube API ${res.status}: ${(await res.text()).slice(0, 300)}`
    )
  }
  return res.json() as Promise<T>
}

const bestThumb = (t: Thumbs) =>
  (t.maxres ?? t.standard ?? t.high ?? t.medium ?? t.default)?.url ?? null

/** Details for up to any number of videos, 50 per request (the API's maximum). Keeps input order. */
export async function fetchVideos(ids: string[]): Promise<{
  videos: VideoMeta[]
  skipped: CourseSource["skipped"]
}> {
  const found = new Map<string, ApiVideo>()
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const data = await api<{ items: ApiVideo[] }>("videos", {
      part: "snippet,contentDetails,status",
      id: batch.join(","),
      maxResults: "50",
    })
    for (const v of data.items) found.set(v.id, v)
  }

  const videos: VideoMeta[] = []
  const skipped: CourseSource["skipped"] = []
  for (const id of ids) {
    const v = found.get(id)
    if (!v) skipped.push({ id, reason: "removed or private" })
    else if (v.status.privacyStatus === "private")
      skipped.push({ id, reason: "private" })
    else if (!v.status.embeddable)
      skipped.push({ id, reason: "can't be played outside YouTube" })
    else if (v.snippet.liveBroadcastContent !== "none")
      skipped.push({ id, reason: "a live stream" })
    else {
      const durationSeconds = parseDuration(v.contentDetails.duration)
      if (durationSeconds < LIMITS.minVideoSeconds) {
        skipped.push({ id, reason: "shorter than a minute" })
        continue
      }
      videos.push({
        id,
        title: v.snippet.title,
        channelTitle: v.snippet.channelTitle,
        durationSeconds,
        chapters: parseChapters(v.snippet.description, durationSeconds),
        thumbnailUrl: bestThumb(v.snippet.thumbnails),
      })
    }
  }
  return { videos, skipped }
}

/** A playlist's title and video ids, in order, up to LIMITS.maxPlaylistVideos. */
export async function fetchPlaylist(playlistId: string) {
  const meta = await api<{ items: { snippet: { title: string } }[] }>(
    "playlists",
    {
      part: "snippet",
      id: playlistId,
    }
  )
  if (!meta.items.length)
    throw new YouTubeError("That playlist is private or doesn't exist.")

  const ids: string[] = []
  let pageToken: string | undefined
  do {
    const page = await api<{
      items: { contentDetails: { videoId: string } }[]
      nextPageToken?: string
    }>("playlistItems", {
      part: "contentDetails",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    })
    for (const item of page.items) ids.push(item.contentDetails.videoId)
    pageToken = page.nextPageToken
  } while (pageToken && ids.length < LIMITS.maxPlaylistVideos)

  return {
    title: meta.items[0].snippet.title,
    videoIds: ids.slice(0, LIMITS.maxPlaylistVideos),
  }
}

/**
 * Everything a course needs from YouTube, with the course limits applied. Throws YouTubeError
 * (a message for the learner) when the link can't become a course.
 */
export async function fetchCourseSource(
  source: YouTubeSource
): Promise<CourseSource> {
  if (source.kind === "video") {
    const { videos, skipped } = await fetchVideos([source.videoId])
    if (!videos.length) {
      throw new YouTubeError(
        `That video can't be used: it's ${skipped[0]?.reason ?? "unavailable"}.`
      )
    }
    const [video] = videos
    if (video.durationSeconds > LIMITS.maxTotalSeconds) {
      throw new YouTubeError(
        "That video is over 3 hours. Try a shorter one, or a playlist of parts."
      )
    }
    return {
      kind: "video",
      sourceId: source.videoId,
      url: source.url,
      title: video.title,
      videos,
      totalSeconds: video.durationSeconds,
      skipped,
    }
  }

  const playlist = await fetchPlaylist(source.playlistId)
  const { videos: all, skipped } = await fetchVideos(playlist.videoIds)
  // Keep videos in order until the course would pass the length limit, then stop: taking a
  // shorter video from further on would leave a gap in the middle of the course.
  const videos: VideoMeta[] = []
  let totalSeconds = 0
  for (const [i, v] of all.entries()) {
    if (totalSeconds + v.durationSeconds > LIMITS.maxTotalSeconds) {
      for (const rest of all.slice(i)) {
        skipped.push({ id: rest.id, reason: "past the 3-hour course limit" })
      }
      break
    }
    videos.push(v)
    totalSeconds += v.durationSeconds
  }
  if (!videos.length)
    throw new YouTubeError("None of the videos in that playlist can be used.")
  return {
    kind: "playlist",
    sourceId: source.playlistId,
    url: source.url,
    title: playlist.title,
    videos,
    totalSeconds,
    skipped,
  }
}

/** The creator behind a video, for the lesson page's creator card. */
export type Channel = {
  title: string
  avatarUrl: string | null
  /** null when the channel hides its subscriber count. */
  subscribers: number | null
  url: string
}

/**
 * Looks up a video's channel: name, avatar and subscriber count. Cached for a day per video, so
 * lesson pages don't spend API quota on every visit. Null if YouTube can't be reached.
 */
export async function fetchChannelForVideo(
  videoId: string
): Promise<Channel | null> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return null
  const get = async <T>(path: string, params: Record<string, string>) => {
    const qs = new URLSearchParams({ ...params, key })
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/${path}?${qs}`,
      { next: { revalidate: 86_400 } }
    )
    return res.ok ? ((await res.json()) as T) : null
  }
  try {
    const video = await get<{ items?: { snippet: { channelId: string } }[] }>(
      "videos",
      { part: "snippet", id: videoId, fields: "items(snippet(channelId))" }
    )
    const channelId = video?.items?.[0]?.snippet.channelId
    if (!channelId) return null
    const channel = await get<{
      items?: {
        snippet: {
          title: string
          customUrl?: string
          thumbnails: Record<string, { url: string }>
        }
        statistics: {
          subscriberCount?: string
          hiddenSubscriberCount?: boolean
        }
      }[]
    }>("channels", { part: "snippet,statistics", id: channelId })
    const c = channel?.items?.[0]
    if (!c) return null
    const t = c.snippet.thumbnails
    return {
      title: c.snippet.title,
      avatarUrl: (t.medium ?? t.default ?? t.high)?.url ?? null,
      subscribers:
        c.statistics.hiddenSubscriberCount || !c.statistics.subscriberCount
          ? null
          : Number(c.statistics.subscriberCount),
      url: c.snippet.customUrl
        ? `https://www.youtube.com/${c.snippet.customUrl}`
        : `https://www.youtube.com/channel/${channelId}`,
    }
  } catch {
    return null
  }
}
