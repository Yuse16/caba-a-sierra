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
const assignment = 'globalThis.__RSC_MANIFEST["/page"] = '
const start = manifestSource.indexOf(assignment)
if (start === -1) throw new Error("No se encontró el manifiesto cliente de la página pública.")
const publicManifest = JSON.parse(manifestSource.slice(start + assignment.length, manifestSource.lastIndexOf(";")))
const publicChunks = new Set(publicManifest.entryJSFiles["[project]/app/page"] ?? [])

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
