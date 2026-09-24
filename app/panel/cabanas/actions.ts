"use server"

import { revalidatePath } from "next/cache"
import { createAdminCabinRepository } from "@/lib/admin-cabins/repository.server"
import { getMissingPublicationFields, type AdminCabin, type AdminCabinInput, type AdminCabinStatus } from "@/lib/admin-cabins/types"
import { requirePermission, type PanelSession } from "@/lib/auth/session"
import { hasPermission } from "@/lib/auth/permissions"
import { finalizeAdminMedia, returnAdminMediaToStaging } from "@/lib/admin-media/service.server"
import { discardCabinAssets } from "@/lib/media/media-storage.server"

function redactOwnerFor(role: PanelSession["role"]) {
  const allowed = hasPermission(role, "owners.read_sensitive")
  return (cabin: AdminCabin): AdminCabin => allowed ? cabin : { ...cabin, owner: null }
}

export type CabinsActionResult = { ok: true; data: AdminCabin[]; message?: string } | { ok: false; message: string }
export type CabinActionResult = { ok: true; data: AdminCabin; message: string } | { ok: false; message: string }

function isFrameworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const digest = (error as { digest?: unknown }).digest
  return typeof digest === "string" && digest.startsWith("NEXT_")
}

function safeMutationMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : ""
  if (message.includes("imagen") || message.includes("Imagen") || message.includes("Tu rol no permite retirar servicios")) return message
  return fallback
}

function refreshCabinPages() {
  revalidatePath("/")
  revalidatePath("/panel/cabanas")
}

export async function loadAdminCabinsAction(): Promise<CabinsActionResult> {
  try {
    const session = await requirePermission("catalog.read")
    const redact = redactOwnerFor(session.role)
    return { ok: true, data: (await createAdminCabinRepository().list()).map(redact) }
  } catch (error) {
    if (isFrameworkError(error)) throw error
    console.error("loadAdminCabinsAction", error)
    return { ok: false, message: "No pudimos cargar las cabañas. Revisa tu conexión e intenta nuevamente." }
  }
}

export async function saveAdminCabinAction(input: AdminCabinInput, id?: string): Promise<CabinActionResult> {
  let finalizedIds: string[] = []
  try {
    const session = await requirePermission("catalog.write")
    if (input.owner) await requirePermission("owners.read_sensitive")
    if (input.status === "published") {
      await requirePermission("catalog.publish")
      if (getMissingPublicationFields(input).length) return { ok: false, message: "Completa la información pendiente antes de publicar." }
    }
    const repository = createAdminCabinRepository()
    const previous = id ? await repository.findById(id) : null
    finalizedIds = await finalizeAdminMedia(input.images.flatMap((image) => image.assetId ? [image.assetId] : []), session.userId, session.role)
    const saved = await repository.save(input, session.userId, id)
    const redact = redactOwnerFor(session.role)
    const currentAssetIds = new Set(saved.images.flatMap((image) => image.assetId ? [image.assetId] : []))
    const replacedAssetIds = previous?.images.flatMap((image) => image.assetId && !currentAssetIds.has(image.assetId) ? [image.assetId] : []) ?? []
    try {
      await discardCabinAssets(replacedAssetIds)
    } catch (cleanupError) {
      console.error("saveAdminCabinAction cleanup", cleanupError)
    }
    refreshCabinPages()
    return {
      ok: true,
      data: redact(saved),
      message: id ? input.status === "published" ? "El contenido ya está publicado." : "Los cambios se guardaron." : "La cabaña se creó correctamente.",
    }
  } catch (error) {
    if (isFrameworkError(error)) throw error
    await returnAdminMediaToStaging(finalizedIds)
    console.error("saveAdminCabinAction", error)
    return { ok: false, message: safeMutationMessage(error, "No pudimos guardar los cambios. Intenta nuevamente.") }
  }
}

export async function archiveAdminCabinAction(id: string): Promise<{ ok: boolean; message: string }> {
  try {
    const session = await requirePermission("content.delete")
    const repository = createAdminCabinRepository()
    const current = await repository.findById(id)
    if (!current) return { ok: false, message: "No encontramos esa cabaña." }
    const archived = await repository.archive(id, session.userId)
    if (!archived) return { ok: false, message: "No encontramos esa cabaña." }
    refreshCabinPages()
    return { ok: true, message: "La cabaña fue archivada." }
  } catch (error) {
    if (isFrameworkError(error)) throw error
    console.error("archiveAdminCabinAction", error)
    return { ok: false, message: "No pudimos archivar la cabaña o no tienes permiso para hacerlo." }
  }
}

export async function restoreAdminCabinAction(id: string): Promise<CabinActionResult> {
  try {
    const session = await requirePermission("content.delete")
    const restored = await createAdminCabinRepository().restore(id, session.userId)
    if (!restored) return { ok: false, message: "No encontramos esa cabaña archivada." }
    refreshCabinPages()
    return { ok: true, data: redactOwnerFor(session.role)(restored), message: "La cabaña fue restaurada como borrador." }
  } catch (error) {
    if (isFrameworkError(error)) throw error
    console.error("restoreAdminCabinAction", error)
    return { ok: false, message: "No pudimos restaurar la cabaña o no tienes permiso para hacerlo." }
  }
}

export async function setAdminCabinStatusAction(id: string, status: AdminCabinStatus): Promise<CabinActionResult> {
  try {
    const session = await requirePermission("catalog.publish")
    const repository = createAdminCabinRepository()
    const current = await repository.findById(id)
    if (!current) return { ok: false, message: "No encontramos esa cabaña." }
    if (status === "published") {
      const input: AdminCabinInput = {
        name: current.name, shortDescription: current.shortDescription, description: current.description,
        nightlyPrice: current.nightlyPrice, maxGuests: current.maxGuests, bedrooms: current.bedrooms, beds: current.beds, bedDistribution: current.bedDistribution,
        bathrooms: current.bathrooms, services: current.services, rules: current.rules, checkInTime: current.checkInTime,
        checkOutTime: current.checkOutTime, acceptsPets: current.acceptsPets, location: current.location,
        address: current.address, zone: current.zone, latitude: current.latitude, longitude: current.longitude,
        mapsUrl: current.mapsUrl, poolType: current.poolType, whatsapp: current.whatsapp, owner: current.owner,
        archivedAt: current.archivedAt, status: current.status, images: current.images,
      }
      if (getMissingPublicationFields(input).length) return { ok: false, message: "Completa la información pendiente antes de publicar." }
    }
    const saved = await repository.setStatus(id, status, session.userId)
    if (!saved) return { ok: false, message: "No encontramos esa cabaña." }
    refreshCabinPages()
    return { ok: true, data: redactOwnerFor(session.role)(saved), message: status === "published" ? "La cabaña ya está publicada." : "La cabaña quedó oculta." }
  } catch (error) {
    if (isFrameworkError(error)) throw error
    console.error("setAdminCabinStatusAction", error)
    return { ok: false, message: "No pudimos cambiar el estado. Intenta nuevamente." }
  }
}
