import { NextResponse } from "next/server"
import sharp from "sharp"

export async function POST() {
  try {
    const out = await sharp(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")).metadata()
    return NextResponse.json({ ok: true, sharp: out.format })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
