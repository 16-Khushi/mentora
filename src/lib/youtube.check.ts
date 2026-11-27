/**
 * Self-check for src/lib/youtube.ts. No server, no database, no API key needed.
 *
 *   npx tsx src/lib/youtube.check.ts          parsing only
 *   npx tsx --env-file=.env.local src/lib/youtube.check.ts --live [playlist-url]
 *                                             also fetches a real video, and a playlist if you pass
 *                                             its link (needs YOUTUBE_API_KEY)
 */
import assert from "node:assert/strict"

import {
  fetchCourseSource,
  parseChapters,
  parseDuration,
  parseYouTubeUrl,
} from "./youtube"

const ID = "kCc8FmEb1nY"
// A made-up id in the right format: link parsing only, never fetched.
const LIST = "PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ"

// ---- Links ----------------------------------------------------------------------------------
const video = (url: string) =>
  assert.deepEqual(
    parseYouTubeUrl(url),
    {
      kind: "video",
      videoId: ID,
      url: `https://www.youtube.com/watch?v=${ID}`,
    },
    url
  )
const playlist = (url: string) =>
  assert.deepEqual(
    parseYouTubeUrl(url),
    {
      kind: "playlist",
      playlistId: LIST,
      url: `https://www.youtube.com/playlist?list=${LIST}`,
    },
    url
  )
const nothing = (url: string) => assert.equal(parseYouTubeUrl(url), null, url)

video(`https://www.youtube.com/watch?v=${ID}`)
video(`youtube.com/watch?v=${ID}&t=42s`)
video(`https://m.youtube.com/watch?v=${ID}`)
video(`https://music.youtube.com/watch?v=${ID}`)
video(`https://youtu.be/${ID}`)
video(`https://youtu.be/${ID}?si=abc123&t=10`)
video(`https://www.youtube.com/shorts/${ID}`)
video(`https://www.youtube.com/embed/${ID}`)
video(`https://www.youtube-nocookie.com/embed/${ID}`)
video(`https://www.youtube.com/live/${ID}?feature=share`)
video(`  https://www.youtube.com/watch?v=${ID}  `)
// Auto-generated mixes and private lists fall back to the video.
video(`https://www.youtube.com/watch?v=${ID}&list=RD${ID}`)
video(`https://www.youtube.com/watch?v=${ID}&list=WL`)

playlist(`https://www.youtube.com/playlist?list=${LIST}`)
playlist(`https://www.youtube.com/watch?v=${ID}&list=${LIST}&index=3`)
playlist(`https://youtu.be/${ID}?list=${LIST}`)

nothing("")
nothing("hello")
nothing("https://vimeo.com/123456")
nothing("https://www.youtube.com/watch?v=short")
nothing("https://www.youtube.com/@karpathy")
nothing("https://youtube.com.evil.com/watch?v=" + ID)
nothing("https://www.youtube.com/playlist?list=WL")

// ---- Durations ------------------------------------------------------------------------------
assert.equal(parseDuration("PT1H2M3S"), 3723)
assert.equal(parseDuration("PT45S"), 45)
assert.equal(parseDuration("PT10M"), 600)
assert.equal(parseDuration("P1DT1H"), 90000)
assert.equal(parseDuration("garbage"), 0)

// ---- Chapters -------------------------------------------------------------------------------
const desc = `Great video!
0:00 Intro
(2:30) The setup
5:00 - Attention, explained
1:02:03 | Wrap up
Thanks for watching`
assert.deepEqual(parseChapters(desc, 4000), [
  { title: "Intro", startSeconds: 0 },
  { title: "The setup", startSeconds: 150 },
  { title: "Attention, explained", startSeconds: 300 },
  { title: "Wrap up", startSeconds: 3723 },
])
// Not at 0:00, too few, or too close together: YouTube wouldn't show them, so neither do we.
assert.deepEqual(parseChapters("1:00 A\n2:00 B\n3:00 C", 600), [])
assert.deepEqual(parseChapters("0:00 A\n2:00 B", 600), [])
assert.deepEqual(parseChapters("0:00 A\n0:05 B\n3:00 C", 600), [])

console.log("youtube.check: parsing ok")

// ---- Live (optional) ------------------------------------------------------------------------
if (process.argv.includes("--live")) {
  const v = await fetchCourseSource(parseYouTubeUrl(`https://youtu.be/${ID}`)!)
  const m = Math.round(v.totalSeconds / 60)
  console.log(
    `video: "${v.title}" by ${v.videos[0].channelTitle}, ${m} min, ${v.videos[0].chapters.length} chapters`
  )
  assert.ok(v.totalSeconds > 0)

  const playlistUrl = process.argv.find((a) => a.includes("list="))
  if (playlistUrl) {
    const p = await fetchCourseSource(parseYouTubeUrl(playlistUrl)!)
    console.log(
      `playlist: "${p.title}", ${p.videos.length} videos, ${Math.round(p.totalSeconds / 60)} min, ${p.skipped.length} left out`
    )
    assert.ok(p.videos.length > 0)
  }
  console.log("youtube.check: live ok")
}
