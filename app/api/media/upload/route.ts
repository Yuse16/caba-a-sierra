import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth/session"
import { uploadCabinAsset } from "@/lib/media/media-storage.server"
import { MAX_MEDIA_BYTES } from "@/lib/media/image-validation"

export const runtime = "nodejs"

const MAX_MULTIPART_BYTES = MAX_MEDIA_BYTES + 512 * 1024
const MAX_CONCURRENT_UPLOADS = 2
let activeUploads = 0

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin || origin !== new URL(request.url).origin) throw new Error("La solicitud de carga no tiene un origen válido.")
}

export async function POST(request: Request) {
  let acquiredSlot = false
  try {
    assertSameOrigin(request)
    const contentLength = Number(request.headers.get("content-length") ?? "0")
    if (!Number.isFinite(contentLength) || contentLength < 1 || contentLength > MAX_MULTIPART_BYTES) {
      throw new Error("La imagen supera el límite de 5 MB.")
    }
    if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
      return NextResponse.json({ ok: false, message: "Hay otras imágenes procesándose. Intenta nuevamente en unos segundos." }, { status: 429 })
    }
    const session = await requirePermission("catalog.write")
    activeUploads += 1
    acquiredSlot = true
    const form = await request.formData()
    const file = form.get("file")
    const originalName = form.get("originalName")
    const makeCover = form.get("makeCover") === "true"
    if (!(file instanceof File)) throw new Error("Selecciona una imagen para continuar.")
    const data = await uploadCabinAsset(file, session.userId, makeCover, typeof originalName === "string" ? originalName : file.name)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error("POST /api/media/upload", error)
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "No pudimos subir la imagen." },
      { status: 200 },
    )
  } finally {
    if (acquiredSlot) activeUploads = Math.max(0, activeUploads - 1)
  }
}
