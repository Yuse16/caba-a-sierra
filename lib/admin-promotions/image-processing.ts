import type { AdminPromotionImage } from "./types"

export const MAX_PROMOTION_IMAGE_SIZE = 5 * 1024 * 1024
export const ALLOWED_PROMOTION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export function validatePromotionImage(file: File) {
  if (!ALLOWED_PROMOTION_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_PROMOTION_IMAGE_TYPES)[number])) return "Usa una imagen JPG, PNG o WebP."
  if (file.size > MAX_PROMOTION_IMAGE_SIZE) return "La imagen supera el límite de 5 MB."
  return null
}

function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("No pudimos leer la imagen."))
    reader.readAsDataURL(file)
  })
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("No pudimos abrir la imagen.")) }
    image.src = objectUrl
  })
}

export async function preparePromotionImage(file: File): Promise<AdminPromotionImage> {
  let output: Blob = file
  try {
    const source = await loadImage(file)
    const maxDimension = 1800
    const scale = Math.min(1, maxDimension / Math.max(source.naturalWidth, source.naturalHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(source.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(source.naturalHeight * scale))
    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(source, 0, 0, canvas.width, canvas.height)
      const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84))
      if (webp && webp.size < file.size) output = webp
    }
  } catch {
    output = file
  }
  return { assetId: null, url: await readFileAsDataUrl(output), name: file.name, size: output.size, type: output.type || file.type }
}
