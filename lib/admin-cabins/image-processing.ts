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

export async function prepareCabinImageUpload(file: File): Promise<File> {
  return file
}
