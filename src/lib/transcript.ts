/**
 * A video's own captions, from Supadata (https://docs.supadata.ai), as plain lines:
 *
 *   [00:00:08] so today we're going to build a GPT
 *   [00:00:12] from scratch, in code
 *
 * Every lesson, note and quiz is written from these lines, and the timestamps are what let a
 * quiz say "replay the moment" at the exact second an idea was taught.
 *
 * We only ever ask for captions the video already has (mode=native). Supadata can also make a
 * transcript with AI, but that's slower and costs more, and the creator's own captions are better.
 */

const API = "https://api.supadata.ai/v1"

/** Our problem, not the learner's: missing key, plan limit, Supadata down. */
export class TranscriptError extends Error {}

type Chunk = { text: string; offset: number; duration: number }
type TranscriptBody = {
  content: Chunk[] | string
  lang: string
  availableLangs: string[]
}
type JobBody = {
  status: "queued" | "active" | "completed" | "failed"
  error?: { message?: string } | null
  content?: Chunk[] | string
  lang?: string
}
type ErrorBody = { error?: string; message?: string; details?: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Seconds to "HH:MM:SS". */
export function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":")
}

/** Supadata's chunks (times in milliseconds) to our "[HH:MM:SS] text" lines. */
export function chunksToLines(chunks: Chunk[]): string {
  return chunks
    .map((c) => ({
      at: c.offset / 1000,
      text: c.text.replace(/\s+/g, " ").trim(),
    }))
    .filter((c) => c.text)
    .map((c) => `[${clock(c.at)}] ${c.text}`)
    .join("\n")
}

/** The second a "[HH:MM:SS] text" line starts at, or null if it isn't one. */
export function lineSeconds(line: string): number | null {
  const m = /^\[(\d{2}):(\d{2}):(\d{2})\]/.exec(line)
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null
}

/**
 * Only the lines between two moments, for writing one lesson. Sending a lesson just its own
 * part of the video keeps each AI call small, fast and focused.
 */
export function sliceLines(
  lines: string,
  fromSeconds: number,
  toSeconds: number
): string {
  return lines
    .split("\n")
    .filter((line) => {
      const at = lineSeconds(line)
      return at !== null && at >= fromSeconds && at < toSeconds
    })
    .join("\n")
}

async function request(path: string): Promise<Response> {
  const key = process.env.SUPADATA_API_KEY
  if (!key)
    throw new TranscriptError(
      "SUPADATA_API_KEY is missing. Add it to .env.local."
    )
  return fetch(`${API}${path}`, {
    headers: { "x-api-key": key },
    cache: "no-store",
  })
}

/** Big videos come back as a job: check on it until it's done (up to about a minute). */
async function waitForJob(jobId: string): Promise<JobBody> {
  for (let i = 0; i < 40; i++) {
    await sleep(1500)
    const res = await request(`/transcript/${encodeURIComponent(jobId)}`)
    if (!res.ok)
      throw new TranscriptError(
        `Supadata job ${res.status}: ${(await res.text()).slice(0, 200)}`
      )
    const job = (await res.json()) as JobBody
    if (job.status === "completed" || job.status === "failed") return job
  }
  throw new TranscriptError("Supadata took too long to read the captions.")
}

/**
 * The video's captions as "[HH:MM:SS] text" lines, or null when it has none (the learner sees
 * "this video has no captions"). Throws TranscriptError for problems on our side.
 */
export async function fetchTranscript(
  videoId: string
): Promise<{ lines: string; lang: string } | null> {
  const params = new URLSearchParams({
    url: `https://www.youtube.com/watch?v=${videoId}`,
    lang: "en", // preferred; Supadata returns the first available language if there's no English
    mode: "native", // existing captions only, never an AI-made transcript
    chunkSize: "250", // about 12 s per line, so "replay the moment" lands close to the second
  })

  for (let attempt = 0; ; attempt++) {
    const res = await request(`/transcript?${params}`)

    if (res.status === 200 || res.status === 202) {
      const body = (await res.json()) as TranscriptBody | { jobId: string }
      const done = "jobId" in body ? await waitForJob(body.jobId) : body
      if ("status" in done && done.status === "failed") return null
      const content = done.content
      if (!Array.isArray(content) || !content.length) return null
      const lines = chunksToLines(content)
      return lines ? { lines, lang: done.lang ?? "en" } : null
    }

    // 206: the video has no captions. 404: the video doesn't exist (or isn't public).
    if (res.status === 206 || res.status === 404) return null

    const err = (await res.json().catch(() => ({}))) as ErrorBody
    const details = err.details ?? err.message ?? ""

    if (res.status === 429) {
      // Two kinds of "limit": the monthly credits are gone (waiting won't help), or we're asking
      // too fast (wait and try again).
      if (/usage limit/i.test(details)) {
        throw new TranscriptError("Supadata's monthly credits are used up.")
      }
      if (attempt < 5) {
        const wait =
          Number(res.headers.get("retry-after")) * 1000 || 1000 * 2 ** attempt
        await sleep(Math.min(wait, 10_000))
        continue
      }
    }
    // 500: a hiccup on Supadata's side (not charged): try again a couple of times.
    if (res.status >= 500 && attempt < 2) {
      await sleep(1000 * (attempt + 1))
      continue
    }
    throw new TranscriptError(
      `Supadata ${res.status}: ${details || "request failed"}`
    )
  }
}

/**
 * Captions for several videos (a playlist), started no faster than the plan allows
 * (SUPADATA_RPS requests a second, default 1). Returns each video's lines, or null if it has none.
 */
export async function fetchTranscripts(
  videoIds: string[]
): Promise<Map<string, { lines: string; lang: string } | null>> {
  const perSecond = Math.max(1, Number(process.env.SUPADATA_RPS) || 1)
  const gap = 1000 / perSecond
  const out = new Map<string, { lines: string; lang: string } | null>()
  // Start one request every `gap` ms; let them run side by side once started.
  const pending = videoIds.map(async (id, i) => {
    await sleep(i * gap)
    out.set(id, await fetchTranscript(id))
  })
  await Promise.all(pending)
  return out
}
