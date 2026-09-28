import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth/session"
import { uploadAdminMedia } from "@/lib/admin-media/service.server"
import type { AdminMediaUploadInput } from "@/lib/admin-media/types"

export async function POST(request: Request) {
  try {
    const session = await requirePermission("settings.manage")
    const input: AdminMediaUploadInput = await request.json()
    const data = await uploadAdminMedia({ ...input, scope: "settings" }, session.userId)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error("POST /api/media/upload-settings", error)
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "No pudimos subir la imagen." },
      { status: 200 },
    )
  }
}