/**
 * Self-check for the Nemotron client's backup chain (src/lib/ai.ts), against the real Nebius API.
 * Each case is one tiny request (a fraction of a cent).
 *
 *   npx tsx --env-file=.env.local src/lib/ai.check.ts
 *
 * It pretends models have been retired by swapping their ids for ones Nebius doesn't serve,
 * exactly what a real retirement looks like (Nebius answers 404 "model_not_found").
 */
import assert from "node:assert/strict"

import { MODELS, nemotronJson } from "./ai"

const ask = () =>
  nemotronJson({
    job: "plan", // chain: ultra → super
    system: 'Reply with JSON {"ok": true}.',
    user: "ping",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["ok"],
      properties: { ok: { type: "boolean" } },
    },
    validate: (json) => json as { ok: boolean },
    maxTokens: 50,
  })

// MODELS is read-only in types; this check swaps ids at runtime only, then puts them back.
const models = MODELS as Record<string, string>
const real = { ...models }
const RETIRED = "nvidia/model-retired-for-this-test"

try {
  // 1. Normal: the main model answers.
  const normal = await ask()
  assert.equal(normal.model, "ultra")
  console.log(`1. normal call                → answered by ${normal.model}`)

  // 2. The main model is retired: the chain should skip straight to the backup.
  models.ultra = RETIRED
  const fellBack = await ask()
  assert.equal(fellBack.model, "super")
  console.log(`2. main model retired         → fell back to ${fellBack.model}`)

  // 3. Every model in the chain is retired: a clear error, not a hang.
  models.super = RETIRED
  const started = Date.now()
  await assert.rejects(ask, /not available/)
  console.log(
    `3. every model retired        → clear error after ${((Date.now() - started) / 1000).toFixed(1)}s`
  )

  console.log("ai.check: backup chain ok")
} finally {
  Object.assign(models, real)
}
