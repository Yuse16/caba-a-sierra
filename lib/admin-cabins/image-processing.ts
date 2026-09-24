export const MAX_IMAGE_SIZE = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export type ImageValidationResult = {
  valid: File[]
  errors: string[]
}

export function validateImageFiles(files: File[]): ImageValidationResult {
  const valid: File[] = []
  const errors: string[] = []

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      errors.push(`${file.name}: usa una imagen JPG, PNG o WebP.`)
      continue
    }
    if (file.size > MAX_IMAGE_SIZE) {
      errors.push(`${file.name}: la imagen supera el límite de 5 MB.`)
      continue
    }
    valid.push(file)
  }

  return { valid, errors: [...new Set(errors)] }
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

function extensionFor(type: string) {
  if (type === "image/jpeg") return "jpg"
  if (type === "image/png") return "png"
  return "webp"
}

export async function prepareCabinImageUpload(file: File): Promise<File> {
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
      if (compressed) output = compressed
    }
  } catch {
    output = file
  }

  const outputType = output.type || file.type
  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen"
  return new File([output], `${baseName}.${extensionFor(outputType)}`, {
    type: outputType,
    lastModified: file.lastModified,
  })
}
