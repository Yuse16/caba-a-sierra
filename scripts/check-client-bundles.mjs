import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../.next/static/", import.meta.url))
const forbiddenEverywhere = [
  "Roberto Martínez", "Laura Hernández", "Miguel Salazar", "Patricia Gómez",
  "844 234 5678", "844 345 6789", "844 456 7890",
  "Prefiere recibir mensajes por WhatsApp", "Solicita mínimo dos noches",
  "Familia Hernández", "Grupo García",
]
const forbiddenOnPublicPage = [
  "pendiente-propietario",
  "propietario-contactado",
  "ownerPhone",
  "ownerWhatsApp",
  "ownerNotes",
  "agreedCommission",
]

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]))).flat()
}

const matches = []
for (const file of await files(root)) {
  if (!/\.(?:js|json|map)$/.test(file)) continue
  const content = await readFile(file, "utf8")
  for (const value of forbiddenEverywhere) if (content.includes(value)) matches.push({ file, value })
}

const manifestPath = fileURLToPath(new URL("../.next/server/app/page_client-reference-manifest.js", import.meta.url))
const manifestSource = await readFile(manifestPath, "utf8")

function parseRouteManifest(source, route) {
  const assignmentPattern = new RegExp(`globalThis\\.__RSC_MANIFEST\\[${JSON.stringify(route)}\\]\\s*=\\s*`, "g")
  const matches = [...source.matchAll(assignmentPattern)]
  const match = matches.at(-1)
  if (match?.index == null) throw new Error(`No se encontró el manifiesto cliente de ${route}.`)

  const objectStart = source.indexOf("{", match.index + match[0].length)
  if (objectStart === -1) throw new Error(`El manifiesto cliente de ${route} no contiene un objeto JSON.`)

  let depth = 0
  let inString = false
  let escaped = false
  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === "{") depth += 1
    else if (char === "}") {
      depth -= 1
      if (depth === 0) return JSON.parse(source.slice(objectStart, index + 1))
    }
  }
  throw new Error(`El manifiesto cliente de ${route} está incompleto.`)
}

function publicClientChunks(manifest) {
  const chunks = new Set(manifest.entryJSFiles?.["[project]/app/page"] ?? [])
  for (const clientModule of Object.values(manifest.clientModules ?? {})) {
    for (const chunk of clientModule?.chunks ?? []) {
      if (typeof chunk === "string" && chunk.endsWith(".js")) chunks.add(chunk)
    }
  }
  if (chunks.size === 0) throw new Error("El manifiesto público no contiene chunks JavaScript verificables.")
  return chunks
}

const publicManifest = parseRouteManifest(manifestSource, "/page")
const publicChunks = publicClientChunks(publicManifest)

for (const relativePath of publicChunks) {
  const file = join(fileURLToPath(new URL("../.next/", import.meta.url)), relativePath)
  const content = await readFile(file, "utf8")
  for (const value of forbiddenOnPublicPage) if (content.includes(value)) matches.push({ file, value })
}

if (matches.length) {
  console.error("Datos internos encontrados en bundles cliente:")
  for (const match of matches) console.error(`- ${match.value} en ${match.file}`)
  process.exitCode = 1
} else {
  console.log("Bundles cliente sin datos internos conocidos.")
}
