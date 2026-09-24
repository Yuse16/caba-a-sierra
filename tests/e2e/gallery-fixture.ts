import fs from "node:fs/promises"
import path from "node:path"
import type { SupabaseClient } from "@supabase/supabase-js"

export const galleryFixturePath = path.join(process.cwd(), "test-results", "gallery-fixture.json")
export type GalleryFixture = {
  runId: string
  admin: { id: string; email: string; password: string }
  cabinName: string
  images: Record<"a" | "b" | "c" | "d", { name: string; path: string }>
  initialImages: Array<{ name: string; path: string }>
  additionalImages: Array<{ name: string; path: string }>
  cabinId?: string
  cabinUrl?: string
  alternativeCabinId?: string
}
export async function readGalleryFixture(): Promise<GalleryFixture> {
  return JSON.parse(await fs.readFile(galleryFixturePath, "utf8")) as GalleryFixture
}
export async function writeGalleryFixture(fixture: GalleryFixture) {
  await fs.mkdir(path.dirname(galleryFixturePath), { recursive: true })
  await fs.writeFile(galleryFixturePath, JSON.stringify(fixture), { mode: 0o600 })
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function galleryCustomerPhone(runId: string) {
  const suffix = (Number.parseInt(runId.replaceAll("-", "").slice(0, 12), 16) % 10_000_000).toString().padStart(7, "0")
  return `844${suffix}`
}

// Preflight the entire run before the first delete. A foreign reference aborts
// cleanup and preserves the QA identity/manifest for a safe retry.
export async function cleanupGalleryRun(supabase: SupabaseClient, adminId: string, runId: string) {
  if (!uuid.test(runId) || !uuid.test(adminId)) throw new Error("Identidad E2E no canónica.")
  const refuse = (reason: string): never => { throw new Error(`Cleanup E2E rechazado: ${reason}`) }
  const load = async (table: string, filters: Record<string, string | string[]>) => {
    const rows: Record<string, unknown>[] = []
    for (let offset = 0; ; offset += 500) {
      let query = supabase.from(table).select("*")
      for (const [column, value] of Object.entries(filters)) query = Array.isArray(value) ? query.in(column, value) : query.eq(column, value)
      const { data, error } = await query.order("id").range(offset, offset + 499)
      if (error) throw error
      rows.push(...(data ?? []))
      if ((data?.length ?? 0) < 500) return rows
    }
  }
  // The alternative cabin is inserted with the service_role client, so the
  // force_created_updated_by() trigger stamps created_by = auth.uid() = NULL.
  // Identify run cabins by actor OR by their runId-unique names, merged by id,
  // so service_role-created fixtures are never orphaned. Every fail-closed
  // check below still validates the merged set before any delete.
  const expectedCabinNames = [`E2E Galería multifoto ${runId}`, `E2E Alternativa ${runId}`]
  const cabinMap = new Map<string, Record<string, unknown>>()
  for (const cabin of [...await load("cabins", { created_by: adminId }), ...await load("cabins", { name: expectedCabinNames })]) cabinMap.set(String(cabin.id), cabin)
  const cabins = [...cabinMap.values()]
  const owners = await load("owners", { created_by: adminId })
  const assets = await load("media_assets", { uploaded_by: adminId })
  const customers = await load("customers", { name: `E2E Cliente ${runId}` })
  for (const cabin of cabins) if (!expectedCabinNames.includes(String(cabin.name))) refuse("cabaña ajena")
  for (const owner of owners) if (owner.name !== `Propietario privado ${runId}`) refuse("propietario ajeno")
  for (const customer of customers) if (customer.phone_e164 !== `+52${galleryCustomerPhone(runId)}`) refuse("cliente ajeno")
  for (const asset of assets) {
    if (!new RegExp(`^foto-(?:[abcd]|lote-\\d{2})-${runId}\\.png$`).test(String(asset.original_name))) refuse("asset ajeno")
    if (asset.source_bucket !== "admin-media" || !String(asset.source_path).startsWith(`${adminId}/cabins/staging/${asset.id}.`)) refuse("ruta privada ajena")
    if (asset.public_path && (asset.public_bucket !== "public-media" || !String(asset.public_path).startsWith(`${adminId}/cabins/${asset.id}.`))) refuse("ruta pública ajena")
  }
  const ids = (rows: Record<string, unknown>[]) => rows.map(row => String(row.id))
  const cabinIds = ids(cabins), customerIds = ids(customers), assetIds = ids(assets), ownerIds = ids(owners)
  const related = async (table: string, column: string, values: string[]) => values.length ? load(table, { [column]: values }) : []
  const inquiryMap = new Map<string, Record<string, unknown>>()
  for (const row of [...await related("booking_inquiries", "cabin_id", cabinIds), ...await related("booking_inquiries", "customer_id", customerIds)]) inquiryMap.set(String(row.id), row)
  const inquiries = [...inquiryMap.values()], inquiryIds = ids(inquiries)
  for (const inquiry of inquiries) {
    if (!cabinIds.includes(String(inquiry.cabin_id)) || !customerIds.includes(String(inquiry.customer_id)) || !String(inquiry.message).includes(runId)) refuse("solicitud ajena")
  }
  if ((await related("reservations", "cabin_id", cabinIds)).length || (await related("reservations", "customer_id", customerIds)).length) refuse("reservación existente")
  for (const image of await related("cabin_images", "asset_id", assetIds)) if (!cabinIds.includes(String(image.cabin_id))) refuse("asset compartido con cabaña ajena")
  for (const image of await related("cabin_images", "cabin_id", cabinIds)) if (!assetIds.includes(String(image.asset_id))) refuse("imagen ajena")
  for (const assignment of await related("cabin_owner_assignments", "owner_id", ownerIds)) if (!cabinIds.includes(String(assignment.cabin_id))) refuse("propietario compartido")
  for (const assignment of await related("cabin_owner_assignments", "cabin_id", cabinIds)) if (!ownerIds.includes(String(assignment.owner_id))) refuse("asignación ajena")
  const notes = new Map<string, Record<string, unknown>>()
  for (const [column, values] of [["customer_id", customerIds], ["inquiry_id", inquiryIds], ["cabin_id", cabinIds], ["owner_id", ownerIds]] as const) {
    for (const note of await related("internal_notes", column, values)) {
      if (note.author_id !== adminId) refuse("nota de otro autor")
      notes.set(String(note.id), note)
    }
  }
  const events = await related("inquiry_events", "inquiry_id", inquiryIds)
  for (const event of events) if (event.actor_id !== null && event.actor_id !== adminId) refuse("evento de otro actor")
  const remove = async (table: string, column: string, values: string[]) => {
    if (!values.length) return
    const { error } = await supabase.from(table).delete().in(column, values)
    if (error) throw error
  }
  await remove("inquiry_events", "inquiry_id", inquiryIds)
  await remove("internal_notes", "id", [...notes.keys()])
  await remove("booking_inquiries", "id", inquiryIds)
  await remove("customers", "id", customerIds)
  for (const table of ["cabin_images", "cabin_services", "cabin_categories", "cabin_owner_assignments"]) await remove(table, "cabin_id", cabinIds)
  await remove("cabins", "id", cabinIds)
  await remove("owners", "id", ownerIds)
  for (const asset of assets) {
    for (const [bucket, objectPath] of [[asset.source_bucket, asset.source_path], [asset.public_bucket, asset.public_path]]) {
      if (!bucket || !objectPath) continue
      const { error } = await supabase.storage.from(String(bucket)).remove([String(objectPath)])
      if (error) throw error
    }
    await remove("media_assets", "id", [String(asset.id)])
  }
}
