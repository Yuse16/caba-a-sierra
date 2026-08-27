import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({ ok: true, received: !!body })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) })
  }
}
