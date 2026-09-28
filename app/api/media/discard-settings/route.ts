import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth/session"
import { discardAdminMedia } from "@/lib/admin-media/service.server"

export async function POST(request: Request) {
  try {
    await requirePermission("settings.manage")
    const { assetIds }: { assetIds: string[] } = await request.json()
    await discardAdminMedia(assetIds)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("POST /api/media/discard-settings", error)
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "No pudimos limpiar la imagen." },
      { status: 200 },
    )
  }
}