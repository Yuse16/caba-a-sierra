import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth/session"
import { discardCabinAssets } from "@/lib/media/media-storage.server"

export async function POST(request: Request) {
  try {
    const session = await requirePermission("catalog.write")
    const { assetIds }: { assetIds: string[] } = await request.json()
    await discardCabinAssets(assetIds, session.userId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("POST /api/media/discard", error)
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "No pudimos limpiar la imagen." },
      { status: 200 },
    )
  }
}
