import { spawnSync } from "node:child_process"

const required = [
  "STAGING_PREVIEW_URL",
  "STAGING_ADMIN_EMAIL",
  "STAGING_ADMIN_PASSWORD",
  "STAGING_EDITOR_EMAIL",
  "STAGING_EDITOR_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]

const missing = required.filter((name) => !process.env[name]?.trim())
if (missing.length) {
  console.error(`Faltan variables de staging: ${missing.join(", ")}`)
  process.exit(1)
}

const forwardedArgs = process.argv.slice(2).filter((argument) => argument !== "--")
const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "--config=playwright.staging.config.ts", ...forwardedArgs],
  { stdio: "inherit", env: process.env },
)

process.exit(result.status ?? 1)
