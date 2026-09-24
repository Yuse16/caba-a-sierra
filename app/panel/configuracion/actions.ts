"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { requirePermission } from "@/lib/auth/session"
import { discardAdminMedia, finalizeAdminMedia, returnAdminMediaToStaging } from "@/lib/admin-media/service.server"
import { getAdminSiteSettings, saveAdminSiteSettings } from "@/lib/admin-settings/repository.server"
import { normalizeWhatsappNumber, validateSiteSettings } from "@/lib/admin-settings/types"

export type SaveSiteSettingsResult = { ok: true; message: string } | { ok: false; message: string }

function isFrameworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const digest = (error as { digest?: unknown }).digest
  return typeof digest === "string" && digest.startsWith("NEXT_")
}

export async function saveSiteSettingsAction(input: {
  businessName: string
  subtitle: string
  tagline: string
  heroAssetId: string
  whatsappNumber: string
  phoneDisplay: string
  email: string
  generalLocation: string
  businessHours: string
  officeAddress: string
  officeMapsUrl: string
}): Promise<SaveSiteSettingsResult> {
  let finalizedIds: string[] = []
  try {
    const session = await requirePermission("settings.manage")
    const normalized = { ...input, whatsappNumber: normalizeWhatsappNumber(input.whatsappNumber) }
    const validationErrors = validateSiteSettings(normalized)
    if (Object.keys(validationErrors).length > 0) {
      return { ok: false, message: validationErrors[Object.keys(validationErrors)[0] as keyof typeof validationErrors] ?? "Revisa los datos marcados." }
    }

    const previous = await getAdminSiteSettings()
    finalizedIds = await finalizeAdminMedia(normalized.heroAssetId ? [normalized.heroAssetId] : [], session.userId, session.role)
    const saved = await saveAdminSiteSettings(normalized, session.userId)
    if (previous.heroAssetId && previous.heroAssetId !== saved.heroAssetId) {
      await discardAdminMedia([previous.heroAssetId])
    }
    revalidatePath("/panel/configuracion")
    revalidatePath("/")
    revalidateTag("public-site-config", "max")
    return { ok: true, message: "La configuración pública se guardó correctamente." }
  } catch (error) {
    if (isFrameworkError(error)) throw error
    await returnAdminMediaToStaging(finalizedIds)
    console.error("saveSiteSettingsAction", error)
    return { ok: false, message: error instanceof Error && (error.message.includes("imagen") || error.message.includes("Imagen")) ? error.message : "No pudimos guardar la configuración. Intenta nuevamente." }
  }
}