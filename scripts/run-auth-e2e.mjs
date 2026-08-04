import { execFileSync, spawnSync } from "node:child_process"

function parseEnv(output) {
  return Object.fromEntries(
    output
      .split("\n")
      .map((line) => line.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|(.*))$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2] ?? match[3] ?? ""]),
  )
}

let local
try {
  local = parseEnv(execFileSync("pnpm", ["exec", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }))
} catch {
  console.error("La suite F2 requiere Supabase local activo. Ejecuta: pnpm exec supabase start")
  process.exit(1)
}

const required = ["API_URL", "PUBLISHABLE_KEY", "SERVICE_ROLE_KEY", "MAILPIT_URL"]
const missing = required.filter((name) => !local[name])
if (missing.length) {
  console.error(`Supabase local no reportó: ${missing.join(", ")}`)
  process.exit(1)
}

const forwardedArgs = process.argv.slice(2).filter((argument) => argument !== "--")
const result = spawnSync("pnpm", ["exec", "playwright", "test", "--config=playwright.auth.config.ts", ...forwardedArgs], {
  stdio: "inherit",
  env: {
    ...process.env,
    E2E_AUTH_REQUIRED: "1",
    NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY ?? local.PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY,
    E2E_MAILPIT_URL: local.MAILPIT_URL,
    NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
  },
})

process.exit(result.status ?? 1)
