import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const maxAgeHours = Number.parseInt(process.env.MEDIA_STAGING_MAX_AGE_HOURS ?? "24", 10)

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.")
  process.exit(1)
}
if (!Number.isFinite(maxAgeHours) || maxAgeHours < 1) {
  console.error("MEDIA_STAGING_MAX_AGE_HOURS debe ser un número entero mayor que cero.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()

const { data: assets, error: listError } = await supabase
  .from("media_assets")
  .select("id, source_bucket, source_path, public_bucket, public_path")
  .eq("processing_status", "staging")
  .is("deleted_at", null)
  .lt("updated_at", cutoff)

if (listError) {
  console.error("No se pudieron consultar los assets pendientes:", listError.message)
  process.exit(1)
}

let removedCount = 0
let preservedCount = 0
let failedCount = 0

for (const asset of assets ?? []) {
  const [cabins, promotions] = await Promise.all([
    supabase.from("cabin_images").select("id").eq("asset_id", asset.id).is("deleted_at", null).limit(1),
    supabase.from("promotion_images").select("id").eq("asset_id", asset.id).is("deleted_at", null).limit(1),
  ])

  if (cabins.error || promotions.error) {
    failedCount += 1
    console.error(`No se pudieron comprobar las referencias de ${asset.id}; se conservó.`)
    continue
  }
  if (cabins.data?.length || promotions.data?.length) {
    preservedCount += 1
    continue
  }

  await supabase.from("media_assets").update({ processing_status: "pending_delete" }).eq("id", asset.id)
  const sourceResult = await supabase.storage.from(asset.source_bucket).remove([asset.source_path])
  const publicResult = asset.public_bucket && asset.public_path
    ? await supabase.storage.from(asset.public_bucket).remove([asset.public_path])
    : { error: null }

  if (sourceResult.error || publicResult.error) {
    failedCount += 1
    console.error(`No se pudieron retirar todos los archivos de ${asset.id}; quedó pendiente para reintento.`)
    continue
  }

  const { error: updateError } = await supabase.from("media_assets").update({
    processing_status: "deleted",
    deleted_at: new Date().toISOString(),
  }).eq("id", asset.id)
  if (updateError) {
    failedCount += 1
    console.error(`Los archivos de ${asset.id} se retiraron, pero faltó actualizar su registro.`)
    continue
  }
  removedCount += 1
}

console.log(`Limpieza terminada: ${removedCount} retirados, ${preservedCount} conservados, ${failedCount} pendientes.`)
if (failedCount) process.exitCode = 1
