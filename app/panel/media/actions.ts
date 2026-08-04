"use server"

import { unstable_rethrow } from "next/navigation"
import { discardAdminMedia, uploadAdminMedia } from "@/lib/admin-media/service.server"
import type { AdminMediaScope, AdminMediaUpload, AdminMediaUploadInput } from "@/lib/admin-media/types"
import { requirePermission } from "@/lib/auth/session"

export type AdminMediaActionResult =
  | { ok: true; data: AdminMediaUpload }
  | { ok: false; message: string }

function permissionFor(scope: AdminMediaScope) {
  return scope === "cabins" ? "catalog.write" as const : "promotions.write" as const
}

export async function uploadAdminMediaAction(input: AdminMediaUploadInput): Promise<AdminMediaActionResult> {
  try {
    const session = await requirePermission(permissionFor(input.scope))
    return { ok: true, data: await uploadAdminMedia(input, session.userId) }
  } catch (error) {
    unstable_rethrow(error)
    console.error("uploadAdminMediaAction", error)
    return { ok: false, message: error instanceof Error ? error.message : "No pudimos subir la imagen. Intenta nuevamente." }
  }
}

export async function discardAdminMediaAction(assetIds: string[], scope: AdminMediaScope) {
  try {
    await requirePermission(permissionFor(scope))
    await discardAdminMedia(assetIds)
    return { ok: true as const }
  } catch (error) {
    unstable_rethrow(error)
    console.error("discardAdminMediaAction", error)
    return { ok: false as const, message: "No pudimos limpiar una imagen pendiente; se intentará nuevamente después." }
  }
}
