import { NextResponse } from "next/server"
import { uploadAdminMedia } from "@/lib/admin-media/service.server"
import type { AdminMediaUploadInput } from "@/lib/admin-media/types"
import { requirePermission } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const session = await requirePermission("catalog.write")
    const input: AdminMediaUploadInput = await request.json()
    const data = await uploadAdminMedia(input, session.userId)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error("POST /api/media/upload", error)
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "No pudimos subir la imagen." },
      { status: 200 },
    )
  }
}
