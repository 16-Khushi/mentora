import { existsSync } from "node:fs"

import { defineConfig } from "drizzle-kit"

// Reads DATABASE_URL from .env.local when it exists. `db:generate` works without it (it only reads
// the schema); `db:migrate` and `db:studio` need it.
if (existsSync(".env.local")) process.loadEnvFile(".env.local")

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
})
