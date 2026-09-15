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

function required(values, names, context) {
  const missing = names.filter((name) => !values[name]?.trim())
  if (missing.length) {
    console.error(`${context}: faltan ${missing.join(", ")}.`)
    process.exit(1)
  }
}

function normalizedUrl(value, name) {
  try {
    const url = new URL(value)
    url.pathname = url.pathname.replace(/\/$/, "")
    return url.toString().replace(/\/$/, "")
  } catch {
    console.error(`${name} no contiene una URL válida.`)
    process.exit(1)
  }
}

const requestedTarget = process.env.GALLERY_E2E_TARGET?.trim() || "local"
if (requestedTarget !== "local" && requestedTarget !== "staging") {
  console.error("GALLERY_E2E_TARGET sólo acepta local o staging.")
  process.exit(1)
}

let suiteEnv
if (requestedTarget === "local") {
  let local
  try {
    local = parseEnv(execFileSync("pnpm", ["exec", "supabase", "status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }))
  } catch {
    console.error("La regresión de galería requiere Supabase local activo. Ejecuta: pnpm exec supabase start")
    process.exit(1)
  }
  required(local, ["API_URL", "SERVICE_ROLE_KEY"], "Supabase local")
  const localApiURL = normalizedUrl(local.API_URL, "API_URL de Supabase local")
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(localApiURL).hostname)) {
    console.error("GALLERY_E2E_TARGET=local se negó a usar un Supabase que no es loopback.")
    process.exit(1)
  }
  const publishableKey = local.ANON_KEY ?? local.PUBLISHABLE_KEY
  if (!publishableKey) {
    console.error("Supabase local no reportó ANON_KEY ni PUBLISHABLE_KEY.")
    process.exit(1)
  }
  suiteEnv = {
    ...process.env,
    GALLERY_E2E_TARGET: "local",
    GALLERY_E2E_BASE_URL: "http://localhost:3100",
    GALLERY_E2E_REQUIRED: "1",
    NEXT_PUBLIC_SUPABASE_URL: localApiURL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
    SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
  }
} else {
  required(process.env, [
    "GALLERY_E2E_BASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GALLERY_E2E_CONFIRM_NON_PRODUCTION",
    "GALLERY_E2E_PRODUCTION_URL",
    "GALLERY_E2E_PRODUCTION_SUPABASE_URL",
  ], "Staging")
  if (process.env.GALLERY_E2E_CONFIRM_NON_PRODUCTION !== "1") {
    console.error("Staging requiere GALLERY_E2E_CONFIRM_NON_PRODUCTION=1; la suite crea y elimina datos.")
    process.exit(1)
  }
  const baseURL = normalizedUrl(process.env.GALLERY_E2E_BASE_URL, "GALLERY_E2E_BASE_URL")
  if (!baseURL.startsWith("https://")) {
    console.error("El staging remoto debe usar HTTPS.")
    process.exit(1)
  }
  const productionURL = normalizedUrl(process.env.GALLERY_E2E_PRODUCTION_URL, "GALLERY_E2E_PRODUCTION_URL")
  if (new URL(baseURL).origin === new URL(productionURL).origin) {
    console.error("La suite destructiva de galería se negó a ejecutarse contra GALLERY_E2E_PRODUCTION_URL.")
    process.exit(1)
  }
  const stagingSupabaseURL = normalizedUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL")
  const productionSupabaseURL = normalizedUrl(process.env.GALLERY_E2E_PRODUCTION_SUPABASE_URL, "GALLERY_E2E_PRODUCTION_SUPABASE_URL")
  if (new URL(stagingSupabaseURL).origin === new URL(productionSupabaseURL).origin) {
    console.error("La suite se negó a escribir en el proyecto Supabase de producción.")
    process.exit(1)
  }
  suiteEnv = {
    ...process.env,
    GALLERY_E2E_TARGET: "staging",
    GALLERY_E2E_BASE_URL: baseURL,
    GALLERY_E2E_REQUIRED: "1",
  }
}

const forwardedArgs = process.argv.slice(2).filter((argument) => argument !== "--")
const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "--config=playwright.gallery.config.ts", ...forwardedArgs],
  { stdio: "inherit", env: suiteEnv },
)

process.exit(result.status ?? 1)
