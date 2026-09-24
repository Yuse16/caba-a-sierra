export const MAX_MEDIA_BYTES = 5 * 1024 * 1024
export const MAX_MEDIA_PIXELS = 40_000_000
export const MAX_MEDIA_DIMENSION = 1_600

export type SupportedImage = {
  mime: "image/jpeg" | "image/png" | "image/webp"
  extension: "jpg" | "jpeg" | "png" | "webp"
}

const extensionsByMime: Record<SupportedImage["mime"], readonly SupportedImage["extension"][]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
}

export function normalizedExtension(name: string) {
  return name.split(".").pop()?.toLocaleLowerCase("en-US") ?? ""
}

export function detectImageMime(bytes: Uint8Array): SupportedImage["mime"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png"
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp"
  return null
}

export function validateImageEnvelope(input: { name: string; type: string; size: number; bytes: Uint8Array }): SupportedImage {
  if (input.size < 1) throw new Error("El archivo está vacío.")
  if (input.size > MAX_MEDIA_BYTES) throw new Error("La imagen supera el límite de 5 MB.")
  const mime = detectImageMime(input.bytes)
  if (!mime) throw new Error("El contenido no corresponde a una imagen JPG, PNG o WebP válida.")
  if (input.type !== mime) throw new Error("El tipo declarado del archivo no coincide con su contenido.")
  const extension = normalizedExtension(input.name)
  if (!extensionsByMime[mime].includes(extension as SupportedImage["extension"])) throw new Error("La extensión del archivo no coincide con su contenido.")
  return { mime, extension: extension as SupportedImage["extension"] }
}

export function safeOriginalName(name: string) {
  const value = name.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").replace(/[\\/]/g, "-").trim()
  return (value || "imagen").slice(0, 180)
}
