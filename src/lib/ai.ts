/**
 * NVIDIA Nemotron on Nebius Token Factory. Its API is OpenAI-compatible, so one `fetch` to
 * /v1/chat/completions reaches every model; no SDK needed.
 *
 * Every call asks for JSON that matches a schema ("strict" json_schema): Nebius enforces the shape
 * while the model writes, so we never get a half-formed answer. Our own `validate` then checks
 * the meaning (timestamps inside the video, enough questions…). If a model is busy, slow, or its
 * answer fails validation, we wait and retry, then move down a chain of backup models, so a
 * learner gets a lesson instead of an error.
 */

/**
 * Models live on Nebius (checked 27 Nov 2026 with GET /v1/models). Change ids here only.
 * None of these is on a Nebius deprecation notice. Retiring on 24 Dec 2026, so NOT used here:
 * nvidia/nemotron-3-super-120b-a12b (replacement: 3.5 Super VL) and
 * nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B (replacement: 3.5 Lightning).
 * Notices: https://docs.tokenfactory.nebius.com/model-deprecations-december-2026
 */
export const MODELS = {
  ultra: "nvidia/Nemotron-3-Ultra-550b-a55b", // biggest: best reasoning over long transcripts
  super: "nvidia/Nemotron-3.5-Super-VL", // strong and fast: first backup
  lightning: "nvidia/Nemotron-3_5-Lightning", // smallest and cheapest: last backup
} as const
export type ModelName = keyof typeof MODELS

/** Which models each job tries, in order. */
export const CHAINS = {
  plan: ["ultra", "super"],
  lesson: ["ultra", "super", "lightning"],
  placement: ["ultra", "super"],
} satisfies Record<string, ModelName[]>
export type Job = keyof typeof CHAINS

export type Usage = { input: number; output: number }
export type Schema = Record<string, unknown>

const ENDPOINT = "https://api.tokenfactory.nebius.com/v1/chat/completions"
const BUSY = new Set([408, 429, 500, 502, 503, 504, 529])
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Worth retrying: busy, timed out, or an answer that failed our checks. */
class Retryable extends Error {}
class TimedOut extends Retryable {}
/** The model id isn't served (retired or renamed). Retrying won't help: go to the next model. */
class ModelGone extends Retryable {}

/** Thrown by a `validate` function when an answer is well-formed JSON but not usable. */
export class BadAnswer extends Error {}

async function callOnce(
  model: ModelName,
  system: string,
  user: string,
  schema: Schema,
  maxTokens: number,
  timeoutMs: number
): Promise<{ json: unknown; usage: Usage }> {
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEBIUS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELS[model],
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "answer", strict: true, schema },
        },
        temperature: 0.3,
        max_tokens: maxTokens,
        // "Thinking" can turn a 5 s call into 60 s. Our prompts are specific enough without it.
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw new TimedOut(
      `${model} timed out or was unreachable: ${(error as Error).message}`
    )
  }
  if (BUSY.has(res.status)) throw new Retryable(`${model} busy (${res.status})`)
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300)
    // A retired model returns an error, not "busy", and Nebius doesn't reroute it. Treat an
    // unknown-model error as "this model is gone" so the chain moves on instead of failing.
    if (res.status === 404 || (res.status === 400 && /model/i.test(body))) {
      throw new ModelGone(`${model} is not available (${res.status}): ${body}`)
    }
    throw new Error(`Nebius ${res.status}: ${body}`)
  }

  const data = await res.json()
  const text: string = data.choices?.[0]?.message?.content ?? ""
  const finish = data.choices?.[0]?.finish_reason
  const body = text.replace(/<think>[\s\S]*?<\/think>/g, "")
  const from = body.indexOf("{")
  const to = body.lastIndexOf("}")
  if (from < 0 || to < from)
    throw new Retryable(`${model} returned no JSON (finish: ${finish})`)
  try {
    return {
      json: JSON.parse(body.slice(from, to + 1)),
      usage: {
        input: data.usage?.prompt_tokens ?? 0,
        output: data.usage?.completion_tokens ?? 0,
      },
    }
  } catch {
    throw new Retryable(`${model} returned broken JSON (finish: ${finish})`)
  }
}

/**
 * Ask Nemotron for JSON matching `schema`, checked by `validate`. Tries each model in the job's
 * chain, up to 3 times each (waiting 2 s, then 6 s), within a 4-minute budget.
 */
export async function nemotronJson<T>({
  job,
  system,
  user,
  schema,
  validate,
  maxTokens = 4000,
}: {
  job: Job
  system: string
  user: string
  schema: Schema
  /** Turns the parsed JSON into T, or throws BadAnswer if it isn't usable. */
  validate: (json: unknown) => T
  maxTokens?: number
}): Promise<{ data: T; model: ModelName; usage: Usage }> {
  if (!process.env.NEBIUS_API_KEY)
    throw new Error("NEBIUS_API_KEY is missing. Add it to .env.local.")
  const deadline = Date.now() + 240_000
  let last: Error = new Error("No model answered")

  for (const model of CHAINS[job] as ModelName[]) {
    for (const wait of [0, 2000, 6000]) {
      const left = deadline - Date.now() - wait
      if (left < 15_000) throw last
      await sleep(wait)
      try {
        const { json, usage } = await callOnce(
          model,
          system,
          user,
          schema,
          maxTokens,
          Math.min(120_000, left)
        )
        return { data: validate(json), model, usage }
      } catch (error) {
        if (!(error instanceof Retryable || error instanceof BadAnswer))
          throw error
        last = error
        console.warn(`[nemotron] ${job}: ${error.message}`)
        // A slow model won't get faster, and a retired one won't come back: next model.
        if (error instanceof TimedOut || error instanceof ModelGone) break
      }
    }
  }
  throw last
}
