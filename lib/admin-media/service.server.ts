import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { AdminRole } from "@/lib/auth/permissions"
import type { AdminMediaUpload, AdminMediaUploadInput } from "./types"

const SOURCE_BUCKET = "admin-media"
const PUBLIC_BUCKET = "public-media"
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const dataUrlPattern = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/

type AllowedMime = AdminMediaUpload["type"]

function safeOriginalName(value: string) {
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)
  return clean || "imagen"
}

function detectedMime(bytes: Buffer): AllowedMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png"
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp"
  return null
}

function extensionFor(mime: AllowedMime) {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  return "webp"
}

function readUInt16BE(buffer: Buffer, offset: number) {
  return (buffer[offset] << 8) | buffer[offset + 1]
}

function readUInt32BE(buffer: Buffer, offset: number) {
  return (buffer[offset] * 0x1000000) + ((buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3])
}

function decodeDimensions(bytes: Buffer, mime: AllowedMime): { width: number; height: number } | null {
  try {
    if (mime === "image/jpeg") {
      let offset = 2
      while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) { offset += 1; continue }
        const marker = bytes[offset + 1]
        if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue }
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
          return { height: readUInt16BE(bytes, offset + 5), width: readUInt16BE(bytes, offset + 7) }
        }
        const length = readUInt16BE(bytes, offset + 2)
        if (length < 2) return null
        offset += 2 + length
      }
      return null
    }
    if (mime === "image/png") {
      if (bytes.length < 24) return null
      return { width: readUInt32BE(bytes, 16), height: readUInt32BE(bytes, 20) }
    }
    if (mime === "image/webp") {
      if (bytes.length < 30) return null
      const isVp8x = bytes.toString("ascii", 12, 16) === "VP8X"
      const isVp8l = bytes.toString("ascii", 12, 16) === "VP8L"
      const isVp8 = bytes.toString("ascii", 12, 16) === "VP8 "
      if (isVp8x) {
        const width = 1 + readUInt24LE(bytes, 24)
        const height = 1 + readUInt24LE(bytes, 27)
        return { width, height }
      }
      if (isVp8l) {
        const bits = bytes.readUInt32LE(21)
        const width = (bits & 0x3fff) + 1
        const height = ((bits >> 14) & 0x3fff) + 1
        return { width, height }
      }
      if (isVp8) {
        const width = bytes.readUInt16LE(26) & 0x3fff
        const height = bytes.readUInt16LE(28) & 0x3fff
        return { width, height }
      }
      return null
    }
    return null
  } catch {
    return null
  }
}

function readUInt24LE(buffer: Buffer, offset: number) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
}

async function validateAndOptimize(input: AdminMediaUploadInput) {
  const match = input.dataUrl.match(dataUrlPattern)
  if (!match) throw new Error("La imagen no tiene un formato válido. Usa JPG, PNG o WebP.")
  const claimedMime = match[1] as AllowedMime
  const source = Buffer.from(match[2], "base64")
  if (source.length === 0 || source.length > MAX_IMAGE_BYTES) throw new Error("La imagen debe pesar como máximo 10 MB.")
  const actualMime = detectedMime(source)
  if (!actualMime || actualMime !== claimedMime) throw new Error("El contenido de la imagen no coincide con su formato.")

  const dimensions = decodeDimensions(source, actualMime)
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
    throw new Error("No pudimos leer las dimensiones de la imagen.")
  }

  return {
    bytes: source,
    mime: actualMime,
    extension: extensionFor(actualMime),
    width: dimensions.width,
    height: dimensions.height,
    originalName: safeOriginalName(input.originalName),
    sha256: createHash("sha256").update(source).digest("hex"),
  }
}

async function removeStorageObjects(sourceBucket: string, sourcePath: string, publicBucket: string | null, publicPath: string | null) {
  const supabase = await createSupabaseServerClient()
  const sourceResult = await supabase.storage.from(sourceBucket).remove([sourcePath])
  const publicResult = publicBucket && publicPath ? await supabase.storage.from(publicBucket).remove([publicPath]) : { error: null }
  return !sourceResult.error && !publicResult.error
}

export async function uploadAdminMedia(input: AdminMediaUploadInput, actorId: string): Promise<AdminMediaUpload> {
  const prepared = await validateAndOptimize(input)
  if (!hasSupabaseConfig()) {
    return {
      assetId: `dev:${randomUUID()}`,
      url: `data:${prepared.mime};base64,${prepared.bytes.toString("base64")}`,
      name: prepared.originalName,
      size: prepared.bytes.length,
      type: prepared.mime,
      width: prepared.width,
      height: prepared.height,
      pendingUpload: false,
    }
  }

  const supabase = await createSupabaseServerClient()
  const uniqueName = `${randomUUID()}.${prepared.extension}`
  const sourcePath = `${actorId}/${input.scope}/staging/${uniqueName}`
  const publicPath = `${actorId}/${input.scope}/${uniqueName}`
  const uploadOptions = { contentType: prepared.mime, upsert: false }

  const sourceUpload = await supabase.storage.from(SOURCE_BUCKET).upload(sourcePath, prepared.bytes, {
    ...uploadOptions,
    cacheControl: "3600",
  })
  if (sourceUpload.error) throw new Error("No pudimos subir la imagen privada. Intenta nuevamente.")

  const publicUpload = await supabase.storage.from(PUBLIC_BUCKET).upload(publicPath, prepared.bytes, {
    ...uploadOptions,
    cacheControl: "31536000",
  })
  if (publicUpload.error) {
    await supabase.storage.from(SOURCE_BUCKET).remove([sourcePath])
    throw new Error("No pudimos preparar la imagen pública. Intenta nuevamente.")
  }

  const { data: asset, error: assetError } = await supabase.from("media_assets").insert({
    source_bucket: SOURCE_BUCKET,
    source_path: sourcePath,
    public_bucket: PUBLIC_BUCKET,
    public_path: publicPath,
    original_name: prepared.originalName,
    mime_type: prepared.mime,
    extension: prepared.extension,
    byte_size: prepared.bytes.length,
    width: prepared.width,
    height: prepared.height,
    sha256: prepared.sha256,
    processing_status: "staging",
    uploaded_by: actorId,
  }).select("id").single()

  if (assetError || !asset) {
    await removeStorageObjects(SOURCE_BUCKET, sourcePath, PUBLIC_BUCKET, publicPath)
    throw new Error("No pudimos registrar la imagen. Intenta nuevamente.")
  }

  const { data: publicUrl } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(publicPath)
  return {
    assetId: asset.id,
    url: publicUrl.publicUrl,
    name: prepared.originalName,
    size: prepared.bytes.length,
    type: prepared.mime,
    width: prepared.width,
    height: prepared.height,
    pendingUpload: true,
  }
}

export async function finalizeAdminMedia(assetIds: string[], actorId: string, role: AdminRole) {
  const ids = [...new Set(assetIds.filter((id) => id && !id.startsWith("dev:")))]
  if (!hasSupabaseConfig() || ids.length === 0) return []
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("media_assets")
    .select("id, uploaded_by, processing_status")
    .in("id", ids)
    .is("deleted_at", null)
  if (error || !data || data.length !== ids.length) throw new Error("Una imagen ya no está disponible. Vuelve a subirla.")
  const pending = data.filter((asset) => asset.processing_status === "staging")
  if (data.some((asset) => asset.processing_status !== "staging" && asset.processing_status !== "ready")) {
    throw new Error("Una imagen todavía no está lista. Intenta nuevamente.")
  }
  if (pending.some((asset) => role !== "admin" && asset.uploaded_by !== actorId)) {
    throw new Error("No tienes permiso para usar una de las imágenes nuevas.")
  }
  const pendingIds = pending.map((asset) => asset.id)
  if (pendingIds.length) {
    const { error: updateError } = await supabase.from("media_assets").update({ processing_status: "ready" }).in("id", pendingIds)
    if (updateError) throw new Error("No pudimos finalizar las imágenes. Intenta nuevamente.")
  }
  return pendingIds
}

export async function returnAdminMediaToStaging(assetIds: string[]) {
  if (!hasSupabaseConfig() || assetIds.length === 0) return
  const supabase = await createSupabaseServerClient()
  await supabase.from("media_assets").update({ processing_status: "staging" }).in("id", assetIds).is("deleted_at", null)
}

async function assetHasActiveReferences(assetId: string) {
  const supabase = await createSupabaseServerClient()
  const [cabins, promotions] = await Promise.all([
    supabase.from("cabin_images").select("id").eq("asset_id", assetId).is("deleted_at", null).limit(1),
    supabase.from("promotion_images").select("id").eq("asset_id", assetId).is("deleted_at", null).limit(1),
  ])
  if (cabins.error || promotions.error) return true
  return Boolean(cabins.data?.length || promotions.data?.length)
}

export async function discardAdminMedia(assetIds: string[]) {
  const ids = [...new Set(assetIds.filter((id) => id && !id.startsWith("dev:")))]
  if (!hasSupabaseConfig() || ids.length === 0) return
  const supabase = await createSupabaseServerClient()

  for (const id of ids) {
    if (await assetHasActiveReferences(id)) continue
    const { data: asset, error } = await supabase.from("media_assets")
      .select("id, source_bucket, source_path, public_bucket, public_path")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle()
    if (error || !asset) continue
    await supabase.from("media_assets").update({ processing_status: "pending_delete" }).eq("id", id)
    const removed = await removeStorageObjects(asset.source_bucket, asset.source_path, asset.public_bucket, asset.public_path)
    await supabase.from("media_assets").update(removed
      ? { processing_status: "deleted" }
      : { processing_status: "pending_delete" }).eq("id", id)
  }
}
