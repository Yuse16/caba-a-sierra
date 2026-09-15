import "server-only"

import { randomUUID } from "node:crypto"
import type { AdminCabinImage } from "@/lib/admin-cabins/types"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service.server"
import { processUploadedImage } from "./image-processing.server"
import { safeOriginalName } from "./image-validation"

type MediaLifecycleStatus = "staging" | "processing" | "ready" | "failed" | "pending_delete" | "deleted"

export async function uploadCabinAsset(file: File, userId: string, makeCover: boolean, originalName = file.name): Promise<AdminCabinImage> {
  const processed = await processUploadedImage(file)
  const safeName = safeOriginalName(originalName)
  if (!hasSupabaseConfig()) {
    if (process.env.NODE_ENV === "production") throw new Error("El almacenamiento de imágenes no está configurado.")
    return { id: `dev-${randomUUID()}`, assetId: `dev:${randomUUID()}`, url: `data:${processed.mime};base64,${processed.bytes.toString("base64")}`, name: safeName, size: processed.bytes.length, type: processed.mime, isCover: makeCover, pendingUpload: true }
  }

  const authenticated = await createSupabaseServerClient()
  const assetId = randomUUID()
  const sourcePath = `${userId}/cabins/staging/${assetId}.${processed.extension}`
  const publicPath = `${userId}/cabins/${assetId}.${processed.extension}`
  let service: ReturnType<typeof createSupabaseServiceClient> | null = null
  let stage: "configuration" | "private_upload" | "metadata" | "public_upload" | "finalize" = "configuration"
  let sourceUploaded = false
  let publicUploaded = false
  let metadataInserted = false
  try {
    service = createSupabaseServiceClient()
    stage = "private_upload"
    const sourceUpload = await authenticated.storage.from("admin-media").upload(sourcePath, processed.bytes, { contentType: processed.mime, upsert: false })
    if (sourceUpload.error) throw sourceUpload.error
    sourceUploaded = true

    stage = "metadata"
    const inserted = await authenticated.from("media_assets").insert({
      id: assetId, source_bucket: "admin-media", source_path: sourcePath, original_name: safeName,
      mime_type: processed.mime, extension: processed.extension, byte_size: processed.bytes.length, width: processed.width,
      height: processed.height, sha256: processed.sha256, processing_status: "staging", uploaded_by: userId,
    }).select("id").single()
    if (inserted.error) throw inserted.error
    metadataInserted = true

    stage = "public_upload"
    const publicUpload = await service.storage.from("public-media").upload(publicPath, processed.bytes, { contentType: processed.mime, upsert: false })
    if (publicUpload.error) throw publicUpload.error
    publicUploaded = true

    const { data: publicUrlData } = service.storage.from("public-media").getPublicUrl(publicPath)
    const canonicalPublicUrl = publicUrlData.publicUrl
    stage = "finalize"
    const finalized = await service.from("media_assets").update({
      public_bucket: "public-media",
      public_path: publicPath,
      canonical_public_url: canonicalPublicUrl,
      processing_status: "ready",
    }).eq("id", assetId).eq("processing_status", "staging").select("id").single()
    if (finalized.error) throw finalized.error
    return { id: `pending-${assetId}`, assetId, url: canonicalPublicUrl, name: safeName, size: processed.bytes.length, type: processed.mime, isCover: makeCover, pendingUpload: true }
  } catch (error) {
    console.error(`Cabin media pipeline failed at ${stage}:`, error)
    if (service) {
      if (publicUploaded) await service.storage.from("public-media").remove([publicPath])
      if (sourceUploaded) await service.storage.from("admin-media").remove([sourcePath])
      if (metadataInserted) await service.from("media_assets").delete().eq("id", assetId)
    }
    const messages = {
      configuration: "El almacenamiento de imágenes no está configurado en el servidor.",
      private_upload: "No pudimos guardar la copia privada de la imagen.",
      metadata: "No pudimos registrar la imagen de forma segura.",
      public_upload: "No pudimos preparar la imagen para el catálogo.",
      finalize: "No pudimos finalizar la imagen para el catálogo.",
    }
    throw new Error(messages[stage])
  }
}

async function hasActiveReferences(assetId: string) {
  const service = createSupabaseServiceClient()
  const [cabins, promotions] = await Promise.all([
    service.from("cabin_images").select("id", { count: "exact", head: true }).eq("asset_id", assetId).is("deleted_at", null),
    service.from("promotion_images").select("id", { count: "exact", head: true }).eq("asset_id", assetId).is("deleted_at", null),
  ])
  if (cabins.error || promotions.error) throw new Error("No se pudieron verificar las referencias de la imagen.")
  return (cabins.count ?? 0) > 0 || (promotions.count ?? 0) > 0
}

export async function discardCabinAssets(assetIds: string[], uploadedBy?: string) {
  const ids = [...new Set(assetIds.filter((id) => id && !id.startsWith("dev:")))]
  if (!hasSupabaseConfig() || ids.length === 0) return
  const service = createSupabaseServiceClient()

  for (const id of ids) {
    if (await hasActiveReferences(id)) continue
    let query = service.from("media_assets")
      .select("id, uploaded_by, source_bucket, source_path, public_bucket, public_path, processing_status")
      .eq("id", id)
      .is("deleted_at", null)
    if (uploadedBy) query = query.eq("uploaded_by", uploadedBy)
    const { data: asset, error } = await query.maybeSingle()
    if (error) throw new Error("No se pudo consultar la imagen pendiente.")
    if (!asset || asset.processing_status === "deleted" || asset.processing_status === "pending_delete") continue
    const sourceSegments = asset.source_path.split("/")
    if (sourceSegments[1] !== "cabins" || sourceSegments[2] !== "staging") continue

    const previousStatus = asset.processing_status as MediaLifecycleStatus
    const claimed = await service.from("media_assets")
      .update({ processing_status: "pending_delete" })
      .eq("id", id)
      .eq("processing_status", previousStatus)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle()
    if (claimed.error) throw new Error("No se pudo preparar la limpieza de la imagen.")
    if (!claimed.data) continue

    if (await hasActiveReferences(id)) {
      await service.from("media_assets").update({ processing_status: previousStatus }).eq("id", id).eq("processing_status", "pending_delete")
      continue
    }

    const removals = await Promise.all([
      service.storage.from(asset.source_bucket).remove([asset.source_path]),
      asset.public_bucket && asset.public_path
        ? service.storage.from(asset.public_bucket).remove([asset.public_path])
        : Promise.resolve({ error: null }),
    ])
    if (removals.some((result) => result.error)) continue
    await service.from("media_assets")
      .update({ processing_status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("processing_status", "pending_delete")
  }
}
