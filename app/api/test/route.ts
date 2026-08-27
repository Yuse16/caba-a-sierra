import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const session = await requirePermission("catalog.write")
    return NextResponse.json({ ok: true, userId: session.userId })
  } catch (error) {
    console.error("POST /api/test-auth", error)
    return NextResponse.json({ ok: false, error: String(error) })
  }
}
