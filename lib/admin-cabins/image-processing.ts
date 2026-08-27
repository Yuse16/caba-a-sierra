import type { AdminCabinImage } from "./types"

export const MAX_CABIN_IMAGES = 10
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export type ImageValidationResult = {
  valid: File[]
  errors: string[]
}

export function validateImageFiles(files: File[], currentCount: number): ImageValidationResult {
  const valid: File[] = []
  const errors: string[] = []
  let remaining = Math.max(0, MAX_CABIN_IMAGES - currentCount)

  for (const file of files) {
    if (remaining === 0) {
      errors.push(`Puedes guardar hasta ${MAX_CABIN_IMAGES} fotografías.`)
      break
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      errors.push(`${file.name}: usa una imagen JPG, PNG o WebP.`)
      continue
    }
    if (file.size > MAX_IMAGE_SIZE) {
      errors.push(`${file.name}: la imagen supera el límite de 10 MB.`)
      continue
    }
    valid.push(file)
    remaining -= 1
  }

  return { valid, errors: [...new Set(errors)] }
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
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`${file.name}: no pudimos abrir esta imagen.`))
    }
    image.src = objectUrl
  })
}

export async function prepareCabinImage(file: File, makeCover: boolean): Promise<AdminCabinImage> {
  let output: Blob = file

  try {
    const source = await loadImage(file)
    const maxDimension = 1600
    const scale = Math.min(1, maxDimension / Math.max(source.naturalWidth, source.naturalHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(source.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(source.naturalHeight * scale))
    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(source, 0, 0, canvas.width, canvas.height)
      const compressed = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.82),
      )
      if (compressed && compressed.size < file.size) output = compressed
    }
  } catch {
    output = file
  }

  let url: string
  try {
    url = await readFileAsDataUrl(output)
  } catch {
    url = await readFileAsDataUrl(file)
  }

  return {
    id: `image-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
    assetId: null,
    url,
    name: file.name,
    size: output.size,
    type: output.type || file.type,
    isCover: makeCover,
  }
}
