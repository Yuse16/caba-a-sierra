import { NextResponse } from "next/server"
import { getPanelSession } from "@/lib/auth/session"
import { uploadAdminMedia } from "@/lib/admin-media/service.server"

export async function POST(request: Request) {
  try {
    const input = await request.json()
    const session = await getPanelSession()
    if (!session) return NextResponse.json({ ok: false, error: "no-session" })
    const data = await uploadAdminMedia(input, session.userId)
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error("DEBUG upload error:", e)
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
