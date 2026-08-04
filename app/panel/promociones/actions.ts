"use server"

import { revalidatePath } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { createAdminPromotionRepository } from "@/lib/admin-promotions/repository.server"
import { getEffectivePromotionStatus } from "@/lib/admin-promotions/service"
import type { AdminPromotion, AdminPromotionInput, AdminPromotionStatus } from "@/lib/admin-promotions/types"
import { validatePromotion } from "@/lib/admin-promotions/validation"
import { requirePermission } from "@/lib/auth/session"
import { discardAdminMedia, finalizeAdminMedia, returnAdminMediaToStaging } from "@/lib/admin-media/service.server"

export type PromotionsActionResult = { ok: true; data: AdminPromotion[]; message?: string } | { ok: false; message: string }
export type PromotionActionResult = { ok: true; data?: AdminPromotion; message: string } | { ok: false; message: string }

function publicMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : ""
  if (message.includes("imagen") || message.includes("Imagen")) return message
  return fallback
}

function refreshPromotionPages() {
  revalidatePath("/")
  revalidatePath("/panel/promociones")
}

export async function loadAdminPromotionsAction(): Promise<PromotionsActionResult> {
  try {
    await requirePermission("promotions.read")
    return { ok: true, data: await createAdminPromotionRepository().list() }
  } catch (error) {
    unstable_rethrow(error)
    console.error("loadAdminPromotionsAction", error)
    return { ok: false, message: "No pudimos cargar las promociones. Revisa tu conexión e intenta nuevamente." }
  }
}

export async function saveAdminPromotionAction(input: AdminPromotionInput, id?: string): Promise<PromotionActionResult> {
  let finalizedIds: string[] = []
  try {
    const session = await requirePermission("promotions.write")
    if (input.status !== "draft" && input.status !== "hidden") {
      await requirePermission("promotions.publish")
      if (Object.keys(validatePromotion(input, true)).length) return { ok: false, message: "Agrega una imagen y un nombre antes de publicar." }
    }
    const repository = createAdminPromotionRepository()
    const previous = id ? await repository.findById(id) : null
    finalizedIds = await finalizeAdminMedia(input.image?.assetId ? [input.image.assetId] : [], session.userId, session.role)
    const saved = await repository.save(input, session.userId, id)
    if (previous?.image?.assetId && previous.image.assetId !== saved.image?.assetId) await discardAdminMedia([previous.image.assetId])
    refreshPromotionPages()
    const message = id
      ? saved.status === "draft" || saved.status === "hidden" ? "Los cambios se guardaron." : "El contenido ya está publicado."
      : "La promoción se creó correctamente."
    return { ok: true, data: saved, message }
  } catch (error) {
    unstable_rethrow(error)
    await returnAdminMediaToStaging(finalizedIds)
    console.error("saveAdminPromotionAction", error)
    return { ok: false, message: publicMessage(error, "No pudimos guardar la promoción. Intenta nuevamente.") }
  }
}

export async function setAdminPromotionStatusAction(id: string, status: AdminPromotionStatus): Promise<PromotionActionResult> {
  try {
    const session = await requirePermission("promotions.publish")
    const repository = createAdminPromotionRepository()
    const current = await repository.findById(id)
    if (!current) return { ok: false, message: "No encontramos esa promoción." }
    if ((status === "active" || status === "scheduled") && Object.keys(validatePromotion({ ...current, status }, true)).length) {
      return { ok: false, message: "Agrega una imagen y un nombre antes de publicar." }
    }
    const saved = await repository.setStatus(id, status, session.userId)
    if (!saved) return { ok: false, message: "No encontramos esa promoción." }
    refreshPromotionPages()
    const effective = getEffectivePromotionStatus(saved)
    return { ok: true, data: saved, message: status === "hidden" ? "La promoción fue ocultada." : effective === "scheduled" ? "La promoción quedó programada." : effective === "expired" ? "Actualiza las fechas antes de volver a mostrarla." : "La promoción ya está visible en la página." }
  } catch (error) {
    unstable_rethrow(error)
    console.error("setAdminPromotionStatusAction", error)
    return { ok: false, message: "No pudimos cambiar la visibilidad. Intenta nuevamente." }
  }
}

export async function deleteAdminPromotionAction(id: string): Promise<PromotionActionResult> {
  try {
    const session = await requirePermission("content.delete")
    const repository = createAdminPromotionRepository()
    const current = await repository.findById(id)
    const removed = await repository.remove(id, session.userId)
    if (!removed) return { ok: false, message: "No encontramos esa promoción." }
    if (current?.image?.assetId) await discardAdminMedia([current.image.assetId])
    refreshPromotionPages()
    return { ok: true, message: "La promoción fue eliminada." }
  } catch (error) {
    unstable_rethrow(error)
    console.error("deleteAdminPromotionAction", error)
    return { ok: false, message: "No pudimos eliminar la promoción o no tienes permiso para hacerlo." }
  }
}

export async function reorderAdminPromotionsAction(ids: string[]): Promise<PromotionsActionResult> {
  try {
    const session = await requirePermission("promotions.write")
    const data = await createAdminPromotionRepository().reorder(ids, session.userId)
    refreshPromotionPages()
    return { ok: true, data, message: "El orden de las promociones fue actualizado." }
  } catch (error) {
    unstable_rethrow(error)
    console.error("reorderAdminPromotionsAction", error)
    return { ok: false, message: "No pudimos cambiar el orden. Intenta nuevamente." }
  }
}
